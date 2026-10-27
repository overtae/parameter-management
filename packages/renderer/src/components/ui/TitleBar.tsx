import React from "react";
import { Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import "./TitleBar.css";

type TitleBarProps = {
  title?: string;
  onSettings?: () => void;
};

const TitleBar: React.FC<TitleBarProps> = ({
  title = "Recycle Secrets",
  onSettings,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="title-bar draggable-region">
      <div className="traffic-light-spacer" />
      <div className="title-text">{title}</div>
      <div className="right-spacer no-drag">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="icon-btn" onClick={onSettings} aria-label="Settings">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
