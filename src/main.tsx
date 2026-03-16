import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { AppSettingsProvider } from "./appSettings";
import { I18nProvider } from "./i18n";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <AppSettingsProvider>
        <App />
      </AppSettingsProvider>
    </I18nProvider>
  </React.StrictMode>
);

