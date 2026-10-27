import React from "react";
import { RefreshCw } from "lucide-react";
import "./Button.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ghost?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  children,
  className = "",
  ghost = false,
  ...props
}) => {
  return (
    <button
      className={`ui-button ${variant} ${size} ${ghost ? "ghost" : ""} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <RefreshCw className="spin" size={16} /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
