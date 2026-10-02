'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getExamById } from '@/lib/data';
import { getQuestionsByExam } from '@/lib/questions';
import { getSectionsForExam, getQuestionSectionName } from '@/lib/exam-config';
import { saveResult, saveWrongQuestion, saveResultToServer, saveWrongQuestionToServer } from '@/lib/storage';
import { calculateExamScore, ScoringResult } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import { Question } from '@/types';
import ListeningPlayer from '@/components/ListeningPlayer';

type ViewMode = 'quiz' | 'result';

let finalScoringResult: ScoringResult | null = null;
let finalAnswers: Record<string, string> = {};

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const examId = searchParams.get('id') || '';
  const exam = getExamById(examId);

  const questions = useMemo(() => {
    if (!examId) return [];
    const qs = getQuestionsByExam(examId);
    const configSections = getSectionsForExam(examId);
    if (configSections.length > 0) {
      const sectionOrder = configSections.map(s => s.name);
      return [...qs].sort((a, b) => {
        const aName = getQuestionSectionName(a, examId);
        const bName = getQuestionSectionName(b, examId);
        const ia = sectionOrder.indexOf(aName);
        const ib = sectionOrder.indexOf(bName);
        const oa = ia === -1 ? 999 : ia;
        const ob = ib === -1 ? 999 : ib;
        if (oa !== ob) return oa - ob;
        return a.number - b.number;
      });
    }
    return qs;
  }, [examId]);

  const sections = useMemo(() => {
    const configSections = examId ? getSectionsForExam(examId) : [];
    if (configSections.length > 0) {
      const sectionOrder = configSections.map(s => s.name);
      const seen = new Set<string>();
      for (const q of questions) {
        const name = getQuestionSectionName(q, examId);
        seen.add(name);
      }
      const arr = Array.from(seen);
      arr.sort((a, b) => {
        const ia = sectionOrder.indexOf(a);
        const ib = sectionOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
      return arr;
    }
    const seen: string[] = [];
    for (const q of questions) {
      if (!seen.includes(q.section)) seen.push(q.section);
    }
    return seen;
  }, [questions, examId]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('quiz');
  const [timeLeft, setTimeLeft] = useState(exam?.duration ? exam.duration * 60 : 0);
  const [timerActive, setTimerActive] = useState(true);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [jumpTo, setJumpTo] = useState('');

  const answersRef = useRef<Record<string, string>>({});
  const flaggedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && timerActive === false && viewMode === 'quiz') {
      finishExam();
    }
  }, [timeLeft, timerActive, viewMode]);

  useEffect(() => {
    if (!exam) {
      router.push('/exam');
    }
  }, [exam, router]);

  if (!exam || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中或试卷不存在...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const userAnswer = answers[currentQuestion.id] || '';
  const isFlagged = flagged.has(currentQuestion.id);

  const answeredCount = Object.values(answers).filter(a => a !== '').length;
  const flaggedCount = flagged.size;

  const selectAnswer = (option: string) => {
    setAnswers(prev => {
      const next = { ...prev, [currentQuestion.id]: option };
      answersRef.current = next;
      return next;
    });
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      flaggedRef.current = next;
      return next;
    });
  };

  const jumpToQuestion = (num: number) => {
    const idx = questions.findIndex(q => q.number === num && q.section === questions[currentIdx].section);
    if (idx >= 0) {
      setCurrentIdx(idx);
      window.speechSynthesis.cancel();
      return;
    }
    const globalIdx = questions.findIndex(q => q.number === num);
    if (globalIdx >= 0) {
      setCurrentIdx(globalIdx);
      window.speechSynthesis.cancel();
    }
  };

  const handleJumpSubmit = () => {
    const num = parseInt(jumpTo, 10);
    if (!isNaN(num)) {
      const idx = questions.findIndex((q, i) => {
        const sameSection = q.section === questions[currentIdx].section;
        return (sameSection && q.number === num) || (!questions.some(qq => qq.section === questions[currentIdx].section && qq.number === num) && q.number === num);
      });
      if (idx >= 0) {
        setCurrentIdx(idx);
        window.speechSynthesis.cancel();
      }
    }
    setJumpTo('');
  };

  const finishExam = () => {
    const currentAnswers = answersRef.current;
    const totalAnswered = Object.values(currentAnswers).filter(a => a !== '').length;

    if (totalAnswered === 0) {
      router.push(`/exam/${examId}`);
      return;
    }

    const scoringResult = calculateExamScore(examId, questions, currentAnswers);
    finalScoringResult = scoringResult;
    finalAnswers = { ...currentAnswers };

    const wrongQuestionIds: string[] = [];
    for (const q of questions) {
      if (q.type === 'writing' || q.type === 'translation') continue;
      const ua = currentAnswers[q.id];
      if (ua !== undefined && ua !== '' && ua !== q.answer) {
        wrongQuestionIds.push(q.id);
      }
    }

    for (const qId of wrongQuestionIds) {
      saveWrongQuestion(examId, qId, currentAnswers[qId]);
      if (session?.user) {
        saveWrongQuestionToServer(examId, qId, currentAnswers[qId]);
      }
    }

    const sectionResults = scoringResult.sections.map(s => ({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      rawScore: s.rawScore,
      maxRawScore: s.maxRawScore,
      reportedScoreEarned: s.reportedScoreEarned,
      reportedScoreTotal: s.reportedScoreTotal,
      correctCount: s.correctCount,
      questionCount: s.questionCount,
      answeredCount: s.answeredCount,
    }));

    const result = {
      examId,
      answers: currentAnswers,
      score: scoringResult.totalRawScore,
      totalScore: scoringResult.maxRawScore,
      correctCount: scoringResult.correctCount,
      wrongCount: wrongQuestionIds.length,
      wrongQuestions: wrongQuestionIds,
      completedAt: new Date().toISOString(),
      sectionResults,
      reportedScore: scoringResult.reportedScore,
      isComplete: scoringResult.isComplete,
    };
    saveResult(result);
    if (session?.user) {
      saveResultToServer(result);
    }
    setViewMode('result');
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      window.speechSynthesis.cancel();
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIdx]);

  const getQuestionStatus = (q: Question): 'current' | 'answered' | 'flagged' | 'unanswered' => {
    if (q.id === currentQuestion.id) return 'current';
    if (flagged.has(q.id)) return 'flagged';
    if (answers[q.id] && answers[q.id] !== '') return 'answered';
    return 'unanswered';
  };

  const statusColors: Record<string, string> = {
    current: 'bg-primary-600 text-white ring-2 ring-primary-300',
    answered: 'bg-blue-100 text-blue-700',
    flagged: 'bg-amber-100 text-amber-700',
    unanswered: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  };

  // ============ RESULT VIEW ============
  if (viewMode === 'result') {
    const sr = finalScoringResult!;
    const finalCorrect = sr.correctCount;
    const finalWrong = sr.answeredCount - sr.correctCount;
    const timedOut = timeLeft === 0;
    const savedAnswers = finalAnswers;

    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 rounded-lg border bg-white p-8 text-center shadow-sm">
            {timedOut && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
                考试时间已用完，已自动提交
              </div>
            )}
            {!sr.isComplete && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
                部分题目（示例数据），报告分按比例换算
              </div>
            )}
            <h1 className="mb-2 text-2xl font-bold text-gray-900">做题完成！</h1>
            <p className="mb-6 text-gray-500">{exam.title}</p>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-primary-50 p-4">
                <div className="text-2xl font-bold text-primary-600">{sr.reportedScore}</div>
                <div className="text-sm text-gray-600">报告分（满分{sr.totalReportedScore}）</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-2xl font-bold text-gray-700">{sr.totalRawScore} / {sr.maxRawScore}</div>
                <div className="text-sm text-gray-600">原始分</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <div className="text-2xl font-bold text-green-600">{finalCorrect}</div>
                <div className="text-sm text-gray-600">正确</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <div className="text-2xl font-bold text-red-600">{finalWrong}</div>
                <div className="text-sm text-gray-600">错误</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 text-sm text-gray-600">正确率</div>
              <div className="mx-auto h-3 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all"
                  style={{ width: `${sr.accuracy}%` }}
                />
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{sr.accuracy}%</div>
            </div>

            {sr.sections.length > 0 && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <div className="mb-3 text-sm font-medium text-gray-700">各部分得分</div>
                <div className="space-y-3">
                  {sr.sections.filter(s => s.hasQuestions).map(s => {
                    const pct = s.maxRawScore > 0
                      ? Math.round((s.rawScore / s.maxRawScore) * 100)
                      : 0;
                    return (
                      <div key={s.sectionId}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-700">{s.sectionName}</span>
                          <span className="font-medium text-gray-900">
                            {s.isSubjective ? (
                              <>待评分 <span className="text-gray-400">(满分 {s.reportedScoreTotal})</span></>
                            ) : (
                              <>{s.reportedScoreEarned} / {s.reportedScoreTotal}</>
                            )}
                            <span className="ml-2 text-gray-500">
                              ({s.correctCount}/{s.questionCount}题{s.isSubjective ? ' · 主观题' : ''})
                            </span>
                          </span>
                        </div>
                        {!s.isSubjective && (
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Link
                href={`/exam/${examId}`}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                返回试卷
              </Link>
              <button
                onClick={() => {
                  setAnswers({});
                  answersRef.current = {};
                  setFlagged(new Set());
                  flaggedRef.current = new Set();
                  setCurrentIdx(0);
                  setViewMode('quiz');
                  finalScoringResult = null;
                  finalAnswers = {};
                  setTimeLeft(exam?.duration ? exam.duration * 60 : 0);
                  setTimerActive(true);
                }}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                重新做题
              </button>
            </div>
          </div>

          {/* Full question review with explanations */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">全部题目解析</h2>
            {sections.map(section => {
              const sectionQuestions = questions.filter(q => getQuestionSectionName(q, examId) === section);
              return (
                <div key={section} className="mb-6">
                  <h3 className="mb-3 rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                    {section}
                  </h3>
                  <div className="space-y-3">
                    {sectionQuestions.map(q => {
                      const ua = savedAnswers[q.id] || '';
                      const isSubjective = q.type === 'writing' || q.type === 'translation';
                      const isCorrect = !isSubjective && ua === q.answer;
                      const isUnanswered = ua === '';
                      return (
                        <div
                          key={q.id}
                          className={cn(
                            'rounded-lg border-l-4 p-4',
                            isSubjective ? 'border-purple-300 bg-purple-50' :
                            isUnanswered ? 'border-gray-300 bg-gray-50' :
                            isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm text-gray-500">第{q.number}题</span>
                            {isSubjective ? (
                              <span className="rounded bg-purple-200 px-1.5 py-0.5 text-xs text-purple-700">
                                {isUnanswered ? '未作答' : '已作答 · 待评分'}
                              </span>
                            ) : isUnanswered ? (
                              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">未作答</span>
                            ) : isCorrect ? (
                              <span className="rounded bg-green-200 px-1.5 py-0.5 text-xs text-green-700">正确</span>
                            ) : (
                              <span className="rounded bg-red-200 px-1.5 py-0.5 text-xs text-red-700">错误</span>
                            )}
                          </div>
                          <p className="mb-2 text-sm text-gray-700">{q.content}</p>
                          {q.options && q.options.length > 0 && (
                            <div className="mb-2 grid grid-cols-2 gap-1 text-sm">
                              {q.options.map(opt => {
                                const key = opt.charAt(0);
                                const isUserPick = key === ua;
                                const isAnswer = key === q.answer;
                                return (
                                  <span
                                    key={key}
                                    className={cn(
                                      'rounded px-2 py-1',
                                      isAnswer && 'bg-green-200 text-green-800 font-medium',
                                      isUserPick && !isAnswer && 'bg-red-200 text-red-800 line-through',
                                      !isAnswer && !isUserPick && 'text-gray-500'
                                    )}
                                  >
                                    {opt}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div className="text-sm">
                            {isSubjective ? (
                              !isUnanswered && <span className="text-purple-600">你的作答：{ua}</span>
                            ) : (
                              <>
                                {!isUnanswered && !isCorrect && (
                                  <span className="mr-3 text-red-600">你的答案：{ua}</span>
                                )}
                                <span className="text-green-600">正确答案：{q.answer}</span>
                              </>
                            )}
                          </div>
                          {q.explanation && (
                            <div className="mt-2 rounded bg-white p-3 text-sm text-gray-600">
                              <span className="font-medium">解析：</span>{q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============ QUIZ VIEW ============
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeLeft < 300;
  const isFirstQuestion = currentIdx === 0;
  const isLastQuestion = currentIdx === questions.length - 1;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Top nav */}
      <nav className="mb-6 flex items-center justify-between">
        <Link href={`/exam/${examId}`} className="text-sm text-gray-500 hover:text-primary-600">
          ← 返回试卷
        </Link>
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-md px-3 py-1.5 font-mono text-sm font-medium',
            isTimeLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
          )}>
            {formatTime(timeLeft)}
          </div>
          <span className="text-sm text-gray-500">
            {currentIdx + 1} / {questions.length}
          </span>
          <button
            onClick={() => setShowAnswerSheet(!showAnswerSheet)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              showAnswerSheet
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            答题卡
          </button>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>已答 {answeredCount} 题</span>
          <span>标记 {flaggedCount} 题</span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main question area */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700">
                  {currentQuestion.section}
                </span>
                <span className="text-sm text-gray-500">第 {currentQuestion.number} 题</span>
                <span className="text-sm text-gray-500">· {currentQuestion.score}分</span>
                <button
                  onClick={toggleFlag}
                  className={cn(
                    'ml-auto flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                    isFlagged
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-gray-300 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                  )}
                >
                  <svg className="h-3.5 w-3.5" fill={isFlagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V3h9l-3 3 3 3H3" />
                  </svg>
                  {isFlagged ? '已标记' : '标记'}
                </button>
              </div>

              {currentQuestion.type === 'listening' && currentQuestion.passage && (
                <ListeningPlayer text={currentQuestion.passage} />
              )}

              {currentQuestion.passage && currentQuestion.type !== 'listening' && (
                <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                  {currentQuestion.passage.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('W:') || line.startsWith('M:') ? 'ml-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              )}

              <h2 className="mb-6 text-lg font-medium text-gray-900">{currentQuestion.content}</h2>

              {currentQuestion.options && currentQuestion.options.length > 0 && (
                <div className="space-y-3">
                  {currentQuestion.options.map(option => {
                    const optionKey = option.charAt(0);
                    const isSelected = userAnswer === optionKey;
                    return (
                      <button
                        key={optionKey}
                        onClick={() => selectAnswer(optionKey)}
                        className={cn(
                          'w-full rounded-lg border p-4 text-left transition-all',
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        )}
                      >
                        <span className="text-gray-700">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {(!currentQuestion.options || currentQuestion.options.length === 0) && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-sm text-gray-500">主观题，请自行作答</p>
                  <textarea
                    className="w-full rounded border border-gray-300 p-3 text-sm"
                    rows={6}
                    placeholder="在此输入你的答案..."
                    value={userAnswer}
                    onChange={e => {
                      const val = e.target.value;
                      setAnswers(prev => {
                        const next = { ...prev, [currentQuestion.id]: val };
                        answersRef.current = next;
                        return next;
                      });
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bottom navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevQuestion}
                disabled={isFirstQuestion}
                className={cn(
                  'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                  isFirstQuestion
                    ? 'cursor-not-allowed border-gray-200 text-gray-400'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                上一题
              </button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    placeholder="题号"
                    value={jumpTo}
                    onChange={e => setJumpTo(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleJumpSubmit(); }}
                    className="w-16 rounded border border-gray-300 px-2 py-1.5 text-center text-sm"
                  />
                  <button
                    onClick={handleJumpSubmit}
                    className="rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    跳转
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLastQuestion ? (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    交卷
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    下一题
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Answer sheet sidebar */}
        {showAnswerSheet && (
          <div className="w-72 shrink-0">
            <div className="sticky top-4 rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">答题卡</h3>
                <button
                  onClick={() => setShowAnswerSheet(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-3 flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-blue-100" /> 已答
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-amber-100" /> 标记
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-gray-100" /> 未答
                </span>
              </div>

              <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                {sections.map(section => {
                  const sectionQuestions = questions.filter(q => getQuestionSectionName(q, examId) === section);
                  return (
                    <div key={section}>
                      <div className="mb-1 text-xs font-medium text-gray-500">{section}</div>
                      <div className="grid grid-cols-7 gap-1">
                        {sectionQuestions.map(q => {
                          const status = getQuestionStatus(q);
                          const qIdx = questions.indexOf(q);
                          return (
                            <button
                              key={q.id}
                              onClick={() => {
                                setCurrentIdx(qIdx);
                                window.speechSynthesis.cancel();
                              }}
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-all',
                                statusColors[status]
                              )}
                              title={`第${q.number}题${flagged.has(q.id) ? ' (已标记)' : ''}`}
                            >
                              {q.number}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 border-t pt-3">
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  交卷
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">确认交卷</h3>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">总题数</span>
                <span className="font-medium text-gray-900">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已作答</span>
                <span className="font-medium text-green-600">{answeredCount} 题</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">未作答</span>
                <span className="font-medium text-red-600">{questions.length - answeredCount} 题</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已标记</span>
                <span className="font-medium text-amber-600">{flaggedCount} 题</span>
              </div>
            </div>
            {answeredCount < questions.length && (
              <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-700">
                还有 {questions.length - answeredCount} 题未作答，确认交卷吗？
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                继续答题
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  finishExam();
                }}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                确认交卷
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
