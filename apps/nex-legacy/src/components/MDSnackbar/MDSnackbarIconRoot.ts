// @mui material components
import Icon from "@mui/material/Icon";
import { styled } from "@mui/material/styles";
import { Theme } from "@mui/material/styles";

// Tipo per i colori accettati dai gradients
type GradientColor = "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark";

// OwnerState personalizzato
interface OwnerState {
  color: GradientColor | "light";
  bgWhite: boolean;
}

// Component tipizzato
export default styled(Icon, {
  // Assicurati che ownerState venga escluso dai props HTML
  shouldForwardProp: (prop) => prop !== "ownerState",
})<{ ownerState: OwnerState }>(({ theme, ownerState }) => {
  const { palette, functions, typography } = theme;
  const { color, bgWhite } = ownerState;

  const { white, transparent, gradients } = palette;
  const { pxToRem, linearGradient } = functions;
  const { size } = typography;

  let backgroundImageValue: string | undefined;

  if (bgWhite) {
    backgroundImageValue = gradients[color as GradientColor]
      ? linearGradient(gradients[color as GradientColor].main, gradients[color as GradientColor].state)
      : linearGradient(gradients.info.main, gradients.info.state);
  } else if (color === "light") {
    backgroundImageValue = linearGradient(gradients.dark.main, gradients.dark.state);
  }

  return {
    backgroundImage: backgroundImageValue,
    WebkitTextFillColor: bgWhite || color === "light" ? transparent.main : white.main,
    WebkitBackgroundClip: "text",
    marginRight: pxToRem(8),
    fontSize: size.lg,
    transform: `translateY(${pxToRem(-2)})`,
  };
});
