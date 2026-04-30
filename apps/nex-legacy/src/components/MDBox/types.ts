export interface OwnerState {
  variant?: string;
  bgColor?: string;
  color?: string;
  opacity?: number;
  borderRadius?: string;
  shadow?: string;
  coloredShadow?: string;
}

// Keys che sono effettivamente in palette MUI
export type MUIPaletteKey =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark"
  | "text";

export type CustomColorKey = "transparent" | "white" | "black" | "purple" | "lightPurple";

export type PaletteColorKey = MUIPaletteKey | CustomColorKey;

export type GradientKey =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark"
  | "light"
  | "purple"
  | "lightPurple";

export type GreyColorKey =
  | "grey-100"
  | "grey-200"
  | "grey-300"
  | "grey-400"
  | "grey-500"
  | "grey-600"
  | "grey-700"
  | "grey-800"
  | "grey-900";

// --- BORDER RADIUS ---

export const validBorderRadius = ["xs", "sm", "md", "lg", "xl", "xxl", "section"] as const;
export type ValidBorderRadius = typeof validBorderRadius[number];

// --- BOX SHADOWS ---

export const validBoxShadows = ["xs", "sm", "md", "lg", "xl", "xxl", "inset"] as const;
export type ValidBoxShadow = typeof validBoxShadows[number];

// --- COLORED SHADOWS ---

export const validColoredShadows = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
  "light",
  "dark",
  "purple",
  "lightPurple",
] as const;
export type ValidColoredShadow = typeof validColoredShadows[number];
