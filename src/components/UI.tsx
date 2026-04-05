import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[2rem] p-6 transition-colors duration-300", className)}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  as?: any;
}> = ({ 
  children, 
  variant = 'primary', 
  className,
  as: Component = 'button',
  ...props 
}) => {
  const variants = {
    primary: "bg-npa-green text-white hover:bg-npa-green-hover shadow-sm",
    secondary: "bg-[#f5f5f7] dark:bg-white/5 text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-white/10",
    danger: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20",
    ghost: "bg-transparent text-npa-green dark:text-white hover:bg-[#f5f5f7] dark:hover:bg-white/5"
  };
  
  return (
    <Component 
      className={cn(
        "px-6 py-2.5 rounded-full font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-sm flex items-center justify-center gap-2", 
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input 
    {...props}
    className={cn(
      "w-full px-5 py-3.5 bg-[#f5f5f7] dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-npa-green/20 outline-none transition-all text-[15px] text-[#1d1d1f] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600",
      className
    )}
  />
);

export const Badge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const styles: Record<string, string> = {
    pending: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
    in_progress: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    completed: "bg-npa-green/10 dark:bg-npa-green/10 text-npa-green dark:text-npa-green border-npa-green/20 dark:border-npa-green/20",
    closed: "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-white/10",
    reopened: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };
  
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border", 
      styles[status] || "bg-gray-50 text-gray-600",
      className
    )}>
      {status.replace('_', ' ')}
    </span>
  );
};
