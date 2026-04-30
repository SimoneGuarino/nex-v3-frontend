/*
Questo file prende il contenuto attuale di index.js e lo rende riusabile.
*/

import { Suspense, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./App.css";

import { MaterialUIControllerProvider } from "context";
import { UserProvider } from "context/UserContext";
import { RememberMeProvider } from "context/RememberMe";
import { FiltersProvider } from "context/filtersContext";
import { GSettingsProvider } from "context/GSettingsContext";
import { GeneralDataProvider } from "context/GeneralDataContext";
import { SnackbarProvider } from "components/MessageBox";
import ReportCompleteSnackbar from "./components/MessageBox/ReportComplete";
import { AIProvider } from "context/AIContext";
import { NTIFProvider } from "context/NotificationContext";
import { TourProvider } from "tour/TourProvider";
import { notifyShellLoadingReady } from "@nex/shared-platform";
import { NexThemeProvider } from "@nex/theme-system";

function LegacyMountReadySignal() {
    useEffect(() => {
        notifyShellLoadingReady({ app: "legacy", source: "legacy-root-mounted" });
        if (typeof window !== "undefined" && window.parent) {
            window.parent.postMessage({ type: "nex:mfe-ready", app: "legacy" }, window.location.origin);
        }
    }, []);

    return null;
}

type Props = {
    basename?: string;
};

export default function LegacyRoot({
    basename = import.meta.env.VITE_REACT_APP_BASENAME || "/",
}: Props) {
    return (
        <NexThemeProvider>
            <RememberMeProvider>
                <UserProvider>
                    <NTIFProvider>
                        <GeneralDataProvider>
                            <GSettingsProvider>
                                <AIProvider>
                                    <FiltersProvider>
                                        <BrowserRouter basename={basename}>
                                            <MaterialUIControllerProvider>
                                                <SnackbarProvider
                                                    Components={{
                                                        default: ReportCompleteSnackbar,
                                                    }}
                                                >
                                                    <Suspense fallback={null}>
                                                        <TourProvider>
                                                            <LegacyMountReadySignal />
                                                            <App />
                                                        </TourProvider>
                                                    </Suspense>
                                                </SnackbarProvider>
                                            </MaterialUIControllerProvider>
                                        </BrowserRouter>
                                    </FiltersProvider>
                                </AIProvider>
                            </GSettingsProvider>
                        </GeneralDataProvider>
                    </NTIFProvider>
                </UserProvider>
            </RememberMeProvider>
        </NexThemeProvider>
    );
}
