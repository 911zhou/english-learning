'use client';

import { useSpeech } from '@/lib/useSpeech';
import { cn } from '@/lib/utils';

interface ListeningPlayerProps {
  text: string;
}

const speedOptions = [
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
];

export default function ListeningPlayer({ text }: ListeningPlayerProps) {
  const { isSpeaking, rate, setRate, speak, pause, stop } = useSpeech();

  const handlePlayPause = () => {
    if (isSpeaking) {
      pause();
    } else {
      speak(text);
    }
  };

  const handleStop = () => {
    stop();
  };

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 9.5l-3 3m0 0l-3-3m3 3V6m9 6a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium text-blue-800">听力音频</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
            isSpeaking
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          )}
          title={isSpeaking ? '暂停' : '播放'}
        >
          {isSpeaking ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <button
          onClick={handleStop}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300"
          title="停止"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-xs text-gray-500">速度</span>
          {speedOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRate(opt.value)}
              className={cn(
                'rounded px-2 py-1 text-xs font-medium transition-colors',
                rate === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
