import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Импортируем наше основное приложение

// Находим корневой элемент в HTML (он лежит в public/index.html)
const root = ReactDOM.createRoot(document.getElementById('root'));

// Рендерим (отображаем) наше приложение внутри этого элемента
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);