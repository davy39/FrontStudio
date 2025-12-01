import LZString from "lz-string";
import type { SandpackFiles } from "@codesandbox/sandpack-react";

/**
 * Compresse les fichiers Sandpack en une chaîne encodée pour URL.
 */
export const encodeProject = (files: SandpackFiles): string => {
  try {
    const json = JSON.stringify(files);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    console.error("Error encoding project:", error);
    return "";
  }
};

/**
 * Décompresse un hash d'URL en fichiers Sandpack.
 * Retourne null si le hash est vide ou invalide.
 */
export const decodeProject = (hash: string): SandpackFiles | null => {
  if (!hash) return null;

  // Enlever le '#' initial s'il est présent
  const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!cleanHash) return null;

  try {
    const json = LZString.decompressFromEncodedURIComponent(cleanHash);
    if (!json) return null;
    return JSON.parse(json);
  } catch (error) {
    console.error("Error decoding project:", error);
    return null;
  }
};
