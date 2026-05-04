import { addErrorHandler, getAppStatus, registerApplication, start } from "single-spa";
import { MICROFRONTENDS } from "./config/microfrontends";

console.log("[SHELL] root-config loaded", window.location.pathname);

addErrorHandler((err) => {
    console.error("[SHELL][single-spa error]", err);
});

registerApplication({
    name: MICROFRONTENDS.legacy.name,
    app: () => {
        console.log("[SHELL] loading legacy app...");
        return import(MICROFRONTENDS.legacy.name).then((mod) => {
            console.log("[SHELL] legacy module loaded:", Object.keys(mod));
            return mod;
        });
    },
    activeWhen: (location) => {
        const active = MICROFRONTENDS.legacy.activeWhen(location);
        console.log("[SHELL] legacy activeWhen:", location.pathname, active);
        return active;
    },
});

registerApplication({
    name: MICROFRONTENDS.survey.name,
    app: () => {
        console.log("[SHELL] loading survey app...");
        return import(MICROFRONTENDS.survey.name).then((mod) => {
            console.log("[SHELL] survey module loaded:", Object.keys(mod));
            return mod;
        });
    },
    activeWhen: MICROFRONTENDS.survey.activeWhen,
});

registerApplication({
    name: MICROFRONTENDS.access.name,
    app: () => {
        console.log("[SHELL] loading access-builder app...");
        return import(MICROFRONTENDS.access.name).then((mod) => {
            console.log("[SHELL] access-builder module loaded:", Object.keys(mod));
            return mod;
        });
    },
    activeWhen: MICROFRONTENDS.access.activeWhen,
});

start();