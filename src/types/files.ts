export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

export interface FileContentResponse {
  success: boolean;
  data?: {
    content: string;
    path: string;
    size: number;
    modified: string;
  };
  error?: string;
}

export interface FileListResponse {
  success: boolean;
  data?: FileNode[];
  workspace?: string;
  error?: string;
}
