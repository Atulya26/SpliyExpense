import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Dialog({ open, onClose, title, description, children, actions }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          ×
        </button>
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <div>{children}</div>
        {actions && <div className="mt-6 flex space-x-3">{actions}</div>}
      </div>
    </div>
  );
} 