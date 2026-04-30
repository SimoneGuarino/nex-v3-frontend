// @mui
import Drawer, { type DrawerProps } from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

type OwnerState = {
  openConfigurator: boolean;
};

const shouldForwardProp = (prop: PropertyKey) => prop !== "ownerState";

const ConfiguratorRoot = styled(Drawer, { shouldForwardProp })<DrawerProps & { ownerState: OwnerState }>(
  ({ theme, ownerState }: { theme: Theme & any; ownerState: OwnerState }) => {
    const { boxShadows, functions, transitions } = theme;
    const { openConfigurator } = ownerState;

    const configuratorWidth = 360;
    const { lg } = boxShadows;
    const { pxToRem } = functions;

    const drawerOpenStyles = () => ({
      width: configuratorWidth,
      left: "initial",
      right: 0,
      transition: transitions.create("right", {
        easing: transitions.easing.sharp,
        duration: transitions.duration.short,
      }),
    });

    const drawerCloseStyles = () => ({
      left: "initial",
      right: pxToRem(-350),
      transition: transitions.create("all", {
        easing: transitions.easing.sharp,
        duration: transitions.duration.short,
      }),
    });

    return {
      "& .MuiDrawer-paper": {
        height: "100vh",
        margin: "0",
        padding: `0 ${pxToRem(10)}`,
        borderRadius: 0,
        boxShadow: lg,
        overflowY: "auto",
        ...(openConfigurator ? drawerOpenStyles() : drawerCloseStyles()),
      },
    };
  }
);

export default ConfiguratorRoot;
