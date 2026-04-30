import { Theme } from "@mui/material/styles";
import {
  MUIPaletteKey,
  GreyColorKey,
  CustomColorKey,
} from "./types";

export function getPaletteColor(palette: Theme["palette"], key: MUIPaletteKey): string {
  switch (key) {
    case "primary":
    case "secondary":
    case "info":
    case "success":
    case "warning":
    case "error":
      return palette[key].main;
    case "light":
      return palette.grey[100];
    case "dark":
      return palette.grey[900];
    case "text":
      return palette.text.primary;
    default:
      return "";
  }
}

export function getGreyColors(theme: Theme): Record<GreyColorKey, string> {
  const { grey } = theme.palette;
  return {
    "grey-100": grey[100],
    "grey-200": grey[200],
    "grey-300": grey[300],
    "grey-400": grey[400],
    "grey-500": grey[500],
    "grey-600": grey[600],
    "grey-700": grey[700],
    "grey-800": grey[800],
    "grey-900": grey[900],
  };
}

export function getCustomColor(theme: Theme, color: CustomColorKey): string {
  const { palette } = theme;
  switch (color) {
    case "white":
      return palette.white.main;
    case "black":
      return palette.common.black;
    case "transparent":
      return "transparent";
    case "purple":
      return (palette as any).purple?.main ?? "#9c27b0";
    case "lightPurple":
      return (palette as any).lightPurple?.main ?? "#ba68c8";
  }
}
