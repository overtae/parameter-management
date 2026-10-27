import type { TParameter, TNode } from "../types/ssm";

// 빌드 중에 사용하는 중간 노드 타입 (빠른 탐색을 위해 children이 객체 형태)
type TBuildNode = {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TBuildNode> | null;
  data: TParameter | null;
};

/**
 * TBuildNode의 객체형 children을 TNode의 배열형으로 변환 및 정렬
 */
const finalizeAndSort = (
  children: Record<string, TBuildNode> | null,
): TNode[] => {
  if (!children) return [];

  const nodes: TNode[] = Object.values(children).map((node) => {
    return {
      name: node.name,
      path: node.path,
      isFolder: node.isFolder,
      data: node.data || undefined,
      children: node.isFolder ? finalizeAndSort(node.children) : undefined,
    };
  });

  return nodes.sort((a, b) => {
    // 1. 폴더 우선 정렬
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    // 2. 이름 알파벳 순 정렬
    return a.name.localeCompare(b.name);
  });
};

/**
 * 파라미터 리스트를 받아 계층 구조의 트리 노드 배열로 변환합니다.
 */
export const buildTree = (parameters: TParameter[]): TNode[] => {
  // 루트는 항상 폴더이므로 초기 children을 객체로 설정
  const root: TBuildNode = {
    name: "root",
    path: "/",
    isFolder: true,
    children: {},
    data: null,
  };

  parameters.forEach((param) => {
    const parts = param.Name.split("/").filter((p) => p.length > 0);
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      // current.children이 null이 아님을 보장 (루트나 중간 폴더들은 항상 {}임)
      if (!current.children) current.children = {};

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: "/" + parts.slice(0, index + 1).join("/"),
          isFolder: !isLast,
          children: isLast ? null : {},
          data: isLast ? param : null,
        };
      }

      // 다음 루프를 위해 포인터 이동
      current = current.children[part];
    });
  });

  // 빌드가 끝난 객체 형태의 children을 배열로 변환하며 정렬
  return finalizeAndSort(root.children);
};
