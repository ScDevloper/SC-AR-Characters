import React from "react";
import ReactDOM from "react-dom/client";
import ArPage from "../../app/ar/page";
import "../../app/globals.css";
import "./pages.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="github-pages-ar">
      <ArPage />
    </div>
  </React.StrictMode>,
);
