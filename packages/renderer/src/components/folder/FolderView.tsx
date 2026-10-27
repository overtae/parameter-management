import React, { useState, useMemo, useEffect, useRef } from "react";
import { Copy, Check, Download, ChevronDown, Edit2 } from "lucide-react";
import { useSSMContext } from "../../providers/SSMContext";
import type { TNode } from "../../types/ssm";
import Button from "../ui/Button";
import "./FolderView.css";

type FolderViewProps = {
  node: TNode;
};

const FolderView: React.FC<FolderViewProps> = ({ node }) => {
  const { parameters, refresh } = useSSMContext();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const folderParams = useMemo(() => {
    return parameters.filter((p) => p.Name.startsWith(node.path + "/"));
  }, [node, parameters]);

  const [saveMode, setSaveMode] = useState<"single" | "multi">("multi");

  // 폴더가 바뀔 때 기존 파라미터를 보고 자동 감지하여 saveMode 설정
  useEffect(() => {
    if (folderParams.length === 1) {
      const name = folderParams[0].Name.split("/").pop()?.toLowerCase();
      if (name === "env" || name === ".env") {
        setSaveMode("single");
        return;
      }
    }
    setSaveMode("multi");
  }, [node, folderParams]);

  const envContent = useMemo(() => {
    if (saveMode === "single" && folderParams.length === 1) {
      return folderParams[0].Value;
    }
    return folderParams
      .map((p) => {
        const name = p.Name.split("/").pop() || "";
        const envKey = name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
        return `${envKey}=${p.Value}`;
      })
      .join("\n");
  }, [saveMode, folderParams]);

  const renderHighlightedEnv = () => {
    if (!envContent) {
      return <span className="env-comment"># No parameters found in this folder</span>;
    }

    return envContent.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="env-line">&nbsp;</div>;
      }
      if (trimmed.startsWith("#")) {
        return (
          <div key={idx} className="env-line env-comment">
            {line}
          </div>
        );
      }
      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx);
        const value = line.slice(eqIdx + 1);
        return (
          <div key={idx} className="env-line">
            <span className="env-key">{key}</span>
            <span className="env-operator">=</span>
            <span className="env-value">{value}</span>
          </div>
        );
      }
      return (
        <div key={idx} className="env-line">
          {line}
        </div>
      );
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(envContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([envContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = ".env";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setIsSaveMenuOpen(false);
      }
    };
    if (isSaveMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSaveMenuOpen]);

  const handleSave = async (mode: "single" | "multi" = saveMode) => {
    setIsSaving(true);
    try {
      if (mode === "single") {
        // 1. 단일 env 파라미터로 저장
        let targetParam = folderParams.find(p => {
          const name = p.Name.split("/").pop()?.toLowerCase();
          return name === "env" || name === ".env";
        });

        if (!targetParam) {
          const newPath = `${node.path}/env`.replace(/\/+/g, "/");
          targetParam = {
            Name: newPath,
            Type: "String",
            Value: editText,
            Description: "",
          };
        } else {
          targetParam = {
            ...targetParam,
            Value: editText,
          };
        }

        // 기존의 다른 개별 파라미터가 있었다면 삭제 (중복/파편화 방지)
        const toDeletePaths = folderParams
          .filter(p => p.Name !== targetParam!.Name)
          .map(p => p.Name);

        if (toDeletePaths.length > 0) {
          await window.api.deleteParameter(toDeletePaths);
        }

        await window.api.saveParameter(targetParam);

      } else {
        // 2. 개별 파라미터 분할 저장
        const envKeyToParam = new Map<string, (typeof folderParams)[0]>();
        folderParams.forEach((p) => {
          const name = p.Name.split("/").pop() || "";
          const envKey = name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
          envKeyToParam.set(envKey, p);
        });

        const lines = editText.split("\n");
        const parsedEnv = new Map<string, { key: string; value: string }>();
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx === -1) return;
          const key = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim();
          if (key) {
            parsedEnv.set(key.toUpperCase(), { key, value });
          }
        });

        const toDeletePaths: string[] = [];
        const toSaveParams: typeof folderParams = [];

        folderParams.forEach((p) => {
          const name = p.Name.split("/").pop() || "";
          const envKey = name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
          if (parsedEnv.has(envKey)) {
            const parsed = parsedEnv.get(envKey)!;
            if (p.Value !== parsed.value) {
              toSaveParams.push({
                ...p,
                Value: parsed.value,
              });
            }
            parsedEnv.delete(envKey);
          } else {
            toDeletePaths.push(p.Name);
          }
        });

        parsedEnv.forEach((parsed) => {
          const newPath = `${node.path}/${parsed.key}`.replace(/\/+/g, "/");
          toSaveParams.push({
            Name: newPath,
            Type: "String",
            Value: parsed.value,
            Description: "",
          });
        });

        if (toDeletePaths.length > 0) {
          await window.api.deleteParameter(toDeletePaths);
        }

        if (toSaveParams.length > 0) {
          await Promise.all(
            toSaveParams.map((p) => window.api.saveParameter(p)),
          );
        }
      }

      await refresh();
      setIsEditing(false);
    } catch (error: any) {
      alert("Failed to save bulk parameters: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="folder-view-container">
      <div className="folder-content">
        <div className="preview-header">
          <span className="label">
            {isEditing ? ".env Bulk Edit" : ".env Preview"}
          </span>
          <div className="preview-actions">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <div className="split-btn-group" ref={saveMenuRef}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(saveMode)}
                    isLoading={isSaving}
                    className="split-btn-main"
                  >
                    Save ({saveMode === "multi" ? "개별 파라미터" : "단일 env"})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                    disabled={isSaving}
                    className="split-btn-arrow"
                  >
                    <ChevronDown size={14} />
                  </Button>

                  {isSaveMenuOpen && (
                    <div className="split-btn-menu">
                      <button
                        onClick={() => {
                          setSaveMode("multi");
                          setIsSaveMenuOpen(false);
                        }}
                      >
                        개별 파라미터로 저장
                      </button>
                      <button
                        onClick={() => {
                          setSaveMode("single");
                          setIsSaveMenuOpen(false);
                        }}
                      >
                        단일 env로 저장 (/env)
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit2 size={14} />}
                  onClick={() => {
                    setEditText(envContent);
                    setIsEditing(true);
                  }}
                  disabled={isSaving}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download size={14} />}
                  disabled={!envContent}
                >
                  Download
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="preview-body-wrapper">
          {isEditing ? (
            <textarea
              className="bulk-edit-area"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              disabled={isSaving}
              placeholder="KEY=VALUE&#10;ANOTHER_KEY=value"
            />
          ) : (
            <pre className="preview-area">
              {renderHighlightedEnv()}
            </pre>
          )}
          {!isEditing && envContent && (
            <button className="preview-copy-btn" onClick={handleCopy} title="Copy">
              {copied ? (
                <Check size={16} color="var(--semantic-success)" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderView;
