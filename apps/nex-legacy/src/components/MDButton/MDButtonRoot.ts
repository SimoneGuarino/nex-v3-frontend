/* eslint-disable prefer-destructuring */
import Button, { type ButtonProps } from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { MDColor, MDVariant, MDSize } from "./index";

// Stato che usi nello style callback
export type MDButtonOwnerState = {
  color: MDColor;
  variant: MDVariant;
  size: MDSize;
  circular?: boolean;
  iconOnly?: boolean;
  darkMode?: boolean;
};

// Filtriamo le prop custom per non forwardarle al DOM/MUI
const shouldForwardProp = (prop: PropertyKey) =>
  ![
    "ownerState",
    "color",
    "variant",
    "size",
    "circular",
    "iconOnly",
    "darkMode",
  ].includes(prop as string);

export default styled(Button, { shouldForwardProp })<
  ButtonProps & { ownerState: MDButtonOwnerState }
>(({ theme, ownerState }) => {
  // ATTENZIONE: se il tuo tema ha chiavi custom (functions, boxShadows, ecc.)
  // vedi l’augment del tema più sotto.
  const { palette, functions, borders, boxShadows } = theme as Theme & any;
  const { color, variant, size, circular, iconOnly, darkMode } = ownerState;

  const { white, text, transparent, gradients, grey } = palette;
  const { boxShadow, linearGradient, pxToRem, rgba } = functions;
  const { borderRadius } = borders;
  const { colored } = boxShadows;

  const containedStyles = () => {
    const backgroundValue = palette[color] ? palette[color].main : white.main;
    const focusedBackgroundValue = palette[color] ? palette[color].focus : white.focus;

    const boxShadowValue = colored[color]
      ? `${boxShadow([0, 3], [3, 0], palette[color].main, 0.15)}, ${boxShadow(
        [0, 3],
        [1, -2],
        palette[color].main,
        0.2
      )}, ${boxShadow([0, 1], [5, 0], palette[color].main, 0.15)}`
      : "none";

    const hoveredBoxShadowValue = colored[color]
      ? `${boxShadow([0, 14], [26, -12], palette[color].main, 0.4)}, ${boxShadow(
        [0, 4],
        [23, 0],
        palette[color].main,
        0.15
      )}, ${boxShadow([0, 8], [10, -5], palette[color].main, 0.2)}`
      : "none";

    let colorValue = white.main;
    if (!darkMode && (color === "white" || color === "light" || !palette[color])) {
      colorValue = text.main;
    } else if (darkMode && (color === "white" || color === "light" || !palette[color])) {
      colorValue = grey[600];
    }

    let focusedColorValue = white.main;
    if (color === "white") {
      focusedColorValue = text.main;
    } else if (color === "primary" || color === "error" || color === "dark") {
      focusedColorValue = white.main;
    }

    return {
      background: backgroundValue,
      color: colorValue,
      boxShadow: boxShadowValue,
      "&:hover": {
        backgroundColor: backgroundValue,
        boxShadow: hoveredBoxShadowValue,
      },
      "&:focus:not(:hover)": {
        backgroundColor: focusedBackgroundValue,
        boxShadow: palette[color]
          ? boxShadow([0, 0], [0, 3.2], palette[color].main, 0.5)
          : boxShadow([0, 0], [0, 3.2], white.main, 0.5),
      },
      "&:disabled": {
        backgroundColor: backgroundValue,
        color: focusedColorValue,
      },
    };
  };

  const outliedStyles = () => {
    const backgroundValue = color === "white" ? functions.rgba(white.main, 0.1) : transparent.main;
    const colorValue = palette[color] ? palette[color].main : white.main;
    const boxShadowValue = palette[color]
      ? boxShadow([0, 0], [0, 3.2], palette[color].main, 0.5)
      : boxShadow([0, 0], [0, 3.2], white.main, 0.5);

    let borderColorValue = palette[color] ? palette[color].main : functions.rgba(white.main, 0.75);
    if (color === "white") borderColorValue = functions.rgba(white.main, 0.75);

    return {
      background: backgroundValue,
      color: colorValue,
      borderColor: borderColorValue,
      "&:hover": {
        background: transparent.main,
        borderColor: colorValue,
      },
      "&:focus:not(:hover)": {
        background: transparent.main,
        boxShadow: boxShadowValue,
      },
      "&:active:not(:hover)": {
        backgroundColor: colorValue,
        color: white.main,
        opacity: 0.85,
      },
      "&:disabled": {
        color: colorValue,
        borderColor: colorValue,
      },
    };
  };

  const gradientStyles = () => {
    const backgroundValue =
      color === "white" || !gradients[color]
        ? white.main
        : functions.linearGradient(gradients[color].main, gradients[color].state);

    const boxShadowValue = colored[color]
      ? `${boxShadow([0, 3], [3, 0], palette[color].main, 0.15)}, ${boxShadow(
        [0, 3],
        [1, -2],
        palette[color].main,
        0.2
      )}, ${boxShadow([0, 1], [5, 0], palette[color].main, 0.15)}`
      : "none";

    const hoveredBoxShadowValue = colored[color]
      ? `${boxShadow([0, 14], [26, -12], palette[color].main, 0.4)}, ${boxShadow(
        [0, 4],
        [23, 0],
        palette[color].main,
        0.15
      )}, ${boxShadow([0, 8], [10, -5], palette[color].main, 0.2)}`
      : "none";

    let colorValue = white.main;
    if (color === "white") colorValue = text.main;
    else if (color === "light") colorValue = gradients.dark.state;

    return {
      background: backgroundValue,
      color: colorValue,
      boxShadow: boxShadowValue,
      "&:hover": { boxShadow: hoveredBoxShadowValue },
      "&:focus:not(:hover)": { boxShadow: boxShadowValue },
      "&:disabled": { background: backgroundValue, color: colorValue },
    };
  };

  const textStyles = () => {
    const colorValue = palette[color] ? palette[color].main : white.main;
    const focusedColorValue = palette[color] ? palette[color].focus : white.focus;
    return {
      color: colorValue,
      "&:hover": { color: focusedColorValue },
      "&:focus:not(:hover)": { color: focusedColorValue },
    };
  };

  const circularStyles = () => ({ borderRadius: borders.borderRadius.section });

  const iconOnlyStyles = () => {
    let sizeValue = functions.pxToRem(38);
    if (size === "small") sizeValue = functions.pxToRem(25.4);
    else if (size === "large") sizeValue = functions.pxToRem(52);

    let paddingValue = `${functions.pxToRem(11)} ${functions.pxToRem(11)} ${functions.pxToRem(10)}`;
    if (size === "small") paddingValue = functions.pxToRem(4.5);
    else if (size === "large") paddingValue = functions.pxToRem(16);

    return {
      width: sizeValue,
      minWidth: sizeValue,
      height: sizeValue,
      minHeight: sizeValue,
      padding: paddingValue,
      "& .material-icons": { marginTop: 0 },
      "&:hover, &:focus, &:active": { transform: "none" },
    };
  };

  return {
    ...(variant === "contained" && containedStyles()),
    ...(variant === "outlined" && outliedStyles()),
    ...(variant === "gradient" && gradientStyles()),
    ...(variant === "text" && textStyles()),
    ...(ownerState.circular && circularStyles()),
    ...(ownerState.iconOnly && iconOnlyStyles()),
  };
});
