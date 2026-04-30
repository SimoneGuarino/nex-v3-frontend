import { useEffect } from "react";

export default function useRootThemeClass(darkMode: boolean) {
    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) root.classList.add("dark");
        else root.classList.remove("dark");
    }, [darkMode]);
}