import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import KitchenApp from './KitchenApp.tsx';
import './index.css';

// Route detection: /kitchen path renders the chef portal, everything else is admin
const isKitchen = window.location.pathname.startsWith('/kitchen');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isKitchen ? <KitchenApp /> : <App />}
  </StrictMode>,
);
