// @mui material components
import Typography, { TypographyProps } from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { CSSObject } from "@mui/system";

type Color =
  | "inherit"
  | "white"
  | "dark"
  | "light"
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "text";

type FontWeight = "light" | "regular" | "medium" | "bold";

interface OwnerState {
  color?: Color;
  fontWeight?: FontWeight;
  textTransform?: React.CSSProperties["textTransform"];
  verticalAlign?: React.CSSProperties["verticalAlign"];
  opacity?: number;
  textGradient?: boolean;
  darkMode?: boolean;
}

interface StyledTypographyProps extends TypographyProps {
  ownerState: OwnerState;
}

export default styled(Typography, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})<StyledTypographyProps>(({ theme, ownerState }): CSSObject => {
  const { palette, typography, functions } = theme;
  const {
    color,
    textTransform,
    verticalAlign,
    fontWeight,
    opacity,
    textGradient,
    darkMode,
  } = ownerState;

  const { gradients, transparent, white } = palette;
  const { fontWeightLight, fontWeightRegular, fontWeightMedium, fontWeightBold } = typography;
  const { linearGradient } = functions;

  const fontWeights: Record<FontWeight, number> = {
    light: fontWeightLight,
    regular: fontWeightRegular,
    medium: fontWeightMedium,
    bold: fontWeightBold,
  };

  const isGradientKey = (key: unknown): key is keyof typeof gradients =>
    typeof key === "string" && Object.prototype.hasOwnProperty.call(gradients, key);
  const isPaletteColorKey = (key: unknown): key is keyof typeof palette =>
    typeof key === "string" && Object.prototype.hasOwnProperty.call(palette, key);

  const gradientStyles = (): CSSObject => {
    const gradientColor =
      color &&
        color !== "inherit" &&
        color !== "text" &&
        color !== "white" &&
        isGradientKey(color)
        ? gradients[color]
        : gradients.dark;

    return {
      backgroundImage: linearGradient(gradientColor.main, gradientColor.state),
      display: "inline-block",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: transparent.main,
      position: "relative",
      zIndex: 1,
    };
  };

  let colorValue: string = "inherit";

  if (color && color !== "inherit" && isPaletteColorKey(color)) {
    const paletteEntry = palette[color];
    if (paletteEntry && typeof paletteEntry === "object" && "main" in paletteEntry) {
      colorValue = (paletteEntry as { main: string }).main;
    }

  }

  if (darkMode && (color === "inherit" || !isPaletteColorKey(color))) {
    colorValue = "inherit";
  } else if (darkMode && color === "dark") {
    colorValue = white.main;
  }

  return {
    opacity,
    textTransform,
    verticalAlign,
    textDecoration: "none",
    color: colorValue,
    fontWeight: fontWeight ? fontWeights[fontWeight] : undefined,
    ...(textGradient ? gradientStyles() : {}),
  };
});
