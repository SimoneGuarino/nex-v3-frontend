import React from "react";
import usePageTracking from "./usePageTracking";

export default function AppRuntimeEffects({
    userContext,
    children,
}: {
    userContext: any;
    children: React.ReactNode;
}) {
    usePageTracking({ userContext });
    return <>{children}</>;
}
