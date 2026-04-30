import Box from "@mui/material/Box";
import { styled, Theme } from "@mui/material/styles";

import {
  validBorderRadius,
  ValidBorderRadius,
  OwnerState,
  validBoxShadows,
  ValidBoxShadow,
  validColoredShadows,
  ValidColoredShadow,
} from "./types";

import {
  isMUIPaletteKey,
  isCustomColorKey,
  isGradientKey,
  isGreyColorKey,
} from "./guards";

import {
  getPaletteColor,
  getGreyColors,
  getCustomColor,
} from "./paletteUtils";

export default styled(Box, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})<{ ownerState?: OwnerState }>(({ theme, ownerState = {} }: { theme: Theme; ownerState?: OwnerState }) => {
  const { variant, bgColor, color, opacity, borderRadius, shadow, coloredShadow } = ownerState;
  const { gradients, common, white } = theme.palette;
  const { linearGradient } = theme.functions;
  const { borderRadius: radius } = theme.borders;
  const { boxShadows } = theme;
  const colored = (boxShadows as any).colored as Record<ValidColoredShadow, string> | undefined;

  const greyColors = getGreyColors(theme);

  // background
  let backgroundValue = bgColor;

  if (variant === "gradient") {
    if (bgColor && isGradientKey(bgColor)) {
      backgroundValue = linearGradient(gradients[bgColor].main, gradients[bgColor].state);
    } else {
      backgroundValue = white.main;
    }
  } else if (bgColor) {
    if (isMUIPaletteKey(bgColor)) {
      backgroundValue = getPaletteColor(theme.palette, bgColor);
    } else if (isGreyColorKey(bgColor)) {
      backgroundValue = greyColors[bgColor];
    } else if (isCustomColorKey(bgColor)) {
      backgroundValue = getCustomColor(theme, bgColor);
    } else {
      backgroundValue = bgColor;
    }
  }

  // color
  let colorValue = color;

  if (color) {
    if (isMUIPaletteKey(color)) {
      colorValue = getPaletteColor(theme.palette, color);
    } else if (isGreyColorKey(color)) {
      colorValue = greyColors[color];
    } else if (isCustomColorKey(color)) {
      colorValue = getCustomColor(theme, color);
    }
  }

  // borderRadius
  const borderRadiusValue =
    borderRadius && validBorderRadius.includes(borderRadius as ValidBorderRadius)
      ? radius[borderRadius as ValidBorderRadius]
      : borderRadius;

  // boxShadow
let boxShadowValue = "none";

// Tipiamo correttamente le chiavi realmente disponibili in boxShadows
const availableShadows = Object.keys(boxShadows) as Array<keyof typeof boxShadows>;

if (shadow && availableShadows.includes(shadow as keyof typeof boxShadows)) {
  boxShadowValue = boxShadows[shadow as keyof typeof boxShadows];
} else if (
  coloredShadow &&
  validColoredShadows.includes(coloredShadow as ValidColoredShadow) &&
  colored
) {
  boxShadowValue = colored[coloredShadow as ValidColoredShadow] ?? "none";
}


  return {
    opacity,
    background: backgroundValue,
    color: colorValue,
    borderRadius: borderRadiusValue,
    boxShadow: boxShadowValue,
  };
});
