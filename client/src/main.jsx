import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

const root = document.getElementById("root");

function boot() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else if (saved === "light") {
    document.documentElement.classList.remove("dark");
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  }
}

boot();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!bg-white !text-slate-900 dark:!bg-slate-900 dark:!text-slate-50 !shadow-soft !text-sm",
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
