import React, { useState } from "react";
import Fade from "@mui/material/Fade";
import MDBox from "components/MDBox";
import MDAlertRoot from "components/MDAlert/MDAlertRoot";
import MDAlertCloseIcon from "components/MDAlert/MDAlertCloseIcon";

export type MDAlertColor =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark";

export interface MDAlertProps extends Omit<React.ComponentProps<typeof MDAlertRoot>, "ownerState"> {
  color?: MDAlertColor;
  dismissible?: boolean;
  children: React.ReactNode;
}

type Status = "mount" | "fadeOut" | "unmount";

function MDAlert({ color = "info", dismissible = false, children, ...rest }: MDAlertProps) {
  const [alertStatus, setAlertStatus] = useState<Status>("mount");
  const handleAlertStatus = () => setAlertStatus("fadeOut");

  const alertTemplate = (mount = true) => (
    <Fade in={mount} timeout={300}>
      <MDAlertRoot ownerState={{ color }} {...rest}>
        <MDBox display="flex" alignItems="center" color="white">
          {children}
        </MDBox>
        {dismissible ? (
          <MDAlertCloseIcon onClick={mount ? handleAlertStatus : undefined}>&times;</MDAlertCloseIcon>
        ) : null}
      </MDAlertRoot>
    </Fade>
  );

  switch (true) {
    case alertStatus === "mount":
      return alertTemplate();
    case alertStatus === "fadeOut":
      setTimeout(() => setAlertStatus("unmount"), 400);
      return alertTemplate(false);
    default:
      return null;
  }
}

export default MDAlert;
