import { useState, useEffect, useRef } from "react";
import { useSandpackConsole } from "@codesandbox/sandpack-react";
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  Eraser,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConsolePanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { logs, reset } = useSandpackConsole({ resetOnPreviewRestart: true });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  return (
    <div
      className={cn(
        "flex flex-col border-t border-panel-border bg-sidebar-bg transition-all duration-300 ease-in-out shrink-0",
        isExpanded ? "h-48" : "h-9",
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-9 cursor-pointer hover:bg-sidebar-hover select-none border-b border-transparent hover:border-panel-border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Terminal className="w-3.5 h-3.5" />
          <span>Console {logs.length > 0 && `(${logs.length})`}</span>
        </div>

        <div className="flex items-center gap-1">
          {isExpanded && logs.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground mr-2"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              title="Clear Console"
            >
              <Eraser className="w-3.5 h-3.5" />
            </Button>
          )}

          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Contenu de la console (Rendu manuel pour garantir la synchro) */}
      <div className="flex-1 bg-editor-bg relative font-mono text-xs overflow-hidden">
        <div className="absolute inset-0 overflow-auto p-2" ref={scrollRef}>
          {logs.length === 0 ? (
            <div className="text-muted-foreground/50 italic p-2">
              Console is empty
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id || index}
                className={cn(
                  "flex gap-2 p-1.5 border-b border-border/40 last:border-0 break-words group",
                  log.method === "error" &&
                    "bg-red-500/10 text-red-400 border-red-500/20",
                  log.method === "warn" &&
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                  log.method === "log" && "text-foreground",
                )}
              >
                {/* Icone selon le type de log */}
                <span className="shrink-0 mt-0.5 opacity-70">
                  {log.method === "error" ? (
                    <XCircle className="w-3 h-3" />
                  ) : log.method === "warn" ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <Info className="w-3 h-3 text-blue-400" />
                  )}
                </span>

                {/* Contenu du message */}
                <div className="flex-1 space-x-2 whitespace-pre-wrap">
                  {log.data.map((part, i) => (
                    <span key={i}>
                      {typeof part === "object"
                        ? JSON.stringify(part, null, 2)
                        : String(part)}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
