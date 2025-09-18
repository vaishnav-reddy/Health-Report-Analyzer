import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/tailwind.css';
import './styles/global.css';

import { LoadingProvider } from './context/LoadingContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </React.StrictMode>,
);
