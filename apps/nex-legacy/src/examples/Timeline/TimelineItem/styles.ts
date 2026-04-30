export interface TimelineItemOwnerState {
  lastItem?: boolean;
  isDark?: boolean;
}

// tema tipizzato come any per restare compatibili con le augmentation custom (borders, ecc.)
export default function timelineItem(
  theme: any,
  ownerState: TimelineItemOwnerState
): Record<string, any> {
  const { borders } = theme;
  const { lastItem, isDark } = ownerState;

  const { borderWidth, borderColor } = borders;

  return {
    "&:after": {
      content: !lastItem && "''",
      position: "absolute",
      top: "2rem",
      left: "17px",
      height: "100%",
      opacity: isDark ? 0.1 : 1,
      borderRight: `${borderWidth[2]} solid ${borderColor}`,
    },
  };
}
