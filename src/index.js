import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // Import CSS - make sure App.css exists
import App from './App'; // Import the main App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
