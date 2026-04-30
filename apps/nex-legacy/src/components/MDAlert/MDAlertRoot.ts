import Box, { type BoxProps } from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { MDAlertColor } from "./index";

type MDAlertOwnerState = {
  color: MDAlertColor;
};

// evitiamo che ownerState finisca nel DOM
const shouldForwardProp = (prop: PropertyKey) => prop !== "ownerState";

const MDAlertRoot = styled(Box, { shouldForwardProp })<
  BoxProps & { ownerState: MDAlertOwnerState }
>(({ theme, ownerState }) => {
  const { palette, typography, borders, functions } = theme as Theme & any;
  const { color } = ownerState;

  const { white, gradients } = palette;
  const { fontSizeRegular, fontWeightMedium } = typography;
  const { borderRadius } = borders;
  const { pxToRem, linearGradient } = functions;

  const backgroundImageValue =
    gradients[color]
      ? linearGradient(gradients[color].main, gradients[color].state)
      : linearGradient(gradients.info.main, gradients.info.state);

  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: pxToRem(60),
    backgroundImage: backgroundImageValue,
    color: white.main,
    position: "relative",
    padding: pxToRem(16),
    marginBottom: pxToRem(16),
    borderRadius: borderRadius.md,
    fontSize: fontSizeRegular,
    fontWeight: fontWeightMedium,
  };
});

export default MDAlertRoot;
