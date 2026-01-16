import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`card ${sizes[size]} w-full max-h-[90vh] overflow-y-auto animate-slideUp p-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-2 mt-4 pt-3 border-t border-[var(--border)] ${className}`}
    >
      {children}
    </div>
  );
}
