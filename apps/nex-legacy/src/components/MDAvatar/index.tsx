import { forwardRef, Ref } from "react";
import MDAvatarRoot from "components/MDAvatar/MDAvatarRoot";

export type MDAvatarProps = {
    sx?: object;
    bgColor?: "transparent" | "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark";
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
    shadow?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "inset";
} & React.ComponentPropsWithoutRef<"div">;

const MDAvatar = forwardRef<HTMLDivElement, MDAvatarProps>(
    ({ bgColor = "transparent", size = "md", shadow = "none", ...rest }, ref: Ref<HTMLDivElement>) => (
        <MDAvatarRoot ref={ref} ownerState={{ shadow, bgColor, size }} {...rest} />
    )
);

export default MDAvatar;
