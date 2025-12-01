/// <reference types="vite/client" />

declare module "sandpack-file-explorer" {
  import { ReactNode } from "react";

  export interface SandpackFileExplorerProps {
    children?: ReactNode;
    autoHiddenFiles?: boolean;
    initialOpenPaths?: string[];
  }

  export const SandpackFileExplorer: React.FC<SandpackFileExplorerProps>;
}
