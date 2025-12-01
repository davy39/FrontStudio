import { useState, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SandpackProvider } from "@codesandbox/sandpack-react";
import { sandpackDark, ecoLight } from "@codesandbox/sandpack-themes";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Toolbar } from "@/components/Toolbar";
import { ActivityBar } from "@/components/ActivityBar";
import { CssManager } from "@/components/CssManager";
import { ConsolePanel } from "@/components/ConsolePanel";
import { cn } from "@/lib/utils";
import { decodeProject } from "@/lib/share";
import { useTheme } from "next-themes";
import { SettingsProvider } from "@/contexts/SettingsContext";

const BASE_FILES = {
  "/src/App.tsx": {
    code: `import React, { useState } from 'react';\nimport confetti from 'canvas-confetti';\nimport { Sparkles } from 'lucide-react';\nimport './styles.css';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  const handleClick = () => {\n    setCount(c => c + 1);\n    confetti();\n    console.info(\`Count is $\{count\}\`);\n  };\n\n  return (\n    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">\n      <div className="text-center space-y-6">\n        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">\n          FrontStudio\n        </h1>\n        \n        <p className="text-xl text-slate-400 flex items-center justify-center gap-2">\n          <Sparkles className="w-5 h-5 text-yellow-400" />\n          Fontend development playground\n        </p>\n\n        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">\n          <p className="mb-4 text-lg">Count: <span className="font-mono text-purple-400">{count}</span></p>\n          <button \n            onClick={handleClick}\n            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-all active:scale-95"\n          >\n            Click Me & Confetti 🎉\n          </button>\n        </div>\n\n        <p className="text-sm text-slate-500">\n          Open the console below to see logs!\n        </p>\n      </div>\n    </div>\n  );\n}\n`,
  },
  "/src/styles.css": {
    code: `.font-bold {\n    font-weight: 700;\n}`,
  },
  "/src/index.tsx": {
    code: `import React, { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport "./styles.css";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root"));\nroot.render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n`,
  },
  "/tsconfig.json": {
    code: JSON.stringify(
      {
        compilerOptions: {
          target: "esnext",
          module: "esnext",
          jsx: "react-jsx",
          strict: true,
          moduleResolution: "node",
          esModuleInterop: true,
        },
      },
      null,
      2,
    ),
  },
  "/package.json": {
    code: JSON.stringify(
      {
        name: "cipher-project",
        main: "/src/index.tsx",
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "react-scripts": "5.0.1",
          "canvas-confetti": "^1.9.2",
          "lucide-react": "^0.344.0",
          clsx: "^2.1.0",
          "tailwind-merge": "^2.2.1",
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          typescript: "^5.3.0",
        },
      },
      null,
      2,
    ),
  },
  "/public/index.html": {
    code: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>FrontStudio App</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`,
  },
};

const SANDPACK_SETUP = {
  environment: "create-react-app",
  entry: "/src/index.tsx",
};

const SANDPACK_OPTIONS = {
  activeFile: "/src/App.tsx",
  externalResources: ["https://cdn.tailwindcss.com"],
  initMode: "user-visible",
  initModeObserverOptions: { rootMargin: "1000px 0px" },
};

// Composant Interne pour l'UI
const IDEWorkspace = ({ initialFiles }: { initialFiles: any }) => {
  const [activeView, setActiveView] = useState<"explorer" | "css">("explorer");
  const { resolvedTheme } = useTheme();

  // Note : On utilise SANDPACK_OPTIONS statique.
  // Le filtrage visuel est géré dans FileExplorer.tsx
  return (
    <SandpackProvider
      theme={resolvedTheme === "dark" ? sandpackDark : ecoLight}
      files={initialFiles}
      customSetup={SANDPACK_SETUP}
      options={SANDPACK_OPTIONS}
    >
      <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
        <Toolbar />

        <div className="flex-1 flex overflow-hidden">
          <ActivityBar activeView={activeView} setActiveView={setActiveView} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <PanelGroup direction="horizontal" className="h-full">
                <Panel
                  defaultSize={20}
                  minSize={15}
                  maxSize={35}
                  className="flex flex-col border-r border-panel-border bg-sidebar-bg"
                >
                  <div
                    className={cn(
                      "h-full flex flex-col",
                      activeView !== "explorer" && "hidden",
                    )}
                  >
                    <FileExplorer />
                  </div>
                  <div
                    className={cn(
                      "h-full flex flex-col",
                      activeView !== "css" && "hidden",
                    )}
                  >
                    <CssManager />
                  </div>
                </Panel>

                <PanelResizeHandle className="w-1 bg-panel-border hover:bg-primary transition-colors" />

                <Panel defaultSize={40} minSize={30} className="flex flex-col">
                  <CodeEditor />
                </Panel>

                <PanelResizeHandle className="w-1 bg-panel-border hover:bg-primary transition-colors" />

                <Panel
                  defaultSize={40}
                  minSize={30}
                  className="flex flex-col border-l border-panel-border bg-editor-bg"
                >
                  <PreviewPanel />
                </Panel>
              </PanelGroup>
            </div>

            <ConsolePanel />
          </div>
        </div>
      </div>
    </SandpackProvider>
  );
};

const Index = () => {
  // ... (logique de chargement depuis URL inchangée) ...
  const initialFiles = useMemo(() => {
    try {
      const hash = window.location.hash;
      const decoded = decodeProject(hash);
      if (decoded) return decoded;
    } catch (e) {
      console.error("Failed to load project from URL", e);
    }
    return BASE_FILES;
  }, []);

  return (
    <SettingsProvider>
      <IDEWorkspace initialFiles={initialFiles} />
    </SettingsProvider>
  );
};

export default Index;
