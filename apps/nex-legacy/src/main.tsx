import React from "react";
import ReactDOM from "react-dom/client";
import LegacyRoot from "./LegacyRoot";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <LegacyRoot />
    </React.StrictMode>
);