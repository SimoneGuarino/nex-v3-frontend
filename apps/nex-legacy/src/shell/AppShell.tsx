import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Tooltip } from "react-tooltip";
import Sidenav from "examples/Sidenav/Sidebar";
import ReqFidoStatus from "examples/ReqFidoStatus";
import Maintenance from "../maintenance";
import DashboardNavbar from "examples/Navbars";
import AILayout from "layouts/AI";
import { ResetWelcomePassword } from "layouts/authentication/reset-password";
import { SearchDataProvider } from "../context/SearchDataContext";
import theme from "assets/theme";
import themeDark from "assets/theme-dark";
import brandWhite from "assets/images/logo-fc.png";
export default function AppShell({
    maintenanceMode,
    canAccess,
    userContext,
    layout,
    sidenavColor,
    darkMode,
    routes,
    navigationRuntimeManaged = false,
    children,
}: any) {
    const activeTheme = darkMode ? themeDark : theme;

    if (maintenanceMode && !canAccess)
        return (
            <ThemeProvider theme={activeTheme}>
                <CssBaseline />
                <Maintenance />
            </ThemeProvider>
        );
    if (!userContext || Object.keys(userContext).length === 0) return null;
    const mustResetPassword =
        userContext?.details &&
        (!("ultimoAccesso" in userContext.details.stato) ||
            !userContext.details.stato?.ultimoAccesso);
    if (mustResetPassword)
        return (
            <ThemeProvider theme={activeTheme}>
                <CssBaseline />
                {userContext.details && <ResetWelcomePassword />}
            </ThemeProvider>
        );
    return (
        <SearchDataProvider>
            <ThemeProvider theme={activeTheme}>
                <CssBaseline />
                {layout === "dashboard" && (
                    <>
                        <Sidenav
                            color={sidenavColor}
                            brand={brandWhite}
                            brandName="Focelda Dashboard"
                            routes={routes}
                            runtimeManaged={navigationRuntimeManaged}
                        />
                        {window.location.href
                            .split("/")
                        [window.location.href.split("/").length - 1]?.toLowerCase() ===
                            "fido_cliente" && <ReqFidoStatus />}
                    </>
                )}
                <DashboardNavbar />
                <AILayout />
                {children}
                <Tooltip
                    id="general-webapp-tooltip"
                    place="bottom"
                    style={{
                        maxWidth: "15vw",
                        minWidth: 150,
                        fontSize: "0.87rem",
                        textAlign: "center",
                    }}
                />
            </ThemeProvider>
        </SearchDataProvider>
    );
}
