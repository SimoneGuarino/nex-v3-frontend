import { forwardRef, ReactNode } from "react";
import PropTypes from "prop-types";
import MDBoxRoot from "components/MDBox/MDBoxRoot";
import { BoxProps } from "@mui/material";

interface MDBoxProps extends BoxProps {
    variant?: "contained" | "gradient";
    bgColor?: string;
    color?: string;
    opacity?: number;
    borderRadius?: string;
    shadow?: string;
    coloredShadow?: string;
    children?: ReactNode;
    [key: string]: any;
}

const MDBox = forwardRef<HTMLDivElement, MDBoxProps>(
    ({ variant, bgColor, color, opacity, borderRadius, shadow, coloredShadow, children, ...rest }, ref) => (
        <MDBoxRoot
            ref={ref}
            ownerState={{ variant, bgColor, color, opacity, borderRadius, shadow, coloredShadow }}
            {...rest}
        >
            {children}
        </MDBoxRoot>
    )
);

MDBox.defaultProps = {
    variant: "contained",
    bgColor: "transparent",
    color: "dark",
    opacity: 1,
    borderRadius: "none",
    shadow: "none",
    coloredShadow: "none",
};

MDBox.propTypes = {
    variant: PropTypes.oneOf(["contained", "gradient"]),
    bgColor: PropTypes.string,
    color: PropTypes.string,
    opacity: PropTypes.number,
    borderRadius: PropTypes.string,
    shadow: PropTypes.string,
    coloredShadow: PropTypes.oneOf([
        "primary",
        "secondary",
        "info",
        "success",
        "warning",
        "error",
        "light",
        "dark",
        "none",
        "purple",
        "lightPurple",
    ]),
};

export default MDBox;
