// @mui material components
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";
import Fade from "@mui/material/Fade";

// Components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Custom styles for the MDSnackbar
import MDSnackbarIconRoot from "components/MDSnackbar/MDSnackbarIconRoot";

// Context
import { useNexTheme } from "@nex/theme-system";

// Tipi accettati per il colore del gradient (matcha quelli di MDSnackbarIconRoot)
type SnackbarColor =
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "dark"
    | "light";
type TypographyColor = SnackbarColor | "inherit" | "text" | undefined;

interface MDSnackbarProps {
    color?: SnackbarColor | string; // <- accetta anche string generiche o wrapper String
    icon: React.ReactNode;
    title: string;
    dateTime: string;
    content: React.ReactNode;
    close: () => void;
    bgWhite?: boolean;
    [key: string]: any;
}

function MDSnackbar({
    color = "info",
    icon,
    title,
    dateTime,
    content,
    close,
    bgWhite = false,
    ...rest
}: MDSnackbarProps) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    // Normalizza il colore in primitivo stringa, per sicurezza
    const safeRawColor = typeof color === "string" ? color : String(color);

    // colori ammessi
    const allowedColors: SnackbarColor[] = [
        "primary",
        "secondary",
        "info",
        "success",
        "warning",
        "error",
        "dark",
        "light",
    ];

    // se il colore non è tra quelli ammessi, fallback a "info"
    const safeColor: SnackbarColor = allowedColors.includes(
        safeRawColor as SnackbarColor
    )
        ? (safeRawColor as SnackbarColor)
        : "info";

    let titleColor: TypographyColor;
    let dateTimeColor: TypographyColor;
    let dividerColor: boolean | undefined;

    if (bgWhite) {
        titleColor = safeColor;
        dateTimeColor = "dark"; // lo gestiamo via sx
        dividerColor = false;
    } else if (safeColor === "light") {
        titleColor = darkMode ? "inherit" : "dark"; // dark lo gestiamo via sx
        dateTimeColor = darkMode ? "inherit" : "text";
        dividerColor = false;
    } else {
        titleColor = "inherit"; // mettiamo inherit, colore custom via sx
        dateTimeColor = "inherit";
        dividerColor = true;
    }

    // Funzione helper per colore custom fuori palette
    const getCustomColor = (col: string) => {
        if (col === "white") return "#fff";
        if (col === "dark") return "#212121"; // esempio colore scuro, personalizza come vuoi
        return col;
    };

    return (
        <Snackbar
            TransitionComponent={Fade}
            autoHideDuration={5000}
            sx={{ zIndex: 99998 }}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            {...rest}
            action={
                <IconButton size="small" aria-label="close" color="inherit" onClick={close}>
                    <Icon fontSize="small">close</Icon>
                </IconButton>
            }
        >
            <MDBox
                variant={bgWhite ? "contained" : "gradient"}
                bgColor={bgWhite ? "white" : safeColor}
                minWidth="21.875rem"
                maxWidth="100%"
                shadow="md"
                borderRadius="md"
                p={1}
                sx={{
                    backgroundColor: ({ palette }: import("@mui/material/styles").Theme) =>
                        darkMode
                            ? palette.background.card
                            : palette[safeColor]?.main || palette.white.main,
                }}
            >
                <MDBox
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    color="dark"
                    p={1.5}
                >
                    <MDBox display="flex" alignItems="center" lineHeight={0}>
                        <MDSnackbarIconRoot fontSize="small" ownerState={{ color: safeColor, bgWhite }}>
                            {icon}
                        </MDSnackbarIconRoot>
                        <MDTypography
                            variant="body1"
                            fontWeight="medium"
                            color={titleColor}
                            textGradient={bgWhite}
                            sx={{
                                color:
                                    titleColor === "inherit" || titleColor === undefined
                                        ? getCustomColor(safeRawColor)
                                        : undefined,
                            }}
                        >
                            {title}
                        </MDTypography>
                    </MDBox>
                    <MDBox display="flex" alignItems="center" lineHeight={0}>
                        <MDTypography
                            variant="caption"
                            color={dateTimeColor}
                            sx={{
                                color:
                                    dateTimeColor === "dark" || dateTimeColor === "inherit"
                                        ? getCustomColor(dateTimeColor || "")
                                        : undefined,
                            }}
                        >
                            {dateTime}
                        </MDTypography>
                        <Icon
                            sx={(
                                {
                                    palette: { dark, white },
                                    typography: { fontWeightBold },
                                }: import("@mui/material/styles").Theme
                            ) => ({
                                color:
                                    (bgWhite && !darkMode) || safeColor === "light" ? dark.main : white.main,
                                fontWeight: fontWeightBold,
                                cursor: "pointer",
                                marginLeft: 2,
                                transform: "translateY(-1px)",
                            })}
                            onClick={close}
                        >
                            close
                        </Icon>
                    </MDBox>
                </MDBox>
                <Divider sx={{ margin: 0 }} light={dividerColor} />
                <MDBox
                    p={1.5}
                    sx={(
                        {
                            typography: { size },
                            palette: { white, text },
                        }: import("@mui/material/styles").Theme
                    ) => ({
                        fontSize: size.sm,
                        color: darkMode
                            ? safeColor === "light"
                                ? "inherit"
                                : white.main
                            : bgWhite || safeColor === "light"
                                ? text.primary
                                : white.main,
                    })}
                >
                    {content}
                </MDBox>
            </MDBox>
        </Snackbar>
    );
}

export default MDSnackbar;
