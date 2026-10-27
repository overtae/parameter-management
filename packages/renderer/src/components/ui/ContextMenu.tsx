import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, FilePlus, FolderPlus } from "lucide-react";
import { useSSMContext } from "../../providers/SSMContext";
import "./ContextMenu.css";

const ContextMenu: React.FC = () => {
  const {
    contextMenu,
    setContextMenu,
    setInlineEditing,
    setConfirmDeleteNode,
    selectNode,
  } = useSSMContext();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const handleAction = (action: () => void) => {
    action();
    setContextMenu(null);
  };

  const menuWidth = 200;
  const menuHeight = contextMenu.node?.isFolder ? 190 : 80;
  const safeX = Math.min(contextMenu.x, window.innerWidth - menuWidth);
  const safeY = Math.min(contextMenu.y, window.innerHeight - menuHeight);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="context-menu"
        style={{ top: safeY, left: safeX }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        {!contextMenu.node ? (
          <>
            <button
              className="menu-item"
              onClick={() =>
                handleAction(() =>
                  setInlineEditing({
                    basePath: "/",
                    type: "file",
                  }),
                )
              }
            >
              <FilePlus size={14} /> New Parameter
            </button>
            <button
              className="menu-item"
              onClick={() =>
                handleAction(() =>
                  setInlineEditing({
                    basePath: "/",
                    type: "folder",
                  }),
                )
              }
            >
              <FolderPlus size={14} /> New Folder
            </button>
          </>
        ) : (
          <>
            {contextMenu.node.isFolder && (
              <>
                <button
                  className="menu-item"
                  onClick={() =>
                    handleAction(() =>
                      setInlineEditing({
                        basePath: contextMenu.node!.path,
                        type: "file",
                      }),
                    )
                  }
                >
                  <FilePlus size={14} /> New Parameter
                </button>
                <button
                  className="menu-item"
                  onClick={() =>
                    handleAction(() =>
                      setInlineEditing({
                        basePath: contextMenu.node!.path,
                        type: "folder",
                      }),
                    )
                  }
                >
                  <FolderPlus size={14} /> New Folder
                </button>
                <button
                  className="menu-item"
                  onClick={() =>
                    handleAction(() => selectNode(contextMenu.node!))
                  }
                >
                  <FolderPlus size={14} /> View Parameters
                </button>
                <div className="menu-divider" />
              </>
            )}

            <button
              className="menu-item"
              onClick={() =>
                handleAction(() =>
                  navigator.clipboard.writeText(contextMenu.node!.path),
                )
              }
            >
              <Copy size={14} /> Copy Path
            </button>

            <div className="menu-divider" />

            <button
              className="menu-item danger"
              onClick={() =>
                handleAction(() => setConfirmDeleteNode(contextMenu.node!))
              }
            >
              <Trash2 size={14} /> Delete
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ContextMenu;
