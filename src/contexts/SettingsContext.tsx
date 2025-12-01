import { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  showHiddenFiles: boolean;
  toggleHiddenFiles: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);

  const toggleHiddenFiles = () => {
    setShowHiddenFiles((prev) => !prev);
  };

  return (
    <SettingsContext.Provider value={{ showHiddenFiles, toggleHiddenFiles }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
