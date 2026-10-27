import React from "react";
import { Copy, Check } from "lucide-react";
import "./Input.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  showCopy?: boolean;
};

const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  showCopy,
  className = "",
  value,
  ...props
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      navigator.clipboard.writeText(value.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`input-container ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div
        className={`input-wrapper ${error ? "has-error" : ""} ${showCopy ? "has-copy" : ""}`}
      >
        {icon && <span className="input-icon">{icon}</span>}
        <input value={value} {...props} className={icon ? "with-icon" : ""} />
        {showCopy && value && (
          <button className="copy-btn" onClick={handleCopy} type="button">
            {copied ? (
              <Check size={14} color="var(--semantic-success)" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Input;
