// @mui material components
import { styled, Theme } from "@mui/material/styles";
import LinearProgress from "@mui/material/LinearProgress";

interface OwnerState {
  color: string; // colore: può essere esadecimale o key della palette
  value: number; // valore della progress bar
  variant: "gradient" | string; // tipo variante
}

// Tipizziamo solo ownerState come prop esterna, theme viene iniettato automaticamente
const MDProgressRoot = styled(LinearProgress)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => {
    const { palette, functions } = theme;
    const { color, value, variant } = ownerState;

    const { text, gradients } = palette;
    const { linearGradient } = functions;

    let backgroundValue: string;

    if (variant === "gradient") {
      backgroundValue = gradients[color as keyof typeof gradients]
        ? linearGradient(
          gradients[color as keyof typeof gradients].main,
          gradients[color as keyof typeof gradients].state
        )
        : linearGradient(gradients.info.main, gradients.info.state);
    } else {
      backgroundValue = palette[color as keyof typeof palette]
        ? (palette[color as keyof typeof palette] as { main: string }).main
        : palette.info.main;
    }

    return {
      "& .MuiLinearProgress-bar": {
        background: color.includes("#") ? color : backgroundValue,
        width: `${value > 100 ? 100 : value}%`,
        color: text.primary,
      },
    };
  }
);

export default MDProgressRoot;
