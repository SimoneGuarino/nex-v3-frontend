import React, { createElement, useMemo } from "react";
import { Routes, Route } from "react-router-dom";

export default function LegacyRoutesHost({ routes, permission, userDetails, runtimeManaged = false } : {
    routes: any[],
    permission: any,
    userDetails: any,
    runtimeManaged?: boolean
}) {
    const getRoutes = (allRoutes: any[]): (JSX.Element | null)[] => {
        return allRoutes.flatMap((route) => {
            const output: (JSX.Element | null)[] = [];
            const nested = Array.isArray(route.nested) ? route.nested : route.nested?.elements;
            const collapse = Array.isArray(route.collapse) ? route.collapse : null;

            if (route.route && route.component) {
                output.push(
                    <Route
                        path={route.route}
                        element={createElement(route.component)}
                        key={route.key}
                    />
                );
            }

            if (collapse) output.push(...getRoutes(collapse));
            if (Array.isArray(nested)) output.push(...getRoutes(nested));

            return output.length > 0 ? output : [null];
        });
    };

    const allowedRoutes = useMemo(() => {
        if (!userDetails) return null;

        const resolved = runtimeManaged
            ? routes
            : permission.RouteToShow(
                userDetails.ruolo,
                routes,
                userDetails.username,
                userDetails.permissions
            )?.Data;

        if (!resolved) return null;

        return <Routes>{getRoutes(resolved)}</Routes>;
    }, [routes, permission, userDetails, runtimeManaged]);

    return allowedRoutes;
}