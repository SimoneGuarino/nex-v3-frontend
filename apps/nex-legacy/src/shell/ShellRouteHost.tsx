import LegacyRoutesHost from "../legacy/LegacyRoutesHost";

export default function ShellRouteHost({
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
    if (!userDetails) return null;

    return (
        <LegacyRoutesHost
            routes={routes}
            userDetails={userDetails}
            navigationLoading={navigationLoading}
            navigationError={navigationError}
        />
    );
}