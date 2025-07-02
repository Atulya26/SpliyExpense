import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive" | "ghost" | "link";
  loading?: boolean;
}

const variantClasses = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-blue-600 text-blue-600 bg-white hover:bg-blue-50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-blue-600 hover:bg-blue-50",
  link: "underline text-blue-600 hover:text-blue-800 bg-transparent p-0 h-auto min-w-0"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", loading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full inline-block"></span>
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button"; 