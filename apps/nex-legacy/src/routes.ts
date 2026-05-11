/**
 * @deprecated
 * Runtime navigation is now owned by MongoDB `navigation_resources`.
 *
 * This compatibility export exists only for older legacy modules that still
 * import `routes`. It deliberately does not contain menu structure, paths,
 * visibility flags, icons, or authorization metadata. Those are data-driven
 * through navigation_resources.context.
 */
import legacyRouteRegistry from "runtime/navigation/legacyRouteRegistry";

export const routes: any[] = legacyRouteRegistry.map((entry) => ({
    key: entry.key,
    name: entry.key,
    component: entry.component,
    type: "visible",
    meta: { source: "legacy_route_registry_compat" },
}));

export default routes;