# ⚡ FrontStudio
[![alt text](https://img.shields.io/badge/demo_online-2ea44f.svg?style=for-the-badge&logo=github&logoColor=white)](https://davy39.github.io/FrontStudio)
[![License](https://img.shields.io/badge/license_%20%20GNU%20GPLv3%20-green?style=for-the-badge&logo=gnu)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.0+-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_7.0+-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_4.0+-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui_3.0+-000?logo=shadcnui&logoColor=fff&style=for-the-badge)](https://ui.shadcn.com/)

**FrontStudio** is a sophisticated, browser-based Integrated Development Environment (IDE) tailored for React development. It offers a VS Code-like experience directly in the browser, allowing developers to write, preview, manage dependencies, and share React projects instantly without any local setup.

Built on top of the powerful **Sandpack** ecosystem, FrontStudio provides a fully functional ephemeral file system, live preview, and intelligent code editing capabilities.

---

## 🚀 Features

*   **💻 Full-Featured Code Editor:**
    *   Powered by **Monaco Editor** (VS Code's core).
    *   Syntax highlighting, line numbers, and minimap.
    *   **IntelliSense & Type Acquisition:** Automatic downloading of TypeScript types (`@types/pkg`) for imported libraries.
    *   **Prettier Integration:** Auto-format code with a click.
*   **📂 File Explorer:**
    *   Create, rename, delete, and move files and folders.
    *   Drag-and-drop support for organizing project structure.
    *   Context menus for quick actions.
*   **🖥️ Live Preview:**
    *   Instant feedback with a hot-reloading preview panel.
    *   Error overlays and status indicators.
*   **📦 Dependency Manager:**
    *   visual interface to add/remove NPM packages via `package.json`.
    *   **Auto-Install:** Detects new `import` statements in your code and automatically adds them to dependencies.
*   **🛠️ Console & Debugging:**
    *   Integrated console to view logs, warnings, and errors from the preview environment.
*   **🔗 Sharing & Persistence:**
    *   **Share via URL:** Compresses the entire project state into a shareable URL hash.
    *   **Import/Export:** Save projects as JSON files or load existing ones.
*   **🎨 UI/UX:**
    *   Fully responsive layout with resizable panels.
    *   Dark/Light mode support (System sync).
    *   Clean, modern interface built with **Shadcn UI**.

---

## 🛠️ Tech Stack & Libraries

FrontStudio relies on a robust stack of modern web technologies.

### Core Architecture
*   [**React 19**](https://react.dev/) - The library for web and native user interfaces.
*   [**TypeScript**](https://www.typescriptlang.org/) - Strongly typed JavaScript for scalable development.
*   [**Vite**](https://vitejs.dev/) - Next Generation Frontend Tooling for fast builds.

### IDE Engine
*   [**@codesandbox/sandpack-react**](https://sandpack.codesandbox.io/) - The component toolkit that powers the in-browser bundling and preview engine.
*   [**@monaco-editor/react**](https://github.com/suren-atoyan/monaco-react) - React component for the Monaco Editor (VS Code).
*   [**@typescript/ata**](https://github.com/hediet/typescript-ata) - Automatic Type Acquisition to fetch `.d.ts` files for IntelliSense.
*   [**Prettier**](https://prettier.io/) - An opinionated code formatter run in the browser.

### UI & Styling
*   [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework.
*   [**Shadcn UI**](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
*   [**Radix UI**](https://www.radix-ui.com/) - Unstyled, accessible components for building high-quality design systems.
*   [**Lucide React**](https://lucide.dev/) - Beautiful & consistent icons.
*   [**React Resizable Panels**](https://github.com/bvaughn/react-resizable-panels) - For the adjustable IDE layout.
*   [**Next Themes**](https://github.com/pacocoursey/next-themes) - Perfect dark mode implementation.
*   [**Sonner**](https://sonner.emilkowal.ski/) - An opinionated toast component for React.

### Utilities
*   [**LZ-String**](https://github.com/pieroxy/lz-string) - Fast compression algorithm to store project code within the URL hash.
*   [**React DnD**](https://react-dnd.github.io/react-dnd/) (via Sandpack internal utils) - Handling drag-and-drop operations.

---

## ⚙️ How It Works

### 1. The Sandpack Core
FrontStudio wraps the application in a `SandpackProvider`. This creates a virtual file system and handles the bundling logic. Unlike traditional bundlers that run on a server, Sandpack runs entirely in the browser using Service Workers to intercept requests and serve the compiled React code.

### 2. File System & Explorer
The `FileExplorer` component visualizes the virtual file system provided by Sandpack. It transforms the flat file list (e.g., `{"/src/App.tsx": "..."}`) into a nested tree structure.
*   **Operations:** When you rename or move a file, the app updates the Sandpack state, which triggers a re-bundle.
*   **Context:** A `SettingsContext` is used to toggle visibility of configuration files (like `vite.config.ts` or `tsconfig.json`).

### 3. Dependency Management & Auto-Import
The `CodeEditor` component uses regex (`IMPORT_REGEX`) to scan the active code for import statements.
*   If a user types `import { motion } from "framer-motion"`, the system checks `package.json`.
*   If missing, it automatically installs the "latest" version by updating the virtual `package.json` file.

### 4. URL Sharing Mechanism
To make projects shareable without a database:
1.  The `files` object from Sandpack is serialized to JSON.
2.  `lz-string` compresses this JSON into a URL-safe string.
3.  This string is appended to the URL hash (`#`).
4.  On load, `Index.tsx` checks for a hash, decompresses it, and hydrates the IDE state.

---

## 📦 Installation

To run FrontStudio locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/frontstudio.git
    cd frontstudio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:8080`.

---

## 📖 Usage Guide

### Creating Files
1.  Open the **File Explorer** (Files icon in the sidebar).
2.  Right-click on a folder or use the `+` buttons at the top to create a New File or Folder.
3.  Files ending in `.tsx`, `.ts`, `.css`, etc., will be handled automatically.

### Managing Dependencies
1.  Click the **Package** icon in the Activity Bar (sidebar).
2.  Type the name of a package (e.g., `canvas-confetti`) and click **Add**.
3.  Alternatively, simply `import` the package in your code, and FrontStudio will attempt to auto-install it.

### Sharing Code
1.  Click the **Share** button in the top toolbar.
2.  The URL in your browser bar is automatically updated.
3.  The link is copied to your clipboard. Send this link to anyone to share your exact project state.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
