import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

// Track modal stack for proper Escape key handling
let modalStack: number[] = [];
let nextModalId = 0;

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  actions,
  footer,
}: ModalProps) => {
  const modalIdRef = useRef<number>(nextModalId++);

  useEffect(() => {
    if (isOpen) {
      const currentModalId = modalIdRef.current;
      // Add this modal to the stack
      modalStack.push(currentModalId);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Only close if this is the topmost modal
          const topmostModalId = modalStack.at(-1);
          if (topmostModalId === currentModalId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            onClose();
          }
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Remove this modal from the stack
        modalStack = modalStack.filter((id) => id !== currentModalId);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-lg shadow-xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] flex flex-col`}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <div className="flex items-center gap-3">
              {actions}
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {/* Footer - Fixed (optional) */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
