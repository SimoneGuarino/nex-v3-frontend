import React from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact from "single-spa-react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

function Root() {
  return (
    <BrowserRouter basename="/access-builder">
      <App />
    </BrowserRouter>
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
      <div style={{ padding: 24 }}>
        <h2>Access Builder crashed</h2>
        <pre>{String(err)}</pre>
      </div>
    );
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
