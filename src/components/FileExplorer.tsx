import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  FileJson,
  FileCode2,
  FileType2,
  Code2,
  Pencil,
  Image as ImageIcon,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext"; // <--- Import

// --- Types & Icons Helper (Inchangés) ---
interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "tsx":
    case "ts":
      return <FileCode2 className="w-4 h-4 text-blue-400" />;
    case "jsx":
    case "js":
      return <FileCode2 className="w-4 h-4 text-yellow-400" />;
    case "css":
    case "scss":
      return <Code2 className="w-4 h-4 text-sky-300" />;
    case "json":
      return <FileJson className="w-4 h-4 text-yellow-200" />;
    case "html":
      return <FileType2 className="w-4 h-4 text-orange-400" />;
    case "png":
    case "jpg":
    case "svg":
      return <ImageIcon className="w-4 h-4 text-purple-400" />;
    default:
      return <FileIcon className="w-4 h-4 text-muted-foreground" />;
  }
};

// --- Tree Builders (Inchangés) ---
const buildTree = (files: string[]): TreeNode[] => {
  const root: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};
  const sortedFiles = files.sort();

  sortedFiles.forEach((path) => {
    const parts = path.split("/").filter(Boolean);
    let currentPath = "";

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const parentPath = currentPath;
      currentPath = parentPath === "/" ? `/${part}` : `${parentPath}/${part}`;

      if (!map[currentPath]) {
        const node: TreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        map[currentPath] = node;

        if (index === 0) {
          root.push(node);
        } else {
          const parentNode = map[parentPath];
          if (parentNode && parentNode.children) {
            if (!parentNode.children.find((c) => c.path === currentPath)) {
              parentNode.children.push(node);
            }
          }
        }
      }
    });
  });

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);
  return root;
};

const getVisibleNodes = (
  nodes: TreeNode[],
  expandedFolders: Set<string>,
  result: TreeNode[] = [],
) => {
  for (const node of nodes) {
    result.push(node);
    if (
      node.type === "folder" &&
      expandedFolders.has(node.path) &&
      node.children
    ) {
      getVisibleNodes(node.children, expandedFolders, result);
    }
  }
  return result;
};

export function FileExplorer() {
  const { sandpack } = useSandpack();
  const { files, activeFile, openFile, updateFile, deleteFile } = sandpack;
  const { showHiddenFiles } = useSettings(); // <--- Utilisation du contexte

  // --- State ---
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/src"]),
  );
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [creationParent, setCreationParent] = useState<string | null>(null);

  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- FILTRAGE ET CONSTRUCTION DE L'ARBRE ---
  const filePaths = useMemo(() => {
    const allPaths = Object.keys(files);
    if (showHiddenFiles) {
      return allPaths;
    }
    // Filtrage : on ne garde que ce qui est dans /src/
    return allPaths.filter((path) => path.startsWith("/src/"));
  }, [files, showHiddenFiles]);

  const tree = useMemo(() => buildTree(filePaths), [filePaths]);

  // --- Helpers (Move, Toggle, Click) ---

  const moveFileOrFolder = (sourcePath: string, targetFolder: string) => {
    const fileName = sourcePath.split("/").pop();
    const newPath =
      targetFolder === "/" || targetFolder === ""
        ? `/${fileName}`
        : `${targetFolder}/${fileName}`;

    if (newPath === sourcePath) return;
    if (files[newPath]) return;

    const isFolder = !files[sourcePath];

    if (!isFolder) {
      const content = files[sourcePath].code;
      updateFile(newPath, content);
      deleteFile(sourcePath);
      if (activeFile === sourcePath) openFile(newPath);
    } else {
      Object.keys(files).forEach((file) => {
        if (file.startsWith(sourcePath + "/")) {
          const content = files[file].code;
          const newFilePath = file.replace(sourcePath, newPath);
          updateFile(newFilePath, content);
          deleteFile(file);
        }
      });
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleFileClick = (node: TreeNode) => {
    if (node.type === "folder") {
      toggleFolder(node.path);
    } else {
      openFile(node.path);
    }
  };

  // --- CRUD Operations (Create, Rename, Delete) ---

  const startCreating = (
    type: "file" | "folder",
    parentPath: string | null,
  ) => {
    setIsCreating(type);
    setCreationParent(parentPath || "/");
    setEditingName("");
    if (parentPath && parentPath !== "/") {
      setExpandedFolders((prev) => new Set(prev).add(parentPath));
    }
  };

  const confirmCreate = () => {
    if (!editingName.trim()) {
      cancelEdit();
      return;
    }

    let parent = creationParent;
    if (parent === "/" || parent === null) parent = "";

    const newPath = `${parent}/${editingName}`;

    if (files[newPath]) {
      toast({
        title: "Error",
        description: "File already exists",
        variant: "destructive",
      });
      return;
    }

    if (isCreating === "file") {
      updateFile(newPath, "");
      openFile(newPath);
    } else {
      updateFile(`${newPath}/.keep`, "");
    }
    cancelEdit();
  };

  const startRenaming = (node: TreeNode) => {
    setRenamingPath(node.path);
    setEditingName(node.name);
  };

  const confirmRename = () => {
    if (!renamingPath || !editingName.trim()) {
      cancelEdit();
      return;
    }

    const pathParts = renamingPath.split("/");
    pathParts.pop();
    const basePath = pathParts.join("/");
    const newPath =
      basePath === "" ? `/${editingName}` : `${basePath}/${editingName}`;

    if (newPath !== renamingPath) {
      moveFileOrFolder(renamingPath, basePath === "" ? "/" : basePath);

      // Logique manuelle pour renommer en place (au cas où moveFileOrFolder ne suffit pas pour le rename pur)
      const isFolder = !files[renamingPath];
      if (!isFolder) {
        const content = files[renamingPath].code;
        updateFile(newPath, content);
        deleteFile(renamingPath);
        if (activeFile === renamingPath) openFile(newPath);
      } else {
        Object.keys(files).forEach((file) => {
          if (file.startsWith(renamingPath + "/")) {
            const content = files[file].code;
            const newFilePath = file.replace(renamingPath, newPath);
            updateFile(newFilePath, content);
            deleteFile(file);
          }
        });
      }
    }
    cancelEdit();
  };

  const deleteNode = (node: TreeNode) => {
    if (confirm(`Delete ${node.name}?`)) {
      if (node.type === "file") {
        deleteFile(node.path);
      } else {
        Object.keys(files).forEach((file) => {
          if (file.startsWith(node.path + "/")) {
            deleteFile(file);
          }
        });
      }
    }
  };

  const cancelEdit = () => {
    setIsCreating(null);
    setRenamingPath(null);
    setEditingName("");
  };

  // --- Drag & Drop Handlers (Inchangés) ---
  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    e.stopPropagation();
    setDraggedPath(node.path);
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverNode = (e: React.DragEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      node.type === "folder" &&
      draggedPath &&
      node.path !== draggedPath &&
      !node.path.startsWith(draggedPath + "/")
    ) {
      setDragTarget(node.path);
      e.dataTransfer.dropEffect = "move";
    } else {
      setDragTarget(null);
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedPath) {
      setIsRootDragOver(true);
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDropOnNode = (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
    setIsRootDragOver(false);
    if (!draggedPath) return;
    moveFileOrFolder(draggedPath, targetNode.path);
    setExpandedFolders((prev) => new Set(prev).add(targetNode.path));
    setDraggedPath(null);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    if (!draggedPath) return;
    moveFileOrFolder(draggedPath, "/");
    setDraggedPath(null);
  };

  // --- Keyboard & Focus (Inchangés) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (renamingPath || isCreating) return;
      if (!containerRef.current?.contains(document.activeElement)) return;

      const visibleNodes = getVisibleNodes(tree, expandedFolders);
      const currentIndex = visibleNodes.findIndex((n) => n.path === activeFile);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = visibleNodes[currentIndex + 1] || visibleNodes[0];
        if (next && next.type === "file") openFile(next.path);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev =
          visibleNodes[currentIndex - 1] ||
          visibleNodes[visibleNodes.length - 1];
        if (prev && prev.type === "file") openFile(prev.path);
      } else if (e.key === "Delete") {
        const node = visibleNodes.find((n) => n.path === activeFile);
        if (node) deleteNode(node);
      } else if (e.key === "F2") {
        const node = visibleNodes.find((n) => n.path === activeFile);
        if (node) startRenaming(node);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile, expandedFolders, tree, renamingPath, isCreating]);

  useEffect(() => {
    if ((renamingPath || isCreating) && inputRef.current) {
      inputRef.current.focus();
      if (renamingPath) {
        const val = inputRef.current.value;
        const dot = val.lastIndexOf(".");
        if (dot > 0) inputRef.current.setSelectionRange(0, dot);
        else inputRef.current.select();
      }
    }
  }, [renamingPath, isCreating]);

  // --- Render Node (Inchangé, voir composant précédent) ---
  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = activeFile === node.path;
    const isRenaming = renamingPath === node.path;
    const isDragOver = dragTarget === node.path;

    return (
      <div key={node.path}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              draggable={!isRenaming}
              onDragStart={(e) => handleDragStart(e, node)}
              onDragOver={(e) => handleDragOverNode(e, node)}
              onDrop={(e) => handleDropOnNode(e, node)}
              onClick={() => handleFileClick(node)}
              className={cn(
                "flex items-center gap-1.5 py-1 pr-2 cursor-pointer border-l-2 border-transparent select-none",
                isSelected
                  ? "bg-accent text-accent-foreground border-primary"
                  : "hover:bg-sidebar-hover text-muted-foreground hover:text-foreground",
                isDragOver && "bg-primary/20 ring-1 ring-inset ring-primary",
                draggedPath === node.path && "opacity-50",
              )}
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
              {depth > 0 && (
                <div
                  className="absolute left-0 w-px h-full bg-border/40"
                  style={{ left: `${depth * 12}px` }}
                />
              )}

              {node.type === "folder" ? (
                <span className="shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              ) : (
                <span className="w-4 shrink-0" />
              )}

              {node.type === "folder" ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-400/80 shrink-0" />
                )
              ) : (
                <span className="shrink-0">{getFileIcon(node.name)}</span>
              )}

              {isRenaming ? (
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") confirmRename();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={confirmRename}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 text-sm py-0 px-1 ml-1 bg-background border-primary focus-visible:ring-1 focus-visible:ring-primary min-w-0 flex-1"
                />
              ) : (
                <span className="text-sm truncate ml-1">{node.name}</span>
              )}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-48">
            {node.type === "folder" && (
              <>
                <ContextMenuItem
                  onClick={() => startCreating("file", node.path)}
                >
                  <Plus className="w-4 h-4 mr-2" /> New File
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => startCreating("folder", node.path)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" /> New Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem onClick={() => startRenaming(node)}>
              <Pencil className="w-4 h-4 mr-2" /> Rename{" "}
              <span className="ml-auto text-xs text-muted-foreground">F2</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => deleteNode(node)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete{" "}
              <span className="ml-auto text-xs opacity-70">Del</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {node.type === "folder" && isExpanded && (
          <div className="relative">
            <div
              className="absolute left-0 w-px h-full bg-border/40"
              style={{ left: `${(depth + 1) * 12 + 6}px` }}
            />
            {isCreating && creationParent === node.path && (
              <div
                className="flex items-center gap-1.5 py-1 pr-2"
                style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
              >
                <span className="w-4 shrink-0" />
                {isCreating === "folder" ? (
                  <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") confirmCreate();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={confirmCreate}
                  className="h-6 text-sm py-0 px-1 ml-1 bg-background border-primary focus-visible:ring-1 focus-visible:ring-primary min-w-0 flex-1"
                  placeholder={
                    isCreating === "file" ? "filename.tsx" : "folder name"
                  }
                />
              </div>
            )}
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-full bg-sidebar-bg flex flex-col border-r border-panel-border select-none outline-none"
      tabIndex={0}
    >
      <div className="flex items-center justify-between p-3 border-b border-panel-border h-10 shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
          Explorer
        </span>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-sidebar-hover text-muted-foreground"
            onClick={() => startCreating("file", "/src")}
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-sidebar-hover text-muted-foreground"
            onClick={() => startCreating("folder", "/src")}
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ContextMenu>
        <ContextMenuTrigger className="flex-1 overflow-hidden h-full">
          <div
            className={cn(
              "h-full overflow-auto py-2",
              isRootDragOver &&
                "bg-primary/5 ring-2 ring-inset ring-primary/50",
            )}
            onDragOver={handleDragOverRoot}
            onDragLeave={() => setIsRootDragOver(false)}
            onDrop={handleDropOnRoot}
          >
            {isCreating && (!creationParent || creationParent === "/") && (
              <div className="flex items-center gap-1.5 py-1 px-3">
                <span className="w-4 shrink-0" />
                {isCreating === "folder" ? (
                  <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") confirmCreate();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={confirmCreate}
                  className="h-6 text-sm py-0 px-1 ml-1 bg-background border-primary focus-visible:ring-1 focus-visible:ring-primary min-w-0 flex-1"
                  placeholder={
                    isCreating === "file" ? "filename.tsx" : "folder name"
                  }
                />
              </div>
            )}

            {tree.map((node) => renderNode(node, 0))}

            <div className="min-h-[100px] flex-1" />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => startCreating("file", "/")}>
            <Plus className="w-4 h-4 mr-2" /> New File at Root
          </ContextMenuItem>
          <ContextMenuItem onClick={() => startCreating("folder", "/")}>
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder at Root
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
