import ReactDOM from "react-dom/client";
import React from 'react';
import App from "./App.jsx";
import { AfterlineProvider } from "./contexts/AfterlineContext.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";
import "./index.css";

// 创建根节点并渲染应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AfterlineProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </AfterlineProvider>
  </React.StrictMode>
);
