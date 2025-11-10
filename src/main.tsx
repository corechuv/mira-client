// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
// $ import App from "./App";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nContext";

import "./styles/global.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ThemeProvider>
          {/*<App />*/}
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);