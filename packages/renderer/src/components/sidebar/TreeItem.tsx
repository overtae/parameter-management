import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Folder, FileText, Globe } from "lucide-react";
import { useSSMContext } from "../../providers/SSMContext";
import type { TNode } from "../../types/ssm";
import "./TreeItem.css";

type TreeItemProps = {
  node: TNode;
  level: number;
};

const TreeItem: React.FC<TreeItemProps> = ({ node, level }) => {
  const {
    selectedPath,
    expandedFolders,
    inlineEditing,
    selectNode,
    toggleFolder,
    submitInline,
    setContextMenu,
  } = useSSMContext();

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  // Full-width click handler
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node);
    if (node.isFolder) {
      toggleFolder(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // Render vertical guide lines
  const renderGuideLines = () => {
    const lines = [];
    if (!selectedPath) return null;

    const selectedParts = selectedPath.split("/").filter(Boolean);
    const currentParts = node.path.split("/").filter(Boolean);

    // Determine the "active level" (the one to highlight)
    // If selected item is a folder, its own level is active for its children.
    // If it's a file, its parent's level is active.
    const isSelectedFolder = expandedFolders.has(selectedPath);
    const activeLevel = isSelectedFolder
      ? selectedParts.length
      : selectedParts.length - 1;

    for (let i = 0; i < level; i++) {
      // Check if this level is shared with the selected path
      const isPartOfPath =
        i < selectedParts.length && currentParts[i] === selectedParts[i];

      if (!isPartOfPath) continue;

      const isActive = i === activeLevel - 1;

      lines.push(
        <div
          key={i}
          className={`guide-line ${isActive ? "active" : ""}`}
          style={{ left: i * 16 + 20 }}
        />,
      );
    }
    return lines;
  };

  return (
    <div className="tree-item-container">
      <div className="tree-item-row">
        {renderGuideLines()}
        <motion.div
          className={`tree-item ${isSelected ? "selected" : ""}`}
          style={{ paddingLeft: level * 16 + 8 }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: level * 0.005, duration: 0.1 }}
        >
          <div className="item-icon-group">
            {node.isFolder ? (
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                className="chevron"
              >
                <ChevronRight size={14} />
              </motion.span>
            ) : (
              <span className="spacer" />
            )}
            {node.isFolder ? (
              <Folder
                size={16}
                className={`folder-icon ${isExpanded ? "open" : ""}`}
              />
            ) : (
              <FileText size={16} className="file-icon" />
            )}
          </div>

          <span className="item-name">
            <span className="name-text">{node.name}</span>
            {!node.isLocal && node.data?.isLocal && (
              <Globe size={10} className="local-indicator" />
            )}
          </span>
        </motion.div>
      </div>

      <AnimatePresence>
        {node.isFolder && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="children"
          >
            {/* Inline editing for new items */}
            {inlineEditing?.basePath === node.path && (
              <div
                className="tree-item inline-edit"
                style={{ paddingLeft: (level + 1) * 16 + 24 }}
              >
                {inlineEditing?.type === "file" ? (
                  <FileText size={16} />
                ) : (
                  <Folder size={16} />
                )}
                <input
                  autoFocus
                  onBlur={(e) => submitInline(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitInline(e.currentTarget.value);
                    if (e.key === "Escape") submitInline(null);
                  }}
                />
              </div>
            )}

            {node.children?.map((child: TNode) => (
              <TreeItem key={child.path} node={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TreeItem;
