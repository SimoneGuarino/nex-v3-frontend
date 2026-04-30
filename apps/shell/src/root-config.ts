import { registerApplication, start } from "single-spa";
import { MICROFRONTENDS } from "./config/microfrontends";

registerApplication({
    name: MICROFRONTENDS.legacy.name,
    app: () => import(MICROFRONTENDS.legacy.name),
    activeWhen: MICROFRONTENDS.legacy.activeWhen,
});

registerApplication({
    name: MICROFRONTENDS.survey.name,
    app: () => import(MICROFRONTENDS.survey.name),
    activeWhen: MICROFRONTENDS.survey.activeWhen,
});

start();