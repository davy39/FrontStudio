import { Files, Package, Settings, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type View = "explorer" | "css";

interface ActivityBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

export function ActivityBar({ activeView, setActiveView }: ActivityBarProps) {
  const { showHiddenFiles, toggleHiddenFiles } = useSettings();

  return (
    <div className="w-12 bg-activity-bar border-r border-panel-border flex flex-col items-center py-3 gap-3 shrink-0 z-20 h-full">
      <button
        onClick={() => setActiveView("explorer")}
        className={cn(
          "p-2.5 rounded-md transition-all relative group",
          activeView === "explorer"
            ? "text-primary bg-accent/50"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover",
        )}
        title="File Explorer"
      >
        <Files className="w-6 h-6" />
        {activeView === "explorer" && (
          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full" />
        )}
      </button>

      <button
        onClick={() => setActiveView("css")}
        className={cn(
          "p-2.5 rounded-md transition-all relative group",
          activeView === "css"
            ? "text-primary bg-accent/50"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover",
        )}
        title="Dependencies (package.json)"
      >
        <Package className="w-6 h-6" />
        {activeView === "css" && (
          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full" />
        )}
      </button>

      <div className="flex-1" />

      {/* Settings Menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-2.5 rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-sidebar-hover mb-2"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-64 p-4 ml-2">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Settings</h4>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                {showHiddenFiles ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <Label htmlFor="show-files" className="text-sm font-normal">
                  Show config files
                </Label>
              </div>
              <Switch
                id="show-files"
                checked={showHiddenFiles}
                onCheckedChange={toggleHiddenFiles}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When hidden, only the <code>src/</code> folder is visible in the
              explorer.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
