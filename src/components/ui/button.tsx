import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 rounded-md cursor-pointer select-none active:scale-[0.99]";

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-8.5 px-3.5 text-xs sm:text-sm gap-2",
    lg: "h-9.5 px-4 text-sm gap-2",
  }[size];

  const variantClasses = {
    primary:
      "bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700 active:bg-indigo-800 border border-indigo-700/30",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 shadow-2xs hover:border-slate-300",
    outline:
      "bg-transparent text-slate-700 hover:bg-slate-100/80 active:bg-slate-100 border border-slate-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
