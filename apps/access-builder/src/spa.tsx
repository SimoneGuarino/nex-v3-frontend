import React from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact from "single-spa-react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { NexThemeProvider } from "@nex/theme-system";

function Root() {
    return (
        <NexThemeProvider>
            <BrowserRouter basename="/access-builder">
                <App />
            </BrowserRouter>
        </NexThemeProvider>
    );
}

const lifecycles = singleSpaReact({
    React,
    ReactDOMClient,
    rootComponent: Root,
    domElementGetter: () => {
        const el = document.getElementById("mfe-content-root");
        if (!el) {
            throw new Error("mfe-content-root non trovato nella shell");
        }
        return el;
    },
    errorBoundary(err) {
        return (
            <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
                <h2 className="text-xl font-black">Access Builder crashed</h2>
                <pre className="mt-3 whitespace-pre-wrap text-sm">{String(err)}</pre>
            </div>
        );
    },
});

export const { bootstrap, mount, unmount } = lifecycles;
