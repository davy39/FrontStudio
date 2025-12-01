import { useState } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Package, Plus, Box } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

export function CssManager() {
  const { sandpack } = useSandpack();
  const [pkgName, setPkgName] = useState("");
  const [version, setVersion] = useState("latest");

  // Parse package.json from Sandpack's virtual file system
  const packageJsonFile = sandpack.files["/package.json"];
  let dependencies: Record<string, string> = {};

  try {
    const parsed = JSON.parse(packageJsonFile?.code || "{}");
    dependencies = parsed.dependencies || {};
  } catch (e) {
    console.error("Error parsing package.json", e);
  }

  const handleAddDependency = () => {
    if (!pkgName.trim()) return;

    try {
      const currentCode = JSON.parse(packageJsonFile.code);

      // Update dependencies
      currentCode.dependencies = {
        ...currentCode.dependencies,
        [pkgName]: version,
      };

      // Write back to Sandpack
      sandpack.updateFile(
        "/package.json",
        JSON.stringify(currentCode, null, 2),
      );

      setPkgName("");
      setVersion("latest");
      toast({
        title: "Dependency Added",
        description: `${pkgName} added to package.json`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update package.json",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDependency = (name: string) => {
    try {
      const currentCode = JSON.parse(packageJsonFile.code);

      if (currentCode.dependencies) {
        delete currentCode.dependencies[name];
      }

      sandpack.updateFile(
        "/package.json",
        JSON.stringify(currentCode, null, 2),
      );
      toast({ title: "Dependency Removed", description: `${name} removed.` });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update package.json",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-sidebar-bg flex flex-col">
      <div className="flex items-center p-2 border-b border-panel-border h-10 shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
          Dependencies
        </span>
      </div>

      <div className="p-3 border-b border-panel-border space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="Package (e.g. framer-motion)"
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
            className="col-span-2 h-7 text-xs bg-editor-bg"
          />
          <Input
            placeholder="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="col-span-1 h-7 text-xs bg-editor-bg"
          />
        </div>
        <Button
          onClick={handleAddDependency}
          className="w-full h-7 text-xs"
          size="sm"
        >
          <Plus className="w-3 h-3 mr-2" /> Add Package
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.keys(dependencies).length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs flex flex-col items-center gap-2">
              <Box className="w-8 h-8 opacity-20" />
              No dependencies installed
            </div>
          )}
          {Object.entries(dependencies).map(([name, ver]) => (
            <div
              key={name}
              className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-hover group border border-transparent hover:border-border transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate text-foreground/90">
                    {name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {ver}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemoveDependency(name)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
