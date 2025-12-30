
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// We inline the Tailwind directives so we don't need a separate index.css file
// This is handled by Vite/PostCSS automatically
const style = document.createElement('style');
style.textContent = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
`;
document.head.appendChild(style);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
