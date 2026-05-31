/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';

// Custom Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-red-600 hover:bg-red-500 text-white font-mono shadow-md shadow-red-950/20 active:translate-y-[1px] rounded-xl",
    secondary: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 active:bg-white/15 rounded-xl",
    danger: "bg-red-950/20 hover:bg-red-900/40 text-red-300 border border-red-900/40 rounded-xl",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5 rounded-xl",
    glow: "bg-white/5 hover:bg-white/10 text-red-400 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)] hover:shadow-[0_0_18px_rgba(239,68,68,0.2)] font-mono rounded-xl",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Card
interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div className={`bg-[#0a0a0a]/60 border border-white/5 backdrop-blur-md rounded-2xl relative overflow-hidden transition-all duration-300 ${
      glow ? 'shadow-[0_0_15px_rgba(239,68,68,0.08)] hover:border-red-500/35 border-red-500/10' : ''
    } ${className}`}>
      {children}
    </div>
  );
};

// Custom Toast System
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastNotificationProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => {
        const types = {
          success: "border-emerald-500/20 bg-[#0a0a0a]/80 backdrop-blur-md text-emerald-400",
          error: "border-red-500/20 bg-[#0a0a0a]/80 backdrop-blur-md text-red-400",
          info: "border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-slate-300",
        };

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-3.5 border rounded-xl shadow-xl font-mono text-xs transition-all duration-300 animate-slide-in ${types[toast.type]}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"}`} />
              <p>{toast.message}</p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="text-zinc-500 hover:text-zinc-200 p-0.5 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Modal Overlay
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg"
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className={`relative w-full ${maxWidth} bg-[#0a0a0a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl animate-zoom-in`}>
        {/* Title Bar */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-transparent">
          <h3 className="text-sm font-semibold tracking-wider font-mono text-zinc-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-650 animate-pulse" />
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-white/5 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Children Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
