import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight, Type } from "lucide-react";
import { useSSMContext } from "../../providers/SSMContext";
import "./QuickSearch.css";

const QuickSearch: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { parameters, selectNode } = useSSMContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = parameters
      .filter((p) => p.Name.toLowerCase().includes(q))
      .slice(0, 10);
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, parameters]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % results.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      e.preventDefault();
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelect = (param: any) => {
    selectNode({
      path: param.Name,
      name: param.Name.split("/").pop() || param.Name,
      isFolder: false,
    });
    onClose();
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="highlight">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="quick-search-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="quick-search-modal"
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input-section">
              <Search size={20} className="search-icon" />
              <input
                ref={inputRef}
                placeholder="Search all parameters... (Cmd + Shift + F)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="esc-hint" onClick={onClose}>
                ESC
              </div>
            </div>

            <div className="results-section">
              {results.length > 0 ? (
                results.map((res, i) => (
                  <div
                    key={res.Name}
                    className={`result-item ${i === selectedIndex ? "selected" : ""}`}
                    onClick={() => handleSelect(res)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <div className="result-info">
                      <div className="result-name">
                        <Type size={14} />
                        <span>{highlightText(res.Name, query)}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="arrow-icon" />
                  </div>
                ))
              ) : query ? (
                <div className="no-results">
                  No parameters found for "{query}"
                </div>
              ) : (
                <div className="search-placeholder">
                  <Command size={48} />
                  <p>Type to search parameters by name or path</p>
                </div>
              )}
            </div>

            {/* <div className="search-footer">
              <div className="footer-item">
                <kbd>↑↓</kbd> <span>to navigate</span>
              </div>
              <div className="footer-item">
                <kbd>↵</kbd> <span>to select</span>
              </div>
            </div> */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickSearch;
