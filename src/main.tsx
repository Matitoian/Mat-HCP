
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Initialize Sentry for error tracking (optional - requires Sentry account)
// Uncomment and add your DSN from https://sentry.io
/*
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay(),
    new Sentry.BrowserTracing(),
  ],
});
*/

createRoot(document.getElementById("root")!).render(<App />);
  