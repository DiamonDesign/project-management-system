import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter

createRoot(document.getElementById("root")!).render(
  <BrowserRouter> {/* BrowserRouter moved here */}
    <App />
  </BrowserRouter>
);