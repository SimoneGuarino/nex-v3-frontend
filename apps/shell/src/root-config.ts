import {
    addErrorHandler,
    getAppStatus,
    registerApplication,
    start,
    triggerAppChange,
} from "single-spa";
import { readSharedSessionSnapshot } from "@nex/shared-platform";
import { MICROFRONTENDS } from "./config/microfrontends";

const MFE_HOST_ID = "mfe-content-root";

let singleSpaConfigured = false;
let singleSpaStarted = false;
let errorHandlerRegistered = false;

function hasMfeHost() {
    return Boolean(document.getElementById(MFE_HOST_ID));
}

function hasShellSession() {
    return Boolean(readSharedSessionSnapshot()?.token);
}

function guardedActiveWhen(
    appName: string,
    routeActiveWhen: (location: Location) => boolean,
) {
    return (location: Location) => {
        const routeActive = routeActiveWhen(location);
        if (!routeActive) return false;

        if (!hasShellSession()) {
            return false;
        }

        if (!hasMfeHost()) {
            console.warn(
                `[SHELL] ${appName} route matched, but #${MFE_HOST_ID} is not mounted yet. Mount skipped.`,
            );
            return false;
        }

        return true;
    };
}

function registerMicrofrontendsOnce() {
    if (singleSpaConfigured) return;

    console.log("[SHELL] configuring single-spa root-config", window.location.pathname);

    if (!errorHandlerRegistered) {
        addErrorHandler((err) => {
            console.error("[SHELL][single-spa error]", err);
        });
        errorHandlerRegistered = true;
    }

    registerApplication({
        name: MICROFRONTENDS.legacy.name,
        app: () => {
            console.log("[SHELL] loading legacy app...");
            return import(MICROFRONTENDS.legacy.name).then((mod) => {
                console.log("[SHELL] legacy module loaded:", Object.keys(mod));
                return mod;
            });
        },
        activeWhen: guardedActiveWhen(
            MICROFRONTENDS.legacy.name,
            MICROFRONTENDS.legacy.activeWhen,
        ),
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
        activeWhen: guardedActiveWhen(
            MICROFRONTENDS.access.name,
            MICROFRONTENDS.access.activeWhen,
        ),
    });

    singleSpaConfigured = true;
}

export function ensureSingleSpaRuntimeStarted() {
    registerMicrofrontendsOnce();

    if (!hasMfeHost()) {
        console.warn(
            `[SHELL] single-spa start skipped: #${MFE_HOST_ID} not mounted yet`,
        );
        return false;
    }

    if (!hasShellSession()) {
        return false;
    }

    if (!singleSpaStarted) {
        console.log("[SHELL] starting single-spa runtime");
        start();
        singleSpaStarted = true;
        return true;
    }

    triggerAppChange();
    return true;
}

export function requestSingleSpaReroute() {
    if (!singleSpaStarted) return;
    triggerAppChange();
}

export function getRegisteredMfeStatus() {
    return {
        legacy: getAppStatus(MICROFRONTENDS.legacy.name),
        access: getAppStatus(MICROFRONTENDS.access.name),
    };
}
