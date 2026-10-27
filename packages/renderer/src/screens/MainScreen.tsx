import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Trash2, Type, Save, Folder } from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";
import Editor from "../components/editor/Editor";
import { Modal } from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Toast from "../components/ui/Toast";
import ContextMenu from "../components/ui/ContextMenu";
import QuickSearch from "../components/ui/QuickSearch";
import FolderView from "../components/folder/FolderView";
import { SSMProvider, useSSMContext } from "../providers/SSMContext";
import "./MainScreen.css";

type MainScreenProps = {
  region: string;
  profileName: string;
};

const MainContent: React.FC<MainScreenProps> = ({
  region: _region,
  profileName,
}) => {
  const {
    selectedPath,
    setSelectedPath,
    tree,
    isLoading,
    saveParameter,
    deleteParameter,
    editingParameter,
    confirmDeleteNode,
    setConfirmDeleteNode,
    selectNode,
  } = useSSMContext();
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const isResizing = useRef(false);
  const sidebarSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        sidebarSearchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth > 150 && newWidth < 600) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const selectedNode = (function findNode(nodes: any[]): any {
    for (const n of nodes) {
      if (n.path === selectedPath) return n;
      if (n.children) {
        const found = findNode(n.children);
        if (found) return found;
      }
    }
    return null;
  })(tree);

  const handleDelete = async () => {
    if (!confirmDeleteNode) return;
    const res = await deleteParameter(confirmDeleteNode);
    if (res.success) {
      if (
        selectedPath === confirmDeleteNode.path ||
        (confirmDeleteNode.isFolder &&
          selectedPath?.startsWith(confirmDeleteNode.path + "/"))
      ) {
        selectNode(null);
      }
      setConfirmDeleteNode(null);
      setToast({ message: "Successfully deleted", type: "success" });
    } else {
      setToast({
        message: res.error || "Failed to delete parameter",
        type: "error",
      });
    }
  };

  const handleSave = async () => {
    if (!editingParameter) return;
    
    const isRename = selectedNode && !selectedNode.isFolder && selectedNode.path !== editingParameter.Name;

    const res = await saveParameter(editingParameter);
    if (res.success) {
      if (isRename) {
        await deleteParameter(selectedNode);
        setSelectedPath(editingParameter.Name);
      }
      setToast({ message: "Successfully saved", type: "success" });
    } else {
      setToast({
        message: res.error || "Failed to save parameter",
        type: "error",
      });
    }
  };

  return (
    <div className="main-layout">
      <div style={{ width: sidebarWidth, flexShrink: 0, position: "relative" }}>
        <Sidebar profileName={profileName} ref={sidebarSearchRef} />
        <div className="resize-handle" onMouseDown={startResizing} />
      </div>

      <main className="main-content">
        <header className="main-header">
          {selectedNode ? (
            <>
              <div className="parameter-name-header">
                {selectedNode.isFolder ? (
                  <Folder size={14} />
                ) : (
                  <Type size={14} />
                )}
                <span>{selectedNode.path}</span>
              </div>
              <div className="header-actions">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmDeleteNode(selectedNode)}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </Button>
                {!selectedNode.isFolder && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Save size={14} />}
                    onClick={handleSave}
                    isLoading={isLoading}
                  >
                    Save
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="header-placeholder" />
          )}
        </header>

        <div className="content-area">
          <AnimatePresence mode="wait">
            {selectedNode && !selectedNode.isFolder ? (
              <Editor key={selectedNode.path} />
            ) : selectedNode && selectedNode.isFolder ? (
              <FolderView key={selectedNode.path} node={selectedNode} />
            ) : (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="empty-icon">
                  <Shield size={64} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteNode && (
          <Modal
            title="Delete Parameter"
            onClose={() => setConfirmDeleteNode(null)}
          >
            <p className="modal-text">
              {confirmDeleteNode.isFolder ? (
                <>
                  Are you sure you want to delete folder{" "}
                  <strong>{confirmDeleteNode.path}</strong>?<br />
                  <span style={{ color: "#f85149", fontWeight: 600 }}>
                    This will delete ALL parameters inside this folder.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{confirmDeleteNode.path}</strong>?
                </>
              )}
              <br />
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setConfirmDeleteNode(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isLoading}
              >
                Delete
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ContextMenu />

      <QuickSearch
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
      />
    </div>
  );
};

const MainScreen: React.FC<MainScreenProps> = (props) => {
  return (
    <SSMProvider region={props.region} profile={props.profileName}>
      <MainContent {...props} />
    </SSMProvider>
  );
};

export default MainScreen;
