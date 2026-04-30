import React from "react";
import { Paper, Box, Chip, useMediaQuery, Stack } from "@mui/material";
import TrendingUp from "@mui/icons-material/TrendingUp";
import { useTheme } from "@mui/material/styles";
import MDTypography from "components/MDTypography";

interface TrendChartProps {
    defaultStyles: {
        bg : { [key: number]: string },
        [key: number]: string;
    };
}
const TrendChart: React.FC<TrendChartProps> = ({ defaultStyles }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Stack
            sx={{
                flex: isMobile ? 1 : 3,
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <Paper elevation={0} sx={{ p: 2, mb: 1, backgroundColor: defaultStyles.bg[100], borderRadius: 3 }}>
                <Box component="div" display="flex" justifyContent="space-between">
                    <MDTypography variant="subtitle2" fontWeight="bold">
                        TREND
                    </MDTypography>
                </Box>
                <Box component="div" display="flex" alignItems="center" gap={2}>
                    <MDTypography variant="h6">€83,125</MDTypography>
                    <Chip
                        label="+7.2%"
                        size="small"
                        color="success"
                        icon={<TrendingUp fontSize="small" />}
                    />
                </Box>
            </Paper>
            <Stack flex="1 1 auto" justifyContent="center" alignItems="center" bgcolor={defaultStyles.bg[100]} borderRadius={3}>
                <MDTypography variant="body2">
                    Trend Chart Placeholder
                </MDTypography>
            </Stack>
        </Stack>
    );
};

export default TrendChart;