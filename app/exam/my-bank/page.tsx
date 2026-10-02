'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  status: string;
  questionCount: number;
  processedAt: string | null;
  createdAt: string;
}

export default function MyBankPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  const [vipLoading, setVipLoading] = useState(true);

  useEffect(() => {
    checkVIP();
    loadFiles();
  }, []);

  const checkVIP = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setIsVIP(data.membership?.isVIP || false);
      }
    } catch {
      // ignore
    }
    setVipLoading(false);
  };

  const loadFiles = async () => {
    try {
      const res = await fetch('/api/user/upload');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleProcess = async (fileId: string) => {
    setError('');
    setProcessing(fileId);

    try {
      const res = await fetch(`/api/user/upload/process?id=${encodeURIComponent(fileId)}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '解析失败');
        return;
      }

      const result = await res.json();
      if (result.success) {
        await loadFiles();
      } else {
        setError(result.error || '解析失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    }

    setProcessing(null);
  };

  const handleDelete = async (fileId: string) => {
    try {
      const res = await fetch(`/api/user/upload?id=${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }
    } catch {
      // ignore
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      uploaded: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      uploaded: '待解析',
      processing: '解析中',
      completed: '已完成',
      failed: '解析失败',
    };
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status] || styles.uploaded)}>
        {labels[status] || status}
      </span>
    );
  };

  if (vipLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!isVIP) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mx-auto max-w-2xl rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">个人题库</h1>
          <p className="mb-6 text-gray-600">该功能仅限VIP用户使用</p>
          <Link
            href="/vip"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            升级VIP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的题库</h1>
          <p className="mt-1 text-sm text-gray-500">管理上传的试卷和题目</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/exam/upload"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            上传试卷
          </Link>
          <Link
            href="/exam/builder"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            组新试卷
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">加载中...</p>
      ) : files.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mb-4 text-sm text-gray-500">暂无上传文件</p>
          <Link
            href="/exam/upload"
            className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            上传试卷
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map(file => (
            <div
              key={file.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold',
                    file.fileType === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {file.fileType.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(file.createdAt)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusBadge(file.status)}
                      {file.status === 'completed' && (
                        <span className="text-xs text-gray-500">
                          {file.questionCount} 题
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {file.status === 'completed' && (
                    <Link
                      href={`/exam/my-bank/${file.id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      查看题目
                    </Link>
                  )}
                  {file.status === 'completed' && (
                    <Link
                      href={`/exam/builder?fileId=${file.id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      加入组卷
                    </Link>
                  )}
                  {(file.status === 'uploaded' || file.status === 'failed') && (
                    <button
                      onClick={() => handleProcess(file.id)}
                      disabled={processing === file.id}
                      className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {processing === file.id ? '解析中...' : '开始解析'}
                    </button>
                  )}
                  {file.status === 'completed' && (
                    <button
                      onClick={() => handleProcess(file.id)}
                      disabled={processing === file.id}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {processing === file.id ? '重新解析中...' : '重新解析'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
