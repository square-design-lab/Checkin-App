import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CheckinProvider } from './context/CheckinContext';
import App from './App';
import './checkin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CheckinProvider>
        <App />
      </CheckinProvider>
    </BrowserRouter>
  </React.StrictMode>
);
