export type TParameter = {
  Name: string;
  Type: string;
  Value: string;
  KeyId?: string;
  Description?: string;
  isLocal?: boolean;
};

export type TNode = {
  name: string;
  path: string;
  isFolder: boolean;
  isLocal?: boolean;
  children?: TNode[];
  data?: TParameter;
};

export type TKmsKey = {
  KeyId: string;
  AliasName?: string;
};

export type TInlineEditing = {
  basePath: string;
  type: 'file' | 'folder';
} | null;

export type TContextMenu = {
  x: number;
  y: number;
  node: TNode | null;
} | null;

export type TSaveResponse = {
  success: boolean;
  error?: string;
};

export type TDeleteResponse = {
  success: boolean;
  error?: string;
  local?: boolean;
};
