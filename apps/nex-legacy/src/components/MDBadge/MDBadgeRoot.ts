import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

// Tipi condivisi con MDBadge
type Color =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark";

type Variant = "gradient" | "contained";
type Size = "xs" | "sm" | "md" | "lg";

interface OwnerState {
  color?: Color;
  variant?: Variant;
  size?: Size;
  circular?: boolean;
  indicator?: boolean;
  border?: boolean;
  container?: boolean;
  children?: React.ReactNode;
}

export default styled(Badge, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => {
  const { palette, typography, borders, functions } = theme;
  const { color, circular, border, size, indicator, variant, container, children } = ownerState;

  const { white, dark, gradients, badgeColors } = palette;
  const { size: fontSize, fontWeightBold } = typography;
  const { borderRadius, borderWidth } = borders;
  const { pxToRem, linearGradient } = functions;

  const paddings: Record<Size, string> = {
    xs: "0.45em 0.775em",
    sm: "0.55em 0.9em",
    md: "0.65em 1em",
    lg: "0.85em 1.375em",
  };

  const fontSizeValue = size === "xs" ? fontSize.xxs : fontSize.xs;

  const borderValue = border ? `${borderWidth[3]} solid ${white.main}` : "none";
  const borderRadiusValue = circular ? borderRadius.section : borderRadius.md;

  const indicatorStyles = (sizeProp: Size) => {
    let widthValue = pxToRem(20);
    let heightValue = pxToRem(20);

    if (sizeProp === "md") {
      widthValue = pxToRem(24);
      heightValue = pxToRem(24);
    } else if (sizeProp === "lg") {
      widthValue = pxToRem(32);
      heightValue = pxToRem(32);
    }

    return {
      width: widthValue,
      height: heightValue,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      borderRadius: "50%",
      padding: 0,
      border: borderValue,
    };
  };

  const gradientStyles = (colorProp?: Color) => {
    const backgroundValue = colorProp && gradients[colorProp]
      ? linearGradient(gradients[colorProp].main, gradients[colorProp].state)
      : linearGradient(gradients.info.main, gradients.info.state);
    const colorValue = colorProp === "light" ? dark.main : white.main;

    return {
      background: backgroundValue,
      color: colorValue,
    };
  };

  const containedStyles = (colorProp?: Color) => {
    const backgroundValue = colorProp && badgeColors[colorProp]
      ? badgeColors[colorProp].background
      : badgeColors.info.background;

    let colorValue = colorProp && badgeColors[colorProp]
      ? badgeColors[colorProp].text
      : badgeColors.info.text;

    if (colorProp === "light") {
      colorValue = dark.main;
    }

    return {
      background: backgroundValue,
      color: colorValue,
    };
  };

  const standAloneStyles = () => ({
    position: "static",
    marginLeft: pxToRem(8),
    transform: "none",
    fontSize: pxToRem(9),
  });

  const containerStyles = () => ({
    position: "relative",
    transform: "none",
  });

  return {
    "& .MuiBadge-badge": {
      height: "auto",
      padding: paddings[size || "xs"],
      fontSize: fontSizeValue,
      fontWeight: fontWeightBold,
      textTransform: "uppercase",
      lineHeight: 1,
      textAlign: "center",
      whiteSpace: "nowrap",
      verticalAlign: "baseline",
      border: borderValue,
      borderRadius: borderRadiusValue,
      ...(indicator && indicatorStyles(size || "xs")),
      ...(variant === "gradient" && gradientStyles(color)),
      ...(variant === "contained" && containedStyles(color)),
      ...(!children && !container && standAloneStyles()),
      ...(container && containerStyles()),
    },
  };
});
