import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./hooks/useTheme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            fontSize: "13px",
            fontFamily: "'Inter', system-ui, sans-serif",
            boxShadow: "var(--shadow-elevated)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
