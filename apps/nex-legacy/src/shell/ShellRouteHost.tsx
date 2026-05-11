import LegacyRoutesHost from "../legacy/LegacyRoutesHost";

export default function ShellRouteHost({
    routes,
    permission,
    userDetails,
    runtimeManaged = false,
}: {
    routes: any[];
    permission: any;
    userDetails: any;
    runtimeManaged?: boolean;
}) {
    if (!userDetails) return null;

    return (
        <LegacyRoutesHost
            routes={routes}
            permission={permission}
            userDetails={userDetails}
            runtimeManaged={runtimeManaged}
        />
    );
}