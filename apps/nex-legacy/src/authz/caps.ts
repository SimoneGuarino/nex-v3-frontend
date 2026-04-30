export const CAPS = {
  QUOTAZIONI_LOOK_MODERATE: "quotazioni.look.moderate",
} as const;

export type Cap = typeof CAPS[keyof typeof CAPS];