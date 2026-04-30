import React, { useMemo } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { NexThemeProvider } from "@nex/theme-system";
import { notifyShellLoadingReady } from "@nex/shared-platform";
import "../root-config";
import ShellLayout from "./ShellLayout";
import ShellContentHost from "./ShellContentHost";
import ShellRealtimeBridge from "../realtime/ShellRealtimeBridge";
import LoginPage from "../auth/LoginPage";
import AuthGate from "../auth/AuthGate";
import ShellSplashHost from "../loading/ShellSplashHost";
import GlobalPanelHost from "../panels/GlobalPanelHost";

function ShellAppFrame() {
    const location = useLocation();
    const navigate = useNavigate();

    const bootKey = useMemo(() => `${location.pathname}${location.search}${location.hash}`, [location.pathname, location.search, location.hash]);

    React.useEffect(() => {
        const onReady = (event: MessageEvent) => {
            if (event.data?.type === "nex:mfe-ready") {
                notifyShellLoadingReady({ app: event.data?.app ?? "unknown", source: "postMessage" });
            }
        };

        window.addEventListener("message", onReady);
        return () => window.removeEventListener("message", onReady);
    }, []);

    React.useEffect(() => {
        if (location.pathname.startsWith("/login")) {
            notifyShellLoadingReady({ app: "shell", source: "login-route" });
        }
    }, [location.pathname]);

    return (
        <>
            <ShellRealtimeBridge />
            <ShellSplashHost bootKey={bootKey} />
            <GlobalPanelHost />
            <Routes>
                <Route path="/login" element={<LoginPage onLoginComplete={() => navigate("/legacy", { replace: true })} />} />
                <Route
                    path="*"
                    element={
                        <AuthGate>
                            <ShellLayout>
                                <div style={{ position: "absolute", inset: 0 }}>
                                    <ShellContentHost />
                                </div>
                            </ShellLayout>
                        </AuthGate>
                    }
                />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <NexThemeProvider>
            <BrowserRouter>
                <ShellAppFrame />
            </BrowserRouter>
        </NexThemeProvider>
    );
}
