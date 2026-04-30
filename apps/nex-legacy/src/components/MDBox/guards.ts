import {
  MUIPaletteKey,
  CustomColorKey,
  GradientKey,
  GreyColorKey,
} from "./types";

export function isMUIPaletteKey(key: string): key is MUIPaletteKey {
  return [
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
    "text",
  ].includes(key);
}

export function isCustomColorKey(key: string): key is CustomColorKey {
  return ["transparent", "white", "black", "purple", "lightPurple"].includes(key);
}

export function isGradientKey(key: string): key is GradientKey {
  return [
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
    "light",
    "purple",
    "lightPurple",
  ].includes(key);
}

export function isGreyColorKey(key: string): key is GreyColorKey {
  return [
    "grey-100",
    "grey-200",
    "grey-300",
    "grey-400",
    "grey-500",
    "grey-600",
    "grey-700",
    "grey-800",
    "grey-900",
  ].includes(key);
}
