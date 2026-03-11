"use client";

import * as React from "react";

export interface FileTreeDragContextValue {
  readOnly: boolean;
}

const defaultValue: FileTreeDragContextValue = {
  readOnly: true,
};

const FileTreeDragContext =
  React.createContext<FileTreeDragContextValue>(defaultValue);

export function useFileTreeDragContext(): FileTreeDragContextValue {
  return React.useContext(FileTreeDragContext);
}

export { FileTreeDragContext };
