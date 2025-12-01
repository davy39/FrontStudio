import { Download, Upload, Code2, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSandpack } from "@codesandbox/sandpack-react";
import { useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { encodeProject } from "@/lib/share";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Toolbar() {
  const { sandpack } = useSandpack();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Share Logic (New) ---
  const handleShare = () => {
    try {
      const hash = encodeProject(sandpack.files);

      // Mise à jour de l'URL sans recharger la page
      window.location.hash = hash;

      // Copie dans le presse-papier
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "URL Copied!",
          description: "Share this link to let others edit your code.",
        });
      });
    } catch (e) {
      toast({
        title: "Share Failed",
        description: "Could not generate share link.",
        variant: "destructive",
      });
    }
  };

  // --- Export Logic ---
  const handleExport = () => {
    try {
      const projectData = {
        files: sandpack.files,
        environment: sandpack.environment,
      };

      const dataStr = JSON.stringify(projectData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "frontstudio-sandpack.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Exported", description: "Project files downloaded." });
    } catch (e) {
      toast({
        title: "Export Failed",
        description: "Could not export project.",
        variant: "destructive",
      });
    }
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = JSON.parse(content);

        if (importedData.files) {
          sandpack.resetAllFiles();
          sandpack.updateFile(importedData.files);
          // Nettoyer l'URL car on vient de charger un état externe
          window.history.pushState(
            "",
            document.title,
            window.location.pathname + window.location.search,
          );

          toast({
            title: "Imported",
            description: "Project loaded successfully.",
          });
        } else {
          throw new Error("Invalid project format");
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Import Error",
          description: "Invalid JSON file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Reset Logic ---
  const handleReset = () => {
    sandpack.resetAllFiles();
    // Nettoyer le hash d'URL au reset
    window.history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.search,
    );
    toast({ title: "Reset", description: "Project reset to default state." });
  };

  return (
    <div className="h-12 bg-titlebar-bg border-b border-panel-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg tracking-tight">
            FrontStudio
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleShare}
          className="h-8 text-xs font-medium bg-primary hover:bg-primary/90 text-white"
        >
          <Share2 className="w-3.5 h-3.5 mr-2" />
          Share
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImportClick}
          className="h-8 text-xs font-medium"
        >
          <Upload className="w-3.5 h-3.5 mr-2" />
          Import
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="h-8 text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5 mr-2" />
          Export
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-medium hover:text-destructive"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Project?</AlertDialogTitle>
              <AlertDialogDescription>
                This will revert all files to their initial state. Any unsaved
                changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Reset Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="h-4 w-px bg-border mx-2" />
        <ThemeToggle />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
