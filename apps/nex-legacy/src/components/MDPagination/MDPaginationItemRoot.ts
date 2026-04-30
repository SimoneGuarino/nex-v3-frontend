import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import MDButton from "components/MDButton";
import type { MDSize } from "components/MDButton";

// Le info che usi nello style callback
export type MDPaginationOwnerState = {
  variant: "gradient" | "contained" | string;
  paginationSize: MDSize | null; // dal contesto; può essere null
  active?: boolean;
};

// Evitiamo che ownerState finisca nel DOM
const shouldForwardProp = (prop: PropertyKey) => prop !== "ownerState";

const MDPaginationRoot = styled(MDButton, { shouldForwardProp })<
  { ownerState: MDPaginationOwnerState }
>(({ theme, ownerState }) => {
  // se il tuo tema ha chiavi custom, tieni l'"any" per non impazzire coi type augmentation
  const { borders, functions, typography, palette } = theme as Theme & any;
  const { variant, paginationSize, active } = ownerState;

  const { borderColor } = borders;
  const { pxToRem } = functions;
  const { fontWeightRegular, size: fontSize } = typography;
  const { light } = palette;

  let sizeValue = pxToRem(36);
  if (paginationSize === "small") sizeValue = pxToRem(30);
  else if (paginationSize === "large") sizeValue = pxToRem(46);

  const removeShadow = variant !== "gradient" && variant !== "contained";

  return {
    borderColor,
    margin: `0 ${pxToRem(2)}`,
    pointerEvents: active ? "none" : "auto",
    fontWeight: fontWeightRegular,
    fontSize: fontSize.sm,
    width: sizeValue,
    minWidth: sizeValue,
    height: sizeValue,
    minHeight: sizeValue,


    "&:hover, &:focus, &:active": {
      transform: "none",
      // Probabile svista nel codice originale: OR => true sempre. Forse volevi &&
      boxShadow: removeShadow ? "none !important" : undefined,
      opacity: "1 !important",
    },

    "&:hover": {
      backgroundColor: light.main,
      borderColor,
    },
  };
});

export default MDPaginationRoot;
