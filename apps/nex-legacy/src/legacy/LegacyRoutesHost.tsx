import React, { Suspense, createElement, useMemo } from "react";
import { Routes, Route } from "react-router-dom";

export default function LegacyRoutesHost({
    routes,
    userDetails,
    navigationLoading = false,
    navigationError = null,
}: {
    routes: any[];
    userDetails: any;
    navigationLoading?: boolean;
    navigationError?: string | null;
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

    const routeElements = useMemo(() => {
        if (!userDetails || navigationLoading || navigationError) return null;
        return (
            <Suspense fallback={<div className="min-h-[60vh] px-6 py-8 text-sm text-neutral-600 dark:text-neutral-300">Caricamento modulo...</div>}>
                <Routes>{getRoutes(routes)}</Routes>
            </Suspense>
        );
    }, [routes, userDetails, navigationLoading, navigationError]);

    if (navigationLoading) {
        return (
            <div className="min-h-[60vh] px-6 py-8 text-sm text-neutral-600 dark:text-neutral-300">
                Caricamento navigazione...
            </div>
        );
    }

    if (navigationError) {
        return (
            <div className="min-h-[60vh] px-6 py-8">
                <div className="max-w-xl rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="font-semibold">Navigazione non disponibile</div>
                    <div className="mt-1 opacity-80">{navigationError}</div>
                </div>
            </div>
        );
    }

    return routeElements;
}
