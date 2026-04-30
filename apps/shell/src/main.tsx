import React from "react";
import ReactDOM from "react-dom/client";
import App from "./shell/App";
import "./index.css";

import { configureRealtimeCore } from "@nex/realtime-core";

configureRealtimeCore({
    serverHost: import.meta.env.VITE_SERVER_HOST,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<React.StrictMode><App /></React.StrictMode>);
