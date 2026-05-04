import type { Location as RouterLocation } from 'react-router-dom';

export type ShellChromeMode = "full" | "minimal" | "hidden";

export type MicrofrontendId = "legacy" | "survey" | "access";

type MicrofrontendDefinition = {
    name: string;
    route: string;
    chrome: ShellChromeMode;
    label: string;
    activeWhen: (location: Location) => boolean;
};

export const MICROFRONTENDS: Record<MicrofrontendId, MicrofrontendDefinition> = {
    access: {
        name: "@nex/access-builder",
        route: "/access-builder",
        chrome: "minimal",
        label: "Access Builder",
        activeWhen: (location: Location) => location.pathname.startsWith("/access-builder"),
    },
    survey: {
        name: "@nex/survey-builder",
        route: "/survey-builder",
        chrome: "full",
        label: "Survey Builder",
        activeWhen: (location: Location) => location.pathname.startsWith("/survey-builder"),
    },
    legacy: {
        name: "@nex/legacy",
        route: "/legacy",
        chrome: "hidden",
        label: "NEX Legacy",
        activeWhen: (location: Location) => location.pathname.startsWith("/legacy"),
    },
} as const;

export function resolveActiveMicrofrontend(location: Location): MicrofrontendDefinition | null {
    return [{
        name: "shell",
        route: "/",
        chrome: "full" as ShellChromeMode,
        label: "Shell",
        activeWhen: (location: Location) => 
            location.pathname.startsWith("/") && 
        !location.pathname.startsWith("/survey-builder") && 
        !location.pathname.startsWith("/access-builder") &&
        !location.pathname.startsWith("/legacy"),
    }, ...Object.values(MICROFRONTENDS)].find((definition) => definition.activeWhen(location)) ?? null;
}
