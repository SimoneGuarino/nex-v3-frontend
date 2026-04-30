import { forwardRef, ReactNode } from "react";
import MDBadgeRoot from "components/MDBadge/MDBadgeRoot";

// Tipi accettati per le props
type Color =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark";

type Variant = "gradient" | "contained";
type Size = "xs" | "sm" | "md" | "lg";

interface MDBadgeProps extends React.HTMLAttributes<HTMLElement> {
  color?: Color;
  variant?: Variant;
  size?: Size;
  circular?: boolean;
  indicator?: boolean;
  border?: boolean;
  container?: boolean;
  children?: ReactNode;
}

// forwardRef tipizzato
const MDBadge = forwardRef<HTMLSpanElement, MDBadgeProps>(
  (
    {
      color = "info",
      variant = "gradient",
      size = "sm",
      circular = false,
      indicator = false,
      border = false,
      container = false,
      children = false,
      ...rest
    },
    ref
  ) => (
    <MDBadgeRoot
      {...rest}
      ownerState={{
        color,
        variant,
        size,
        circular,
        indicator,
        border,
        container,
        children,
      }}
      ref={ref}
      color="default"
    >
      {children}
    </MDBadgeRoot>
  )
);

export default MDBadge;
