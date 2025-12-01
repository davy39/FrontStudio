import { SandpackPreview } from "@codesandbox/sandpack-react";

export function PreviewPanel() {
  return (
    <div className="h-full w-full bg-editor-bg flex flex-col">
      <SandpackPreview
        showNavigator={false}
        showRefreshButton={true}
        showOpenInCodeSandbox={true}
        className="h-full w-full"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      />
    </div>
  );
}
