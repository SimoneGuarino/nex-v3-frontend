import { forwardRef } from "react";
import type { ReactNode, MouseEventHandler } from "react";
import type { ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import MDButtonRoot from "components/MDButton/MDButtonRoot";
import { useNexTheme } from "@nex/theme-system";

// Unioni “di dominio” del tuo design system
export type MDColor =
  | "white"
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark";

export type MDVariant = "text" | "contained" | "outlined" | "gradient";
export type MDSize = "small" | "medium" | "large";

// Estendiamo ButtonProps ma togliamo le chiavi che gestiamo noi
export interface MDButtonProps
  extends Omit<ButtonProps, "color" | "variant" | "size" | "sx" | "onClick"> {
  color?: MDColor;
  variant?: MDVariant;
  size?: MDSize;
  circular?: boolean;
  iconOnly?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: ReactNode;
}

const MDButton = forwardRef<HTMLButtonElement, MDButtonProps>(
  (
    {
      className,
      color = "dark",
      variant = "contained",
      size = "medium",
      circular = false,
      iconOnly = false,
      sx,
      disabled,
      onClick,
      children,
      ...rest
    },
    ref
  ) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    // Mappiamo "gradient" -> "contained" per MUI
    const muiVariant: ButtonProps["variant"] =
      variant === "gradient" ? "contained" : variant;

    return (
      <MDButtonRoot
        {...rest}
        ref={ref}
        // NOTA: non passiamo "color" a MUI, lo usiamo solo in ownerState
        className={className}
        sx={sx}
        disabled={disabled}
        onClick={onClick}
        variant={muiVariant}
        size={size}
        ownerState={{ color, variant, size, circular, iconOnly, darkMode }}
      >
        {children}
      </MDButtonRoot>
    );
  }
);

MDButton.displayName = "MDButton";

export default MDButton;
