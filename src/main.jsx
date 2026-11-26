import React from 'react';
import ReactDOM from 'react-dom/client';
import { clearAllBusinessData } from './utils/reconciliationHelpers';
import App from './App.jsx';
import './index.css';

// One-time clean-slate wipe requested by Owner so existing test data starts at zero
const CLEAN_SLATE_KEY = 'maraki_clean_slate_wipe_2026_11_26_v1';
try {
  if (localStorage.getItem(CLEAN_SLATE_KEY) !== 'true') {
    clearAllBusinessData({ includeSettings: false });
    localStorage.setItem(CLEAN_SLATE_KEY, 'true');
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
