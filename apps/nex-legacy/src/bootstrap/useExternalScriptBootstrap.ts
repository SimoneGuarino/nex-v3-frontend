import { useEffect } from "react";

export default function useExternalScriptBootstrap() {
    useEffect(() => {
        const host = import.meta.env.VITE_SERVER_HOST;
        const script = document.querySelector('script[name="app-host"]');

        if (script && host) {
            script.setAttribute("src", `${host}/k8pqb8fnz4tpqay5o9s7/gg-configurator.es.js`);
        }
    }, []);
}