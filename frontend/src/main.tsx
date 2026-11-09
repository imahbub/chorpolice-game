import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { GameProvider } from './context/GameContext';
import './index.css';

// Expand Telegram WebApp if inside Telegram
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  try {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.setHeaderColor?.('#0B0F19');
    window.Telegram.WebApp.setBackgroundColor?.('#0B0F19');
  } catch {
    // Ignore if not in Telegram
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
);
