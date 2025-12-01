import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import { useActiveCode, useSandpack } from "@codesandbox/sandpack-react";
import { useEffect, useRef } from "react";
import { File as FileIcon, Wand2 } from "lucide-react";
import { setupTypeAcquisition } from "@typescript/ata";
import ts from "typescript";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// Imports Prettier Standalone
import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserHtml from "prettier/plugins/html";
import parserCss from "prettier/plugins/postcss";
import parserTypescript from "prettier/plugins/typescript";

// Regex pour trouver les imports
const IMPORT_REGEX = /import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^./][^'"]*)['"]/g;

/**
 * Nettoie le nom du paquet pour ne garder que la racine.
 */
const normalizePackageName = (specifier: string) => {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return specifier;
  }
  return specifier.split("/")[0];
};

export function CodeEditor() {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const { resolvedTheme } = useTheme();
  const monaco = useMonaco();

  const ataRef = useRef<ReturnType<typeof setupTypeAcquisition> | null>(null);
  const processingRef = useRef(false);

  // Force le thème Monaco
  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(resolvedTheme === "dark" ? "vs-dark" : "light");
    }
  }, [monaco, resolvedTheme]);

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monacoInstance.languages.typescript.JsxEmit.ReactJSX,
      target: monacoInstance.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution:
        monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      typeRoots: ["node_modules/@types"],
    });

    const ata = setupTypeAcquisition({
      projectName: "cipher-studio",
      typescript: ts,
      logger: console,
      delegate: {
        receivedFile: (code, path) => {
          monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
            code,
            `file://${path}`,
          );
        },
      },
    });

    ataRef.current = ata;

    // Scan initial
    ata(`import React from 'react'; import ReactDOM from 'react-dom';`);
    const packageJson = sandpack.files["/package.json"]?.code;
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const content = Object.keys(deps)
          .map((d, i) => `import * as _pkg_${i} from '${d}';`)
          .join("\n");
        ata(content);
      } catch (error) {
        console.error("Error parsing package.json:", error);
      }
    }
    ata(code);
  };

  // --- LOGIQUE D'AUTO-INSTALLATION CORRIGÉE ---
  useEffect(() => {
    if (ataRef.current) {
      ataRef.current(code);
    }

    const checkDependencies = () => {
      if (processingRef.current) return;

      const packageJsonFile = sandpack.files["/package.json"];
      if (!packageJsonFile) return;

      try {
        const pkg = JSON.parse(packageJsonFile.code);
        const currentDeps = pkg.dependencies || {};
        let hasChanges = false;

        let match;
        const foundPackages = new Set<string>();
        IMPORT_REGEX.lastIndex = 0;

        while ((match = IMPORT_REGEX.exec(code)) !== null) {
          const rawImport = match[1];
          if (rawImport.startsWith(".")) continue;
          const cleanPkgName = normalizePackageName(rawImport);
          foundPackages.add(cleanPkgName);
        }

        foundPackages.forEach((pkgName) => {
          if (!currentDeps[pkgName]) {
            if (
              pkgName.startsWith("node:") ||
              pkgName === "react" ||
              pkgName === "react-dom"
            )
              return;

            currentDeps[pkgName] = "latest";
            hasChanges = true;

            toast({
              title: "Installing Dependency",
              description: `Adding ${pkgName} to package.json...`,
            });
          }
        });

        if (hasChanges) {
          processingRef.current = true;
          const newPackageJson = JSON.stringify(
            {
              ...pkg,
              dependencies: currentDeps,
            },
            null,
            2,
          );

          sandpack.updateFile("/package.json", newPackageJson);

          setTimeout(() => {
            processingRef.current = false;
          }, 1500);
        }
      } catch (e) {
        console.error("Auto-install error", e);
      }
    };

    const timer = setTimeout(checkDependencies, 1000);
    return () => clearTimeout(timer);
  }, [code, sandpack]);

  const getLanguage = (filename: string) => {
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".html")) return "html";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".ts") || filename.endsWith(".tsx"))
      return "typescript";
    return "javascript";
  };

  // --- FORMATAGE DU CODE ---
  const handleFormat = async () => {
    const currentFile = sandpack.activeFile;
    let parser = "babel";
    let plugins = [parserBabel, parserEstree];

    if (currentFile.endsWith(".ts") || currentFile.endsWith(".tsx")) {
      parser = "typescript";
      plugins.push(parserTypescript);
    } else if (currentFile.endsWith(".css")) {
      parser = "css";
      plugins = [parserCss];
    } else if (currentFile.endsWith(".html")) {
      parser = "html";
      plugins = [parserHtml];
    } else if (currentFile.endsWith(".json")) {
      parser = "json";
      plugins = [parserBabel, parserEstree];
    }

    try {
      const formatted = await prettier.format(code, {
        parser,
        plugins,
        printWidth: 80,
        tabWidth: 2,
        semi: true,
        singleQuote: false,
      });

      updateCode(formatted);
      toast({
        title: "Formatted",
        description: "Code formatted successfully.",
      });
    } catch (error) {
      console.error("Format error:", error);
      toast({
        title: "Format Error",
        description: "Could not format code. Check syntax.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-editor-bg flex flex-col">
      <div className="h-10 flex items-center justify-between px-4 border-b border-panel-border bg-titlebar-bg shrink-0">
        <div className="flex items-center overflow-hidden">
          <FileIcon className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
          <span
            className="text-sm font-medium truncate"
            title={sandpack.activeFile}
          >
            {sandpack.activeFile}
          </span>
        </div>

        {/* Bouton de formatage */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFormat}
          className="h-7 w-7 ml-2 text-muted-foreground hover:text-foreground"
          title="Format Code (Prettier)"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          path={sandpack.activeFile}
          language={getLanguage(sandpack.activeFile)}
          value={code}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          onChange={(value) => updateCode(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            fontFamily: "JetBrains Mono, monospace",
            fixedOverflowWidgets: true,
          }}
        />
      </div>
    </div>
  );
}
