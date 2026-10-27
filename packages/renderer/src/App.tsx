import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./screens/SplashScreen";
import SetupScreen from "./screens/SetupScreen";
import MainScreen from "./screens/MainScreen";
import TitleBar from "./components/ui/TitleBar";
import { Modal } from "./components/ui/Modal";
import useLocalStorage from "./hooks/useLocalStorage";
import "./App.css";

type TViewType = "splash" | "setup" | "main";

const App: React.FC = () => {
  const [view, setView] = useState<TViewType>("splash");
  const [profiles, setProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Persisted config
  const [config, setConfig] = useLocalStorage("aws-config", {
    authType: "profile",
    profile: "default",
    region: "ap-northeast-2",
    isConnected: false,
  });

  useEffect(() => {
    const init = async () => {
      // 1. Show splash for at least 1.5s
      const splashTimer = new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        const list = await window.api.getProfiles();
        setProfiles(list || []);
      } catch (e) {
        console.error("Profile fetch failed:", e);
      }

      await splashTimer;

      // 2. Decide which view to show
      if (config.isConnected) {
        // Try to auto-connect if previously connected
        try {
          const result = await window.api.connect(config);
          if (result.success) {
            setView("main");
          } else {
            setView("setup");
          }
        } catch (e) {
          setView("setup");
        }
      } else {
        setView("setup");
      }
    };

    init();
  }, []);

  const handleConnect = async (newConfig: any) => {
    setIsLoading(true);
    try {
      const result = await window.api.connect(newConfig);
      if (result.success) {
        setConfig({ ...newConfig, isConnected: true });
        setView("main");
        setShowSetupModal(false);
      } else {
        alert("Connection failed: " + result.error);
      }
    } catch (e: any) {
      alert("System error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <TitleBar onSettings={() => setShowSetupModal(true)} />
      <AnimatePresence mode="wait">
        {view === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SplashScreen />
          </motion.div>
        )}
        {view === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SetupScreen
              onConnect={handleConnect}
              isLoading={isLoading}
              profiles={profiles}
              initialConfig={config}
            />
          </motion.div>
        )}
        {view === "main" && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MainScreen region={config.region} profileName={config.profile} />
          </motion.div>
        )}
      </AnimatePresence>

      {showSetupModal && (
        <Modal title="AWS Settings" onClose={() => setShowSetupModal(false)}>
          <SetupScreen
            onConnect={handleConnect}
            isLoading={isLoading}
            profiles={profiles}
            initialConfig={config}
            isModal
          />
        </Modal>
      )}
    </div>
  );
};

export default App;
