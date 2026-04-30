// @mui material components
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";

interface ReqFidoStatusOwnerState {
  openReqFidoStatus: boolean;
}

// uso shouldForwardProp per non far passare ownerState al DOM
const ReqFidoStatusRoot = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})<{ ownerState: ReqFidoStatusOwnerState }>(({ theme, ownerState }) => {
  // il tuo tema estende quello MUI (functions, boxShadows, ecc.)
  // senza augmentation, cast a any per restare fedele e compilabile
  const t = theme as any;
  const { boxShadows, functions, transitions } = t;
  const { openReqFidoStatus } = ownerState;

  const QuoteCartWidth = 500;
  const { lg } = boxShadows;
  const { pxToRem } = functions;

  const drawerOpenStyles = () => ({
    width: QuoteCartWidth,
    left: "initial",
    right: 0,
    transition: transitions.create("right", {
      easing: transitions.easing.sharp,
      duration: transitions.duration.short,
    }),
  });

  const drawerCloseStyles = () => ({
    left: "initial",
    right: pxToRem(-350),
    transition: transitions.create("all", {
      easing: transitions.easing.sharp,
      duration: transitions.duration.short,
    }),
  });

  return {
    "& .MuiDrawer-paper": {
      height: "100vh",
      margin: "0",
      padding: `0 ${pxToRem(10)}`,
      borderRadius: 0,
      boxShadow: lg,
      overflowY: "auto",
      ...(openReqFidoStatus ? drawerOpenStyles() : drawerCloseStyles()),
    },
  };
});

export default ReqFidoStatusRoot;
