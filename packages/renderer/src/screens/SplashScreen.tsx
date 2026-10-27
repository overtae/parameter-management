import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import "./SplashScreen.css";

const SplashScreen: React.FC = () => {
  return (
    <div className="splash-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="splash-content"
      >
        <div className="logo-wrapper">
          <Shield size={80} color="var(--primary)" />
          <motion.div
            className="logo-glow"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Recycle Secrets
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
          className="version"
        >
          AWS SSM Management v3.1.0
        </motion.p>

        <div className="loader-container">
          <motion.div
            className="loader-bar"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
