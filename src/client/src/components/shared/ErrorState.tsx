import { memo } from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  tone?: 'light' | 'dark';
  className?: string;
}

const containerToneClasses: Record<'light' | 'dark', string> = {
  light: 'bg-red-50 text-red-700',
  dark: 'bg-red-900 text-white',
};

const buttonToneClasses: Record<'light' | 'dark', string> = {
  light: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  dark: 'bg-white text-red-700 hover:bg-red-100 focus-visible:ring-white',
};

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ');

const ErrorStateComponent = ({
  message = 'Something went wrong.',
  onRetry,
  fullScreen = false,
  tone = 'light',
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={joinClasses(
        'w-full flex items-center justify-center px-6',
        fullScreen ? 'min-h-screen' : 'py-12 rounded-lg border border-red-200',
        containerToneClasses[tone],
        className,
      )}
      role="alert"
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-lg">
        <div className="text-2xl" aria-hidden>
          ⚠️
        </div>
        <output className="text-lg font-medium" aria-live="polite">
          {message}
        </output>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={joinClasses(
              'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors',
              buttonToneClasses[tone],
            )}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export const ErrorState = memo(ErrorStateComponent);
