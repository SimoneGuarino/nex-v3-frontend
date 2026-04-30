import LegacyRoutesHost from "../legacy/LegacyRoutesHost";

export default function ShellRouteHost({
    routes,
    permission,
    userDetails,
}: {
    routes: any[];
    permission: any;
    userDetails: any;
}) {
    if (!userDetails) return null;

    return (
        <LegacyRoutesHost
            routes={routes}
            permission={permission}
            userDetails={userDetails}
        />
    );
}