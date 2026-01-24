import { memo } from 'react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  tone?: 'light' | 'dark';
  className?: string;
}

const spinnerToneClasses: Record<'light' | 'dark', string> = {
  light: 'border-blue-500 border-t-transparent',
  dark: 'border-white border-t-transparent',
};

const containerToneClasses: Record<'light' | 'dark', string> = {
  light: 'bg-gray-100 text-gray-700',
  dark: 'bg-gray-900 text-white',
};

const joinClasses = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

const LoadingStateComponent = ({
  message = 'Loading...',
  fullScreen = false,
  tone = 'light',
  className,
}: LoadingStateProps) => {
  return (
    <div
      className={joinClasses(
        'w-full flex items-center justify-center',
        fullScreen ? 'min-h-screen' : 'py-12',
        containerToneClasses[tone],
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={joinClasses(
            'w-12 h-12 border-4 rounded-full animate-spin',
            spinnerToneClasses[tone],
          )}
        />
        <output className="text-lg font-medium" aria-live="polite">
          {message}
        </output>
      </div>
    </div>
  );
};

export const LoadingState = memo(LoadingStateComponent);
