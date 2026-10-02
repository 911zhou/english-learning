'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  status: string;
  createdAt: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

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

  const handleFileSelect = async (file: File) => {
    setError('');
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('仅支持 PDF 和 Word 文件（.pdf, .docx, .doc）');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/user/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '上传失败');
        return;
      }

      setUploadProgress(100);
      await loadFiles();
    } catch {
      setError('网络错误，请稍后重试');
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
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

  const formatSize = (name: string) => {
    return name.endsWith('.pdf') ? 'PDF' : 'Word';
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/exam/builder" className="text-sm text-gray-500 hover:text-primary-600">
          ← 返回组卷
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">上传试卷</h1>
      <p className="mb-8 text-sm text-gray-500">
        上传 PDF 或 Word 格式的试卷文件，文件将保存到您的个人题库中
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'mb-8 cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors',
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />

        {uploading ? (
          <div>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm font-medium text-gray-700">上传中...</p>
            <div className="mx-auto mt-3 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-1 text-sm font-medium text-gray-700">
              点击或拖拽文件到此处上传
            </p>
            <p className="text-xs text-gray-500">
              支持 PDF、Word 格式，最大 10MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-gray-900">已上传文件</h2>

      {loading ? (
        <p className="text-sm text-gray-500">加载中...</p>
      ) : files.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">暂无上传文件</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold',
                  file.fileType === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                )}>
                  {formatSize(file.fileName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                  <p className="text-xs text-gray-500">{formatDate(file.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
