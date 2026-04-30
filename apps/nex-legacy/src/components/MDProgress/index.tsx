import { forwardRef } from "react";

// components
import MDTypography from "components/MDTypography";

// Custom styles for MDProgress
import MDProgressRoot from "components/MDProgress/MDProgressRoot";

interface MDProgressProps {
  variant?: "contained" | "gradient";
  color?:
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark"
  | string;  // nel caso accetti colori personalizzati stringa
  value?: number;
  label?: boolean;
  [key: string]: any; // per permettere altre props (es. sx, className, etc)
}

const MDProgress = forwardRef<HTMLDivElement, MDProgressProps>(
  ({ variant = "contained", color = "info", value = 0, label = false, ...rest }, ref) => (
    <>
      {label && (
        <MDTypography variant="body2" fontWeight="medium" color="text">
          {value > 100 ? 100 : value}%
        </MDTypography>
      )}
      <MDProgressRoot
        {...rest}
        ref={ref}
        variant="determinate"
        value={value > 100 ? 100 : value}
        ownerState={{ color, value, variant }}
      />
    </>
  )
);

export default MDProgress;
