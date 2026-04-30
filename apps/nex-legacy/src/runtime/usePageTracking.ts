import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import SendLogs from "logs";

export default function usePageTracking({
    userContext,
}: {
    userContext: any;
}) {
    const location = useLocation();
    const lastTrackedPathRef = useRef<string | null>(null);

    useEffect(() => {
        if (!userContext?.token) return;

        const currentPath = location.pathname;

        if (lastTrackedPathRef.current === currentPath) {
            return;
        }

        lastTrackedPathRef.current = currentPath;

        SendLogs(userContext.token, "Enter in Page", currentPath);

        document.documentElement.scrollTop = 0;
        if (document.scrollingElement) {
            document.scrollingElement.scrollTop = 0;
        }
    }, [userContext?.token, location.pathname]);
}