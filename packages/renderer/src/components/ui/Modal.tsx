import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import "./Modal.css";

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export const Modal = ({ title, children, onClose }: ModalProps) => (
  <motion.div 
    className="modal-overlay" 
    onClick={onClose}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    <motion.div 
      className="modal-content" 
      onClick={e => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="icon-btn-close" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="modal-body">{children}</div>
    </motion.div>
  </motion.div>
);
