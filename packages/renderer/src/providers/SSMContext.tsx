import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useSSM } from "../hooks/useSSM";
import type {
  TNode,
  TKmsKey,
  TInlineEditing,
  TContextMenu,
  TParameter,
  TSaveResponse,
  TDeleteResponse,
} from "../types/ssm";

type TSSMContext = {
  tree: TNode[];
  parameters: TParameter[];
  kmsKeys: TKmsKey[];
  isLoading: boolean;
  selectedPath: string | null;
  setSelectedPath: (path: string | null) => void;
  expandedFolders: Set<string>;
  inlineEditing: TInlineEditing;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectNode: (node: TNode | null) => void;
  toggleFolder: (path: string) => void;
  setInlineEditing: (editing: TInlineEditing) => void;
  submitInline: (name: string | null) => void;
  contextMenu: TContextMenu;
  setContextMenu: (menu: TContextMenu) => void;
  editingParameter: TParameter | null;
  setEditingParameter: (param: TParameter | null) => void;
  confirmDeleteNode: TNode | null;
  setConfirmDeleteNode: (node: TNode | null) => void;
  refresh: () => Promise<void>;
  saveParameter: (data: TParameter) => Promise<TSaveResponse>;
  deleteParameter: (node: TNode) => Promise<TDeleteResponse>;
  isInitialLoaded: boolean;
};

const SSMContext = createContext<TSSMContext | undefined>(undefined);

export type SSMProviderProps = {
  children: React.ReactNode;
  region: string;
  profile: string;
};

export const SSMProvider: React.FC<SSMProviderProps> = ({
  children,
  region,
  profile,
}) => {
  const {
    tree,
    parameters,
    kmsKeys,
    isLoading,
    searchQuery,
    setSearchQuery,
    setLocalFolders,
    setParameters,
    refresh,
    saveParameter,
    deleteParameter,
    isInitialLoaded,
  } = useSSM(region, profile);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [inlineEditing, setInlineEditing] = useState<TInlineEditing>(null);
  const [contextMenu, setContextMenu] = useState<TContextMenu>(null);
  const [editingParameter, setEditingParameter] = useState<TParameter | null>(
    null,
  );
  const [confirmDeleteNode, setConfirmDeleteNode] = useState<TNode | null>(
    null,
  );

  useEffect(() => {
    if (inlineEditing?.basePath) {
      setExpandedFolders((prev) => {
        if (!prev.has(inlineEditing.basePath)) {
          const next = new Set(prev);
          next.add(inlineEditing.basePath);
          return next;
        }
        return prev;
      });
    }
  }, [inlineEditing]);

  const selectNode = useCallback(
    (node: TNode | null) => {
      const path = node?.path || null;
      setSelectedPath(path);

      if (path) {
        const existing = parameters.find((p) => p.Name === path);
        if (existing) {
          setEditingParameter({ ...existing });
        } else if (node && !node.isFolder) {
          setEditingParameter({
            Name: path,
            Type: "String",
            Value: "",
            Description: "",
            isLocal: true,
          });
        } else {
          setEditingParameter(null);
        }
      } else {
        setEditingParameter(null);
      }
    },
    [parameters],
  );

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const submitInline = useCallback(
    (name: string | null) => {
      if (!name || !inlineEditing) {
        setInlineEditing(null);
        return;
      }

      const newPath = `${inlineEditing.basePath}/${name}`.replace(/\/+/g, "/");
      if (inlineEditing.type === "folder") {
        setLocalFolders((prev: Set<string>) => new Set([...prev, newPath]));
        setExpandedFolders(
          (prev) => new Set([...prev, inlineEditing.basePath, newPath]),
        );
      } else {
        const newParam: TParameter = {
          Name: newPath,
          Type: "String",
          Value: "",
          Description: "",
          isLocal: true,
        };
        setParameters((prev: TParameter[]) => [...prev, newParam]);
        setSelectedPath(newPath);
        setEditingParameter(newParam);
      }
      setInlineEditing(null);
    },
    [inlineEditing, setLocalFolders, setParameters, setEditingParameter],
  );

  const value = useMemo(
    (): TSSMContext => ({
      tree,
      parameters,
      kmsKeys,
      isLoading,
      selectedPath,
      setSelectedPath,
      expandedFolders,
      inlineEditing,
      searchQuery,
      setSearchQuery,
      selectNode,
      toggleFolder,
      setInlineEditing,
      submitInline,
      refresh,
      saveParameter,
      deleteParameter,
      contextMenu,
      setContextMenu,
      editingParameter,
      setEditingParameter,
      confirmDeleteNode,
      setConfirmDeleteNode,
      isInitialLoaded,
    }),
    [
      tree,
      parameters,
      kmsKeys,
      isLoading,
      selectedPath,
      setSelectedPath,
      expandedFolders,
      inlineEditing,
      searchQuery,
      selectNode,
      toggleFolder,
      refresh,
      saveParameter,
      deleteParameter,
      submitInline,
      setSearchQuery,
      contextMenu,
      setContextMenu,
      editingParameter,
      setEditingParameter,
      confirmDeleteNode,
      setConfirmDeleteNode,
      isInitialLoaded,
    ],
  );

  return <SSMContext.Provider value={value}>{children}</SSMContext.Provider>;
};

export const useSSMContext = () => {
  const context = useContext(SSMContext);
  if (!context)
    throw new Error("useSSMContext must be used within a SSMProvider");
  return context;
};
