import React, { type ReactNode } from "react";

// @mui material components
import Card from "@mui/material/Card";

// components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Timeline context
import { TimelineProvider } from "examples/Timeline/context";
import { useNexTheme } from "@nex/theme-system";

interface TimelineListProps {
    title: string;
    dark?: boolean;          // default: false
    children: ReactNode;
}

function TimelineList({ title, dark = false, children }: TimelineListProps): JSX.Element {
    // tipizzazione minimale per non dipendere dalle augmentation del tema
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return (
        <TimelineProvider value={dark}>
            <Card>
                <MDBox
                    bgColor={dark ? "dark" : "white"}
                    variant="gradient"
                    borderRadius="xl"
                    sx={{
                        background: ({ palette: { background } }: any) => (darkMode ? background.card : undefined),
                    }}
                >
                    <MDBox pt={3} px={3}>
                        <MDTypography variant="h6" fontWeight="medium" color={dark ? "white" : "dark"}>
                            {title}
                        </MDTypography>
                    </MDBox>
                    <MDBox p={2}>{children}</MDBox>
                </MDBox>
            </Card>
        </TimelineProvider>
    );
}

export default TimelineList;
