import React, { useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { Divider } from "@mui/material";

const ACCESS_BUILDER_ROUTE = "/access-builder";

function UserManagement() {
    useEffect(() => {
        const timer = window.setTimeout(() => {
            window.location.assign(ACCESS_BUILDER_ROUTE);
        }, 450);

        return () => window.clearTimeout(timer);
    }, []);

    return (
        <DashboardLayout>
            <MDBox pt={5} translate="no">
                <MDTypography variant="h2">Gestione Utenti</MDTypography>
                <Divider sx={{ backgroundColor: "#ccc" }} />
                <MDBox
                    mt={4}
                    p={4}
                    sx={{
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(15,23,42,0.10)",
                    }}
                >
                    <MDTypography variant="h4" mb={1}>Nuovo Access Builder</MDTypography>
                    <MDTypography variant="body2" color="text" mb={3}>
                        La gestione legacy di utenti, ruoli e permessi è stata sostituita dal nuovo builder centralizzato.
                        Verrai reindirizzato automaticamente alla nuova interfaccia.
                    </MDTypography>
                    <MDButton color="info" variant="gradient" onClick={() => window.location.assign(ACCESS_BUILDER_ROUTE)}>
                        Apri Access Builder
                    </MDButton>
                </MDBox>
            </MDBox>
        </DashboardLayout>
    );
}

export default UserManagement;
