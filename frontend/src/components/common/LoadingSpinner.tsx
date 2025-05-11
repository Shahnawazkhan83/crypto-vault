import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={`inline-flex ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full animate-spin 
                   border-slate-200 dark:border-dark-600
                   border-t-primary-600 dark:border-t-primary-500`}
      />
    </div>
  );
};

export default LoadingSpinner;
