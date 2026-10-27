import { forwardRef } from "react";
import { Search, RefreshCw, FilePlus, FolderPlus, User } from "lucide-react";
import TreeItem from "./TreeItem";
import { useSSMContext } from "../../providers/SSMContext";
import "./Sidebar.css";

type SidebarProps = {
  profileName: string;
};

const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(
  ({ profileName }, ref) => {
    const {
      tree,
      isLoading,
      searchQuery,
      setSearchQuery,
      inlineEditing,
      setInlineEditing,
      submitInline,
      refresh,
      setContextMenu,
      isInitialLoaded,
    } = useSSMContext();

    const handleCreateNew = (basePath: string, type: "file" | "folder") => {
      setInlineEditing({ basePath, type });
    };

    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="account-info">
            <User size={14} />
            <span>{profileName}</span>
          </div>
          <div className="toolbar">
            <button
              onClick={() => handleCreateNew("/", "file")}
              title="Create New Parameter"
              aria-label="New Parameter"
            >
              <FilePlus size={16} />
            </button>
            <button
              onClick={() => handleCreateNew("/", "folder")}
              title="Create New Folder"
              aria-label="New Folder"
            >
              <FolderPlus size={16} />
            </button>
            <button
              onClick={refresh}
              title="Refresh Parameters (Cmd+R)"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            </button>
          </div>
        </div>

        <div className="search-container">
          <div className="search-wrapper">
            <Search size={14} className="icon" />
            <input
              ref={ref}
              placeholder="Filter... (Cmd+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav
          className="tree-container"
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, node: null });
            }
          }}
        >
          {!isInitialLoaded && isLoading ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-subtle)", fontSize: "13px" }}>
              <RefreshCw size={18} className="spin" style={{ marginBottom: "8px" }} />
              <div>Loading parameters...</div>
            </div>
          ) : (
            <>
              {inlineEditing?.basePath === "/" && (
                <div className="tree-item inline-edit root-edit">
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
              {tree.map((node) => (
                <TreeItem key={node.path} node={node} level={0} />
              ))}
            </>
          )}
        </nav>
      </aside>
    );
  },
);

export default Sidebar;
