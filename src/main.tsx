import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import KitchenApp from './KitchenApp.tsx';
import ShiftApp from './ShiftApp.tsx';
import TabletApp from './TabletApp.tsx';
import './index.css';

// Route detection:
// /shift or /worker or ?shift -> Mobile Worker Shift Income Portal
// /kitchen or ?kitchen -> Chef Kitchen Order Portal
// /tablet or ?tablet -> In-Store Tablet Order Entry
// Default -> Admin Dashboard Portal
const pathname = window.location.pathname;
const search = window.location.search;

const isKitchen = pathname.startsWith('/kitchen') || search.includes('kitchen');
const isShift = pathname.startsWith('/shift') || pathname.startsWith('/worker') || search.includes('shift');
const isTablet = pathname.startsWith('/tablet') || search.includes('tablet');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isShift ? <ShiftApp /> : isKitchen ? <KitchenApp /> : isTablet ? <TabletApp /> : <App />}
  </StrictMode>,
);


