import { useState, useEffect, useMemo, useCallback } from "react";
import { buildTree } from "../utils/treeBuilder";
import useLocalStorage from "./useLocalStorage";
import type {
  TParameter,
  TKmsKey,
  TSaveResponse,
  TDeleteResponse,
  TNode,
} from "../types/ssm";

export function useSSM(region?: string, profile?: string) {
  const [remoteParameters, setRemoteParameters] = useState<TParameter[]>([]);

  const paramsKey = useMemo(
    () => `ssm-local-params:${profile || "default"}:${region || "default"}`,
    [profile, region]
  );
  const foldersKey = useMemo(
    () => `ssm-local-folders:${profile || "default"}:${region || "default"}`,
    [profile, region]
  );

  const [localParameters, setLocalParameters] = useLocalStorage<TParameter[]>(
    paramsKey,
    [],
  );
  const [localFoldersList, setLocalFoldersList] = useLocalStorage<string[]>(
    foldersKey,
    [],
  );

  const [kmsKeys, setKmsKeys] = useState<TKmsKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const localFolders = useMemo(
    () => new Set(localFoldersList),
    [localFoldersList],
  );

  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [params, keys] = await Promise.all([
        window.api.getParameters().catch(() => []),
        window.api.getKmsKeys().catch(() => []),
      ]);
      setRemoteParameters(params || []);
      setKmsKeys(keys || []);

      if (params && params.length > 0) {
        const remoteNames = new Set(params.map((p) => p.Name));
        setLocalParameters((prev) =>
          prev.filter((lp) => !remoteNames.has(lp.Name))
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoaded(true);
    }
  }, [setLocalParameters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, region, profile]);

  const allParameters = useMemo(() => {
    const combined = [...remoteParameters];
    localParameters.forEach((lp) => {
      if (!combined.find((p) => p.Name === lp.Name)) {
        combined.push({ ...lp, isLocal: true });
      }
    });
    return combined;
  }, [remoteParameters, localParameters]);

  const tree = useMemo((): TNode[] => {
    try {
      const filtered = allParameters.filter((p) =>
        p.Name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      const baseTree: TNode[] = (buildTree(filtered) as TNode[]) || [];

      localFolders.forEach((folderPath) => {
        const parts = folderPath.split("/").filter((p) => p.length > 0);
        let current = baseTree;
        let path = "";
        parts.forEach((part) => {
          path += "/" + part;
          let existing = current.find((n) => n.path === path);
          if (!existing) {
            existing = {
              name: part,
              path,
              isFolder: true,
              children: [],
              isLocal: true,
            };
            current.push(existing);
          }
          current = existing.children || [];
        });
      });
      return baseTree;
    } catch (e) {
      return [];
    }
  }, [allParameters, searchQuery, localFolders]);

  const saveParameter = async (data: TParameter): Promise<TSaveResponse> => {
    setIsLoading(true);
    try {
      await window.api.saveParameter(data);
      setLocalParameters((prev) => prev.filter((p) => p.Name !== data.Name));
      setRemoteParameters((prev) => {
        const exists = prev.find((p) => p.Name === data.Name);
        if (exists) {
          return prev.map((p) =>
            p.Name === data.Name ? { ...data, isLocal: false } : p,
          );
        }
        return [...prev, { ...data, isLocal: false }];
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteParameter = async (node: TNode): Promise<TDeleteResponse> => {
    const isActuallyLocal = !remoteParameters.some(
      (p) => p.Name === node.path || p.Name.startsWith(node.path + "/"),
    );

    if (isActuallyLocal) {
      if (node.isFolder) {
        setLocalFoldersList((prev) =>
          prev.filter((f) => !f.startsWith(node.path)),
        );
        setLocalParameters((prev) =>
          prev.filter((p) => !p.Name.startsWith(node.path)),
        );
      } else {
        setLocalParameters((prev) => prev.filter((p) => p.Name !== node.path));
      }
      return { success: true, local: true };
    }

    try {
      const namesToDelete: string[] = [];
      if (node.isFolder) {
        const children = remoteParameters
          .filter((p) => p.Name.startsWith(node.path + "/"))
          .map((p) => p.Name);
        namesToDelete.push(...children);
        // Also check if the path itself is a parameter
        if (remoteParameters.find((p) => p.Name === node.path)) {
          namesToDelete.push(node.path);
        }
      } else {
        namesToDelete.push(node.path);
      }

      if (namesToDelete.length > 0) {
        await window.api.deleteParameter(namesToDelete);
        setRemoteParameters((prev) =>
          prev.filter((p) => !namesToDelete.includes(p.Name)),
        );
      }

      // Cleanup local stuff too if folder
      if (node.isFolder) {
        setLocalFoldersList((prev) =>
          prev.filter((f) => !f.startsWith(node.path)),
        );
        setLocalParameters((prev) =>
          prev.filter((p) => !p.Name.startsWith(node.path)),
        );
      }

      return { success: true, local: false };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    parameters: allParameters,
    setParameters: setLocalParameters,
    kmsKeys,
    tree,
    isLoading,
    searchQuery,
    setSearchQuery,
    localFolders,
    setLocalFolders: (fn: any) => {
      const next = typeof fn === "function" ? fn(localFolders) : fn;
      setLocalFoldersList(Array.from(next as Set<string>));
    },
    refresh: fetchData,
    saveParameter,
    deleteParameter,
    isInitialLoaded,
  };
}
