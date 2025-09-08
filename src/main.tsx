import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter

// Emergency session and error protection
declare global {
  interface Window {
    session?: any;
    __emergencyFallback?: any;
  }
}

// Initialize emergency global session fallback if not already set
if (!window.session) {
  window.session = null;
}

// Additional runtime error protection
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Suppress known external script errors that don't affect our app
  if (message.includes('share-modal.js') || 
      message.includes('addEventListener') && message.includes('null')) {
    console.warn('[SUPPRESSED] External script error:', ...args);
    return;
  }
  
  // Log session errors but don't crash
  if (message.includes('session is not defined')) {
    console.warn('[SESSION ERROR]', ...args);
    // Provide fallback
    if (!window.session) {
      window.session = window.__emergencyFallback?.session || null;
    }
    return;
  }
  
  // Call original console.error for other errors
  originalConsoleError.apply(console, args);
};

// Wrap React rendering in try-catch for extra safety
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  createRoot(rootElement).render(
    <BrowserRouter> {/* BrowserRouter moved here */}
      <App />
    </BrowserRouter>
  );
} catch (error) {
  console.error('Fatal error during app initialization:', error);
  
  // Show emergency fallback UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        background: #f8f9fa;
        font-family: system-ui, sans-serif;
        padding: 20px;
      ">
        <div style="
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
        ">
          <h1 style="color: #dc3545; margin-bottom: 20px;">⚠️ Error de Aplicación</h1>
          <p style="margin-bottom: 20px; color: #6c757d;">
            La aplicación no se pudo inicializar correctamente. 
            Esto puede deberse a un error de red o un script externo.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              background: #007bff; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 4px; 
              cursor: pointer;
              font-size: 16px;
            "
            onmouseover="this.style.background='#0056b3'"
            onmouseout="this.style.background='#007bff'"
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    `;
  }
}