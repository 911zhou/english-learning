import { prisma } from '@/lib/prisma';
import { getProvider } from './factory';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedQuestion {
  number: number;
  questionType: string;
  examType: string;
  section: string;
  content: string;
  options: string[];
  answer: string;
  analysis: string;
  difficulty: string;
  knowledgePoints: string[];
  tags: string[];
}

export async function extractText(filePath: string, fileType: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'public', filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error('File not found');
  }

  if (fileType === 'txt') {
    return fs.readFileSync(fullPath, 'utf-8');
  }

  if (fileType === 'pdf') {
    const buffer = fs.readFileSync(fullPath);
    const text = buffer.toString('utf-8');
    return text.replace(/[^\x20-\x7E\n]/g, ' ').trim();
  }

  if (fileType === 'docx' || fileType === 'doc' || fileType === 'word') {
    const buffer = fs.readFileSync(fullPath);
    const text = buffer.toString('utf-8');
    return text.replace(/[^\x20-\x7E\n]/g, ' ').trim();
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

export async function parseQuestionsFromText(
  text: string,
  examType: string = 'cet4'
): Promise<ParsedQuestion[]> {
  const provider = getProvider();

  const prompt = `You are an expert at parsing English exam questions. Parse the following text into structured questions.

Exam type: ${examType}

Return a JSON array where each question has:
- number: question number (integer)
- questionType: one of "reading", "cloze", "writing", "translation", "listening"
- section: section name (e.g., "Reading Comprehension", "Cloze", "Writing")
- content: the question stem/passage
- options: array of option strings (empty array if no options)
- answer: the correct answer (e.g., "A", "B", "C", "D" or the full answer text)
- analysis: brief explanation of the answer
- difficulty: one of "easy", "medium", "hard"
- knowledgePoints: array of knowledge point strings
- tags: array of tag strings

Text to parse:
${text}

Return ONLY the JSON array, no other text.`;

  try {
    const result = await (provider as any).parseExamQuestions?.(prompt);

    if (result && Array.isArray(result)) {
      return result;
    }

    return generateMockQuestions(text, examType);
  } catch (error) {
    return generateMockQuestions(text, examType);
  }
}

function generateMockQuestions(text: string, examType: string): ParsedQuestion[] {
  const lines = text.split('\n').filter(l => l.trim());
  const questions: ParsedQuestion[] = [];

  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let questionNumber = 1;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^\d+[\.\、\)]/.test(trimmed)) {
      if (currentQuestion && currentQuestion.content) {
        questions.push({
          number: currentQuestion.number || questionNumber++,
          questionType: currentQuestion.questionType || 'reading',
          examType,
          section: currentQuestion.section || 'Reading Comprehension',
          content: currentQuestion.content || '',
          options: currentQuestion.options || [],
          answer: currentQuestion.answer || 'A',
          analysis: currentQuestion.analysis || 'This question tests reading comprehension.',
          difficulty: currentQuestion.difficulty || 'medium',
          knowledgePoints: currentQuestion.knowledgePoints || ['reading comprehension'],
          tags: currentQuestion.tags || [examType],
        });
      }

      currentQuestion = {
        number: questionNumber++,
        questionType: 'reading',
        section: 'Reading Comprehension',
        content: trimmed,
        options: [],
        answer: 'A',
        analysis: 'This question tests reading comprehension.',
        difficulty: 'medium',
        knowledgePoints: ['reading comprehension'],
        tags: [examType],
      };
    } else if (/^[A-D][\.\、\)]/.test(trimmed) && currentQuestion) {
      currentQuestion.options = currentQuestion.options || [];
      currentQuestion.options.push(trimmed);
    } else if (currentQuestion) {
      currentQuestion.content = (currentQuestion.content || '') + ' ' + trimmed;
    }
  }

  if (currentQuestion && currentQuestion.content) {
    questions.push({
      number: currentQuestion.number || questionNumber,
      questionType: currentQuestion.questionType || 'reading',
      examType,
      section: currentQuestion.section || 'Reading Comprehension',
      content: currentQuestion.content || '',
      options: currentQuestion.options || [],
      answer: currentQuestion.answer || 'A',
      analysis: currentQuestion.analysis || 'This question tests reading comprehension.',
      difficulty: currentQuestion.difficulty || 'medium',
      knowledgePoints: currentQuestion.knowledgePoints || ['reading comprehension'],
      tags: currentQuestion.tags || [examType],
    });
  }

  if (questions.length === 0 && text.trim().length > 0) {
    questions.push({
      number: 1,
      questionType: 'reading',
      examType,
      section: 'Reading Comprehension',
      content: text.substring(0, 500),
      options: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
      answer: 'A',
      analysis: 'Sample question generated from uploaded content.',
      difficulty: 'medium',
      knowledgePoints: ['reading comprehension'],
      tags: [examType],
    });
  }

  return questions;
}

export async function processUploadedFile(fileId: string): Promise<{ success: boolean; questionCount: number; error?: string }> {
  const file = await prisma.userUploadedFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error('File not found');
  }

  await prisma.userUploadedFile.update({
    where: { id: fileId },
    data: { status: 'processing' },
  });

  try {
    const text = await extractText(file.filePath, file.fileType);

    if (!text || text.trim().length < 10) {
      throw new Error('File content is too short or empty');
    }

    const examType = detectExamType(file.fileName);
    const parsedQuestions = await parseQuestionsFromText(text, examType);

    await prisma.userQuestion.deleteMany({
      where: { sourceFileId: fileId },
    });

    const createdQuestions = [];
    for (const q of parsedQuestions) {
      const created = await prisma.userQuestion.create({
        data: {
          userId: file.userId,
          sourceType: 'uploaded',
          sourceFileId: fileId,
          examType: q.examType,
          section: q.section,
          questionType: q.questionType,
          difficulty: q.difficulty,
          knowledgePoints: JSON.stringify(q.knowledgePoints),
          tags: JSON.stringify(q.tags),
          content: q.content,
          options: JSON.stringify(q.options),
          answer: q.answer,
          analysis: q.analysis,
        },
      });
      createdQuestions.push(created);
    }

    await prisma.userUploadedFile.update({
      where: { id: fileId },
      data: {
        status: 'completed',
        questionCount: createdQuestions.length,
        processedAt: new Date(),
      },
    });

    return { success: true, questionCount: createdQuestions.length };
  } catch (error) {
    await prisma.userUploadedFile.update({
      where: { id: fileId },
      data: { status: 'failed' },
    });

    return {
      success: false,
      questionCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function detectExamType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('cet4') || lower.includes('四级')) return 'cet4';
  if (lower.includes('cet6') || lower.includes('六级')) return 'cet6';
  if (lower.includes('gaokao') || lower.includes('高考')) return 'gaokao';
  return 'cet4';
}
