import React, { type ReactNode } from "react";

// @mui
import Icon from "@mui/material/Icon";

// components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Timeline context
import { useTimeline } from "examples/Timeline/context";

// styles
import timelineItem from "examples/Timeline/TimelineItem/styles";
import { Theme } from "@emotion/react";

type TimelineColor =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark"
  | "light";

interface TimelineItemProps {
  color?: TimelineColor;     // default: "info"
  icon: ReactNode;
  title: string;
  dateTime: string;
  description?: string;      // default: ""
  lastItem?: boolean;        // default: false
}

function TimelineItem({
  color = "info",
  icon,
  title,
  dateTime,
  description = "",
  lastItem = false,
}: TimelineItemProps): JSX.Element {
  // il contesto potrebbe essere undefined: coerzione a boolean per comportamento identico al JS
  const isDark = !!useTimeline();

  return (
    <MDBox
      position="relative"
      mb={3}
      sx={(theme: Theme) => timelineItem(theme as any, { lastItem, isDark })}
    >
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgColor={color}
        color="white"
        width="2rem"
        height="2rem"
        borderRadius="50%"
        position="absolute"
        top="8%"
        left="2px"
        zIndex={2}
        sx={{ fontSize: ({ typography: { size } }: any) => size.sm }}
      >
        <Icon fontSize="inherit">{icon}</Icon>
      </MDBox>

      <MDBox ml={5.75} pt={description ? 0.7 : 0.5} lineHeight={0} maxWidth="30rem">
        <MDTypography variant="button" fontWeight="medium" color={isDark ? "white" : "dark"}>
          {title}
        </MDTypography>

        <MDBox mt={0.5}>
          <MDTypography variant="caption" color={isDark ? "secondary" : "text"}>
            {dateTime}
          </MDTypography>
        </MDBox>

        <MDBox mt={2} mb={1.5}>
          {description ? (
            <MDTypography variant="button" color={isDark ? "white" : "dark"}>
              {description}
            </MDTypography>
          ) : null}
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default TimelineItem;
