import React, { useState, useContext } from "react";

// Global StateHook User Details
import { UserContext } from "../../context/UserContext";

// Sanitize
import { SanitizeEmail } from "../../utils/sanitize";

// General components
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";

// @mui
import PropTypes from "prop-types";
import { styled, type Theme } from "@mui/material/styles";
import Backdrop from "@mui/material/Backdrop";

import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";

import TextField from "@mui/material/TextField";

import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";

import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";

import FormControl from "@mui/material/FormControl";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import VpnKeyIcon from "@mui/icons-material/VpnKey";
import Check from "@mui/icons-material/Check";
import SettingsIcon from "@mui/icons-material/Settings";
import EmailIcon from "@mui/icons-material/Email";

import { VerifyCodeAPI } from "./fetchData/verifyCode";
import { Card, Stack } from "@mui/material";
import { icon_close } from "config/icons";
import { MainTheme } from "assets/settingsTheme";
import LoadingButton from "@mui/lab/LoadingButton";
import { SendEmailAPI } from "layouts/authentication/reset-password/fetchData/sendEmail";
import { enqueueSnackbar } from "components/MessageBox";
import { ResetPasswordAPI } from "layouts/authentication/reset-password/fetchData/resetPassword";
import { differenceInSeconds } from "date-fns";
import { FDInput } from "@nex/fd-ui";
import { useNexTheme } from "@nex/theme-system";


/* =================================
 * Tipi utili locali
 * ================================= */
type LoadStatusKeys = "sendEmail" | "checkVCode" | "changePassword";

type LoadStatus = Record<LoadStatusKeys, boolean>;

type ChangeLoadStatusArgs = {
    from: LoadStatusKeys;
    bool?: boolean;
};

type ChangeEmaPassProps = {
    setChangeEmaPass: React.Dispatch<React.SetStateAction<boolean>>;
};

type StepIconOwnerState = { active?: boolean; completed?: boolean };

type QontoStepIconProps = {
    active?: boolean;
    completed?: boolean;
    className?: string;
};

type ColorlibStepIconProps = {
    active?: boolean;
    completed?: boolean;
    className?: string;
    icon?: number | string;
};

type CountdownProps = {
    timeReSendMail: Date | string | number;
    onCountdownEnd: () => void;
};

/* =================================
 * Step icons
 * ================================= */
const QontoStepIconRoot = styled("div")<{
    ownerState: { active?: boolean };
}>(({ theme, ownerState }) => ({
    color: theme.palette.mode === "dark" ? theme.palette.grey[700] : "#eaeaf0",
    display: "flex",
    height: 22,
    alignItems: "center",
    ...(ownerState.active && {
        color: "#784af4",
    }),
    "& .QontoStepIcon-completedIcon": {
        color: "#784af4",
        zIndex: 1,
        fontSize: 18,
    },
    "& .QontoStepIcon-circle": {
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "currentColor",
    },
}));

function QontoStepIcon({ active, completed, className }: QontoStepIconProps) {
    return (
        <QontoStepIconRoot ownerState={{ active }} className={className}>
            {completed ? (
                <Check className="QontoStepIcon-completedIcon" />
            ) : (
                <div className="QontoStepIcon-circle" />
            )}
        </QontoStepIconRoot>
    );
}

QontoStepIcon.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    completed: PropTypes.bool,
};

const ColorlibStepIconRoot = styled("div")<{
    ownerState: StepIconOwnerState;
}>(({ theme, ownerState }) => ({
    backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[700] : "#ccc",
    zIndex: 1,
    color: "#fff",
    width: 50,
    height: 50,
    display: "flex",
    borderRadius: "50%",
    justifyContent: "center",
    alignItems: "center",
    ...(ownerState.active && {
        backgroundImage:
            "linear-gradient( 136deg, rgb(235 235 235) 0%, rgb(225 139 150) 50%, rgb(255 170 43) 100%)",
        boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
    }),
    ...(ownerState.completed && {
        backgroundImage:
            "linear-gradient( 136deg, rgb(235 235 235) 0%, rgb(225 139 150) 50%, rgb(255 170 43) 100%)",
    }),
}));

function ColorlibStepIcon({ active, completed, className, icon }: ColorlibStepIconProps) {
    const icons: Record<string, React.ReactNode> = {
        "1": <EmailIcon />,
        "2": <SettingsIcon />,
        "3": <VpnKeyIcon />,
    };

    return (
        <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
            {icons[String(icon ?? "")]}
        </ColorlibStepIconRoot>
    );
}

ColorlibStepIcon.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    completed: PropTypes.bool,
    icon: PropTypes.node,
};

/* =================================
 * Countdown
 * ================================= */
const CountdownComponent: React.FC<CountdownProps> = ({ timeReSendMail, onCountdownEnd }) => {
    const targetDate = new Date(timeReSendMail);
    const [secondsRemaining, setSecondsRemaining] = React.useState(
        differenceInSeconds(targetDate, new Date())
    );

    React.useEffect(() => {
        const interval = setInterval(() => {
            const remaining = differenceInSeconds(targetDate, new Date());
            setSecondsRemaining(Math.max(remaining, 0));
            if (remaining <= 0) {
                clearInterval(interval);
                onCountdownEnd();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onCountdownEnd]);

    return (
        <MDTypography variant="body2" sx={{ ml: "auto", mt: 5 }}>
            Puoi riprovare tra {secondsRemaining} secondi
        </MDTypography>
    );
};

/* =================================
 * Page
 * ================================= */
const steps: string[] = ["Invia il codice", "inserisci il codice", "Cambia la Password"];

export default function ChangeEmaPass(props: ChangeEmaPassProps) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = (MainTheme() as any).palette as any;

    const [userContext] = useContext(UserContext) as any;

    const [loadStatus, setLoadStatus] = React.useState<LoadStatus>({
        sendEmail: false,
        checkVCode: false,
        changePassword: false,
    });

    const ChangeLoadStatus = ({ from, bool }: ChangeLoadStatusArgs) => {
        setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }));
    };

    const [timeReSendMail, setTimeReSendMail] = React.useState<Date | string | number | null>(null);
    const handleCountdownEnd = () => setTimeReSendMail(null);

    const [email, setEmail] = useState<string>("");

    const [open] = useState<boolean>(true);
    const [activeStep, setActiveStep] = React.useState<number>(0);
    const [completed, setCompleted] = React.useState<Record<number, boolean>>({});

    const [showPassword, setShowPassword] = React.useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);

    const [handlePassField, setHandlePassField] = React.useState<string>("");
    const [handleConfPassField, setHandleConfPassField] = React.useState<string>("");
    const [rcode, setRCode] = useState<string>("");

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Abort il pending del fetch al server
    const abortController = React.useRef<AbortController | null>(null);

    function sendEmail() {
        const mail = userContext != null ? userContext.details.username : email;
        setTimeReSendMail(new Date(new Date().getTime() + 1 * 60 * 1000));

        if ((SanitizeEmail as (s: string) => string | false)(mail) !== false) {
            ChangeLoadStatus({ from: "sendEmail", bool: true });
            SendEmailAPI({
                userContext,
                mail,
                abortController,
                NextStep: handleComplete,
                ChangeLoadStatus,
                setTimeReSendMail,
            } as any);
        } else {
            enqueueSnackbar("Sembra che tu abbia inserito un e-mail non valido, riprova.", {
                title: "Ops..",
                type: "error",
            } as any);
        }
    }

    function CheckRCode() {
        if (rcode && rcode.trim() !== "" && rcode.length > 3) {
            ChangeLoadStatus({ from: "checkVCode", bool: true });
            const mail = userContext != null ? userContext.details.username : email;
            VerifyCodeAPI({ abortController, mail, rcode, handleComplete, ChangeLoadStatus } as any);
        } else {
            enqueueSnackbar("Sembra che tu abbia inserito un codice di reset non valido, riprova.", {
                title: "Ops..",
                type: "warning",
            } as any);
        }
    }

    function ChangePassword(pswd: string, cnfpswd: string) {
        if (pswd === cnfpswd) {
            ChangeLoadStatus({ from: "changePassword", bool: true });
            const mail = userContext != null ? userContext.details.username : email;
            ResetPasswordAPI({
                userContext,
                abortController,
                pswd,
                rcode,
                mail,
                handleComplete: Finish,
                ChangeLoadStatus,
            } as any);
        } else {
            enqueueSnackbar(
                "La password e la conferma della password non coincidono, perfavore inseriscile nuovamente.",
                {
                    title: "Ops..",
                    type: "warning",
                } as any
            );
        }
    }

    function Finish() {
        handleComplete();
        enqueueSnackbar("La tua password è stata cambiata con successo.", {
            title: "Operazione completata con successo!",
            type: "success",
        });
    }

    const handleClose = () => {
        props.setChangeEmaPass(false);
    };

    const totalSteps = () => steps.length;

    const completedSteps = () => Object.keys(completed).length;

    const isLastStep = () => activeStep === totalSteps() - 1;

    const allStepsCompleted = () => completedSteps() === totalSteps();

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? steps.findIndex((_, i) => !(i in completed))
                : activeStep + 1;
        setActiveStep(newActiveStep);
    };

    const handleComplete = () => {
        const newCompleted = { ...completed };
        newCompleted[activeStep] = true;
        setCompleted(newCompleted);
        handleNext();
        if (completedSteps() === totalSteps()) {
            handleClose();
            handleReset();
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setCompleted({});
    };

    const handleExit = () => {
        setActiveStep(0);
        setCompleted({});
        handleClose();
    };

    const css_icon_psdres: React.CSSProperties = {
        borderRadius: "100%",
        background: (palette as any).primary.main,
        width: "5em",
        height: "5em",
        padding: "15px",
        boxShadow: `0rem 0rem 0.8rem 0.5rem rgb(255 255 255 / 44%), 0rem 0rem 0rem 0.7rem rgb(${darkMode ? "193 100 100" : "100 189 193"
            } / 10%) !important`,
        color: darkMode ? (palette as any).white.main : (palette as any).dark.main,
        marginBottom: "25px",
    };

    return (
        <div>
            <Backdrop sx={{ color: "#fff", zIndex: (theme: Theme) => theme.zIndex.drawer + 1 }} open={open}>
                <Card sx={{ width: "50%", borderRadius: "10px", maxWidth: "500px" }}>
                    <Stack alignItems="flex-end">
                        <IconButton
                            color="inherit"
                            onClick={handleExit}
                            sx={{ width: "fit-content", height: "fit-content", m: 1 }}
                        >
                            {icon_close()}
                        </IconButton>

                        {!allStepsCompleted() && (
                            <>
                                <TabContext value={activeStep.toString()}>
                                    {/* Step 1 */}
                                    <TabPanel
                                        value="0"
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            padding: `${activeStep == 0 ? "" : 0}`,
                                        }}
                                    >
                                        <Stack p={5}>
                                            <Stack alignItems="center">
                                                <VpnKeyIcon sx={{ ...css_icon_psdres, transform: "rotate(321deg)" }} />
                                                <MDTypography
                                                    variant="h3"
                                                    fontWeight="medium"
                                                    style={{ fontWeight: "500", textAlign: "center" }}
                                                    mt={1}
                                                >
                                                    Password Dimenticata?
                                                </MDTypography>
                                                <MDTypography
                                                    component="span"
                                                    variant="body2"
                                                    fontWeight="medium"
                                                    style={{
                                                        color: `${palette.grey[500]}`,
                                                        fontWeight: "200",
                                                        fontSize: "0.7em",
                                                        textAlign: "center",
                                                    }}
                                                    mt={1}
                                                >
                                                    Non preoccuparti, ti invieremo le istruzioni per il reset.
                                                    Ti verrà inviato un codice all'indirizzo e-mail collegato a questo account.
                                                </MDTypography>
                                            </Stack>

                                            {userContext == null && (
                                                <FDInput
                                                    type="email"
                                                    label="Email"
                                                    value={email}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                                    variant="outline"
                                                    size="md"
                                                    helperText="inserisci qui la tua E-mail"
                                                    fullWidth
                                                />
                                            )}
                                        </Stack>

                                        {!timeReSendMail ? (
                                            <LoadingButton
                                                variant="contained"
                                                loading={loadStatus.sendEmail}
                                                sx={{ ml: "auto", maxWidth: 150, mt: 5, color: "#fff" }}
                                                onClick={sendEmail}
                                            >
                                                Reset
                                            </LoadingButton>
                                        ) : (
                                            <CountdownComponent
                                                timeReSendMail={timeReSendMail}
                                                onCountdownEnd={handleCountdownEnd}
                                            />
                                        )}
                                    </TabPanel>

                                    {/* Step 2 */}
                                    <TabPanel
                                        value="1"
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            padding: `${activeStep == 1 ? "" : 0}`,
                                        }}
                                    >
                                        <Stack p={5}>
                                            <Stack alignItems="center">
                                                <EmailIcon sx={{ ...css_icon_psdres, transform: "rotate(321deg)" }} />
                                                <MDTypography
                                                    variant="h3"
                                                    fontWeight="medium"
                                                    style={{ fontWeight: "500", textAlign: "center" }}
                                                    mt={1}
                                                >
                                                    Controlla la tua email
                                                </MDTypography>
                                                <MDTypography
                                                    component="span"
                                                    variant="body2"
                                                    fontWeight="medium"
                                                    style={{
                                                        fontWeight: "200",
                                                        fontSize: "0.7em",
                                                        textAlign: "center",
                                                        color: (palette as any).grey[500],
                                                    }}
                                                    mt={1}
                                                >
                                                    Abbiamo inviato un email a{" "}
                                                    {userContext == null ? email : userContext.details.username}, nel email che
                                                    hai ricevuto è presente un codice, copialo e incollalo qui sotto e poi
                                                    premi verifica, se il due codici combaciano verrai portato allo step
                                                    successivo!.
                                                </MDTypography>
                                            </Stack>

                                            <TextField
                                                fullWidth
                                                onChange={(e) => {
                                                    setRCode(e.target.value);
                                                }}
                                                placeholder="codice"
                                                sx={{
                                                    textAlignLast: "center",
                                                    mt: 10,
                                                    height: 100,
                                                    "& div": { fontSize: "2rem", height: "100%" },
                                                }}
                                            />
                                        </Stack>

                                        <LoadingButton
                                            variant="contained"
                                            loading={loadStatus.checkVCode}
                                            sx={{ ml: "auto", color: "#fff", mt: 5 }}
                                            onClick={CheckRCode}
                                        >
                                            Verifica
                                        </LoadingButton>
                                    </TabPanel>

                                    {/* Step 3 */}
                                    <TabPanel
                                        value="2"
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            padding: `${activeStep == 2 ? "" : 0}`,
                                        }}
                                    >
                                        <Stack p={5}>
                                            <Stack alignItems="center">
                                                <VpnKeyIcon sx={{ ...css_icon_psdres, transform: "rotate(321deg)" }} />
                                                <MDTypography
                                                    variant="h3"
                                                    fontWeight="medium"
                                                    style={{ fontWeight: "500", textAlign: "center" }}
                                                    mt={1}
                                                >
                                                    Inserisci la nuova Password
                                                </MDTypography>
                                                <MDTypography
                                                    component="span"
                                                    variant="body2"
                                                    fontWeight="medium"
                                                    style={{
                                                        fontWeight: "200",
                                                        fontSize: "0.7em",
                                                        marginBottom: "30px",
                                                        textAlign: "center",
                                                    }}
                                                    mt={1}
                                                >
                                                    inserisci la tua nuova password e confermala per procedere al completamento
                                                    dell'operazione. La tua nuova password deve essere diversa dalla password
                                                    usata in precedenza.
                                                </MDTypography>
                                            </Stack>

                                            <MDBox
                                                style={{
                                                    color: "#344767",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                <FormControl sx={{ m: 1, width: "25ch" }} variant="standard">
                                                    <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
                                                    <Input
                                                        onChange={(e) => setHandlePassField(e.target.value)}
                                                        className="standard-adornment-password"
                                                        type={showPassword ? "text" : "password"}
                                                        endAdornment={
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    aria-label="toggle password visibility"
                                                                    onClick={handleClickShowPassword}
                                                                    onMouseDown={handleMouseDownPassword}
                                                                >
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        }
                                                    />
                                                </FormControl>

                                                <FormControl sx={{ m: 1, width: "25ch" }} variant="standard">
                                                    <InputLabel htmlFor="standard-adornment-password">
                                                        Conferma Password
                                                    </InputLabel>
                                                    <Input
                                                        onChange={(e) => setHandleConfPassField(e.target.value)}
                                                        className="standard-adornment-password"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        endAdornment={
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    aria-label="toggle password visibility"
                                                                    onClick={handleClickShowConfirmPassword}
                                                                    onMouseDown={handleMouseDownPassword}
                                                                >
                                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        }
                                                    />
                                                </FormControl>
                                            </MDBox>
                                        </Stack>

                                        <LoadingButton
                                            variant="contained"
                                            loading={loadStatus.changePassword}
                                            sx={{ ml: "auto", color: "#fff", mt: 5 }}
                                            onClick={() => ChangePassword(handlePassField, handleConfPassField)}
                                        >
                                            Finish
                                        </LoadingButton>
                                    </TabPanel>
                                </TabContext>
                            </>
                        )}
                    </Stack>
                </Card>
            </Backdrop>
        </div>
    );
}
