import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import "./Toast.css";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
      className={`toast ${type}`}
    >
      {type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      <span className="message">{message}</span>
      <button onClick={onClose}>
        <X size={14} />
      </button>
    </motion.div>
  );
};

export default Toast;
