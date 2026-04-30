import React, { createElement, useMemo } from "react";
import { Routes, Route } from "react-router-dom";

export default function LegacyRoutesHost({ routes, permission, userDetails } : {
    routes: any[],
    permission: any,
    userDetails: any
}) {
    const getRoutes = (allRoutes: any[]): (JSX.Element | null)[] => {
        return allRoutes.flatMap((route) => {
            if (route.collapse) return getRoutes(route.collapse);

            if (route.route) {
                return (
                    <Route
                        path={route.route}
                        element={route.component && createElement(route.component)}
                        key={route.key}
                    />
                );
            }

            return [null];
        });
    };

    const allowedRoutes = useMemo(() => {
        if (!userDetails) return null;

        const resolved = permission.RouteToShow(
            userDetails.ruolo,
            routes,
            userDetails.username,
            userDetails.permissions
        )?.Data;

        if (!resolved) return null;

        return <Routes>{getRoutes(resolved)}</Routes>;
    }, [routes, permission, userDetails]);

    return allowedRoutes;
}