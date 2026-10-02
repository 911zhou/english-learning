import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isVIP } from '@/lib/auth/permission';
import { processUploadedFile } from '@/lib/ai/parsing';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const vip = await isVIP(session.user.id);
  if (!vip) {
    return NextResponse.json({ error: '该功能仅限VIP用户使用' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ error: '缺少文件ID' }, { status: 400 });
  }

  try {
    const file = await prisma.userUploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    if (file.userId !== session.user.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    if (file.status === 'processing') {
      return NextResponse.json({ error: '文件正在处理中' }, { status: 400 });
    }

    const result = await processUploadedFile(fileId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Process uploaded file error:', error);
    return NextResponse.json({ error: '解析失败' }, { status: 500 });
  }
}
