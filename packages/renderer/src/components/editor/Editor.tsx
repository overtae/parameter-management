import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Tag, Database, Shield, KeyRound, Copy, Check, Folder } from "lucide-react";
import Input from "../ui/Input";
import { useSSMContext } from "../../providers/SSMContext";
import type { TKmsKey } from "../../types/ssm";
import "./Editor.css";

const Editor: React.FC = () => {
  const { kmsKeys, editingParameter, setEditingParameter } = useSSMContext();
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingParameter?.Value) {
      navigator.clipboard.writeText(editingParameter.Value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!editingParameter) return null;

  return (
    <motion.div
      className="editor-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="editor-grid">
        <section>
          <div className="section-title">
            <Folder size={14} />
            <span>Full Path</span>
          </div>
          <div className="field-group">
            <Input
              showCopy
              value={editingParameter.Name}
              onChange={(e) =>
                setEditingParameter({
                  ...editingParameter,
                  Name: e.target.value,
                })
              }
            />
          </div>
        </section>

        <section>
          <div className="section-title">
            <Tag size={14} />
            <span>Parameter Name</span>
          </div>
          <div className="field-group">
            <Input
              showCopy
              value={editingParameter.Name.split('/').pop() || ""}
              onChange={(e) => {
                const parts = editingParameter.Name.split('/');
                parts[parts.length - 1] = e.target.value;
                setEditingParameter({
                  ...editingParameter,
                  Name: parts.join('/'),
                });
              }}
            />
          </div>
        </section>

        <section className="section-row">
          <div className="section-title">
            <Shield size={14} />
            <span>Type</span>
          </div>
          <div className="field-group">
            <div className="type-toggle">
              {["String", "StringList", "SecureString"].map((t) => (
                <button
                  key={t}
                  className={editingParameter.Type === t ? "active" : ""}
                  onClick={() =>
                    setEditingParameter({
                      ...editingParameter,
                      Type: t as any,
                    })
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {editingParameter.Type === "SecureString" && (
          <section className="section-row">
            <div className="section-title">
              <KeyRound size={14} />
              <span>KMS Key</span>
            </div>
            <div className="field-group">
              <div className="field-group">
                <div className="select-wrapper">
                  <Database size={14} className="icon" />
                  <select
                    value={editingParameter.KeyId || ""}
                    onChange={(e) =>
                      setEditingParameter({
                        ...editingParameter,
                        KeyId: e.target.value,
                      })
                    }
                  >
                    <option value="">Default (alias/aws/ssm)</option>
                    {kmsKeys.map((key: TKmsKey) => (
                      <option key={key.KeyId} value={key.KeyId}>
                        {key.AliasName || key.KeyId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="section-title">
            <Database size={14} />
            <span>Value</span>
          </div>
          <div className="value-textarea-wrapper">
            <textarea
              rows={8}
              value={editingParameter.Value}
              onChange={(e) =>
                setEditingParameter({
                  ...editingParameter,
                  Value: e.target.value,
                })
              }
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={
                isFocused || editingParameter.Type !== "SecureString"
                  ? ""
                  : "secure-value"
              }
              placeholder="Enter value..."
            />
            {editingParameter.Value && (
              <button className="copy-btn" onClick={handleCopy} type="button">
                {copied ? (
                  <Check size={14} color="var(--semantic-success)" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="section-title">
            <FileText size={14} />
            <span>Description</span>
          </div>
          <textarea
            placeholder="What is this parameter for?"
            value={editingParameter.Description || ""}
            onChange={(e) =>
              setEditingParameter({
                ...editingParameter,
                Description: e.target.value,
              })
            }
          />
        </section>
      </div>
    </motion.div>
  );
};

export default Editor;
