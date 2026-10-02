import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { questions } from '@/lib/questions';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examType = searchParams.get('examType') || 'cet4';

  const filteredQuestions = questions.filter(q => q.examId.startsWith(examType));

  return NextResponse.json({
    questions: filteredQuestions.map(q => ({
      id: q.id,
      examId: q.examId,
      type: q.type,
      section: q.section || '',
      number: q.number,
      content: q.content,
      options: q.options ? JSON.stringify(q.options) : undefined,
      answer: q.answer,
      score: q.score,
      difficulty: q.difficulty,
    })),
  });
}
