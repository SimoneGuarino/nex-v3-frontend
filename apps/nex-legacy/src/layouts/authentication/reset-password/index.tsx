import React from "react";
import { UserContext } from "context/UserContext";

import {
    Stack, Fade, Slide, IconButton, Box, FormControl,
    InputLabel, Input, InputAdornment, TextField, Button
} from "@mui/material"
import { MainTheme } from "assets/settingsTheme";
import MDTypography from "components/MDTypography";
import { icon_done, icon_info, icon_logout } from "config/icons";
import MDButton from "components/MDButton";
import { LogoutLogic } from "classes/log-out";


import nexLogo from "assets/images/login/logo_nex_transp.webp"
import nexLogoWhite from "assets/images/login/logo_nex_transp_white.webp"
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import EmailIcon from '@mui/icons-material/Email';
import { VerifyCodeAPI } from "examples/ChangeEmaPass/fetchData/verifyCode";
import { enqueueSnackbar } from "components/MessageBox";
import { SendEmailAPI } from "./fetchData/sendEmail";
import { ResetPasswordAPI } from "./fetchData/resetPassword";
import LoadingButton from "@mui/lab/LoadingButton";
import { differenceInSeconds } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useNexTheme } from "@nex/theme-system";


interface UserContextProps {
    details?: object;
    token?: string;
};


const CountdownComponent: React.FC<{ timeReSendMail: Date, onCountdownEnd: () => void }> = ({ timeReSendMail, onCountdownEnd }) => {
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
                onCountdownEnd(); // Chiama la funzione al termine del countdown
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onCountdownEnd]);

    return (
        <MDTypography variant="body2" sx={{ ml: 'auto', mt: 5 }}>
            Puoi riprovare tra {secondsRemaining} secondi
        </MDTypography>
    );
};


const GeneralSettings: React.FC<{ indexStep: number }> = ({ indexStep }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const navigate = useNavigate();
    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);

    // const handleLogout = LogoutLogic({ userContext, setUserContext })

    return (
        <Fade in={true} timeout={1200}>
            <Stack>
                <IconButton
                    sx={{ position: 'absolute', top: 10, left: 10 }}
                    onClick={() => LogoutLogic({ userContext, setUserContext })}
                >
                    {icon_logout()}
                </IconButton>
                <Fade in={Boolean(indexStep != 0)} timeout={400}>
                    <img
                        loading="lazy"
                        src={darkMode ? nexLogoWhite : nexLogo}
                        alt="Nex Logo"
                        className="css-user-noselect"
                        style={{ position: 'absolute', top: 10, right: 10, width: "10em" }}
                    />
                </Fade>
            </Stack>
        </Fade>
    );
};

const IntroMessage: React.FC<{
    sendEmail: () => void; loadStatus: {
        sendEmail: boolean,
        checkVCode: boolean,
    }, timeReSendMail: Date | null; handleCountdownEnd: () => void;
}> = ({ sendEmail, loadStatus, timeReSendMail, handleCountdownEnd }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return <Stack maxWidth={800} alignItems='center' gap={5}>
        <Slide direction="down" timeout={1200} in={true} mountOnEnter unmountOnExit><Stack direction='row' alignItems='center'>
            <MDTypography variant="h1">
                Benvenuto su
            </MDTypography>
            <Fade in={true} timeout={1000}>
                <img loading="lazy" src={darkMode ? nexLogoWhite : nexLogo} alt="Nex Logo" className="css-user-noselect" style={{ width: "25em" }} /></Fade>
        </Stack></Slide>
        <Fade timeout={2200} in={true}>
            <Stack gap={5}>
                <MDTypography variant="body2" sx={{ textAlign: 'center' }}>
                    Per garantire la massima sicurezza del tuo account, il primo passo sarà aggiornare la tua password.
                    Questo semplice passaggio aiuta a proteggere il tuo profilo e a prevenire accessi non autorizzati.
                    Clicca su "Reset" per continuare e completare il processo di accesso alla tua dashboard.
                    Siamo qui per supportarti in ogni fase!
                </MDTypography>
                <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
                    {icon_info({ width: 25, height: 25 })}
                    <MDTypography variant="body1" sx={{ textAlign: 'center' }}>
                        Ti verrà inviato un codice all'indirizzo e-mail collegato a questo account.
                    </MDTypography>
                </Stack>

                {!timeReSendMail ? (
                    <LoadingButton
                        variant="contained"
                        loading={loadStatus.sendEmail}
                        sx={{ ml: 'auto', maxWidth: 150, mt: 5, color: '#fff' }}
                        onClick={sendEmail}
                    >
                        Reset
                    </LoadingButton>
                ) : (
                    <CountdownComponent timeReSendMail={timeReSendMail} onCountdownEnd={handleCountdownEnd} />
                )}
            </Stack>
        </Fade>
    </Stack>
};

const InfoComponent: React.FC<{ text: string }> = ({ text }) => {
    return <Stack direction='row' sx={{ gap: "0.8em", justifyContent: "center", textAlign: "center" }} alignItems='center'>
        {icon_info()}
        <MDTypography variant="h6" fontWeight="light">
            {text}
        </MDTypography>
    </Stack>
}

const steps = ['Invia il codice', 'inserisci il codice', 'Cambia la Password'];
export const ResetPassword: React.FC<{
    indexStep: number; setIndexStep: (prev: number) => void; abortController: any;
    loadStatus: {
        sendEmail: boolean,
        checkVCode: boolean,
        changePassword: false,
    }, ChangeLoadStatus: ({ from, bool }: { from: "sendEmail" | "checkVCode" | "changePassword"; bool?: boolean }) => void
}> = ({ indexStep, setIndexStep, abortController, loadStatus, ChangeLoadStatus }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);

    const [open, setOpen] = React.useState(true);
    const [completed, setCompleted] = React.useState<any>({});

    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const [handlePassField, setHandlePassField] = React.useState('');
    const [handleConfPassField, setHandleConfPassField] = React.useState('');
    const [rcode, setRCode] = React.useState('');

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

    const handleMouseDownPassword = (event: any) => {
        event.preventDefault();
    };

    function CheckRCode() {
        if (rcode && rcode.trim() !== "" && rcode.length > 3) {
            ChangeLoadStatus({ from: "checkVCode", bool: true });
            VerifyCodeAPI({ abortController, mail: userContext.details.username, rcode, handleComplete, ChangeLoadStatus })
        } else {
            enqueueSnackbar("Sembra che tu abbia inserito un codice di reset non valido, riprova.", {
                title: 'Ops..',
                type: 'warning',
            });
        }
    };

    function ChangePassword(pswd: string, cnfpswd: string) {
        if (pswd === cnfpswd) {
            ChangeLoadStatus({ from: "changePassword", bool: true });
            ResetPasswordAPI({ userContext, abortController, pswd, rcode, handleComplete, ChangeLoadStatus });
        } else {
            enqueueSnackbar("La password e la conferma della password non coincidono, perfavore inseriscile nuovamente.", {
                title: 'Ops..',
                type: 'warning',
            });
        }
    };


    const totalSteps = () => {
        return steps.length - 1;
    };

    const completedSteps = () => {
        return Object.keys(completed).length;
    };

    const isLastStep = () => {
        return indexStep === totalSteps();
    };

    const allStepsCompleted = () => {
        return completedSteps() === totalSteps();
    };

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? // It's the last step, but not all steps have been completed,
                // find the first step that has been completed
                steps.findIndex((step, i) => !(i in completed))
                : indexStep + 1;
        setIndexStep(newActiveStep);
    };

    const handleComplete = () => {
        const newCompleted: any = completed;
        newCompleted[indexStep] = true;
        console.log(newCompleted, indexStep, allStepsCompleted())
        setCompleted(newCompleted);
        handleNext();
    };

    const handleReset = () => {
        setIndexStep(0);
        setCompleted({});
    };


    const css_icon_psdres = {
        borderRadius: "100%",
        background: palette.primary.main,
        width: "5em",
        height: "5em",
        padding: "15px",
        boxShadow: `0rem 0rem 0.8rem 0.5rem rgb(255 255 255 / 44%), 0rem 0rem 0rem 0.7rem rgb(${darkMode ? "193 100 100" : "100 189 193"} / 10%) !important`,
        color: darkMode ? palette.white.main : palette.dark.main,
        marginBottom: "25px",
    };



    return <Stack maxWidth={800} alignItems='center' gap={5}>
        {completedSteps() === totalSteps() ? (
            <Stack>
                <Box component="div"  display="flex" flexDirection="column" alignItems="center" mb={5}>
                    {icon_done({ ...css_icon_psdres })}
                    <MDTypography variant="h3" fontWeight="medium" sx={{ color: "#4b365a", fontWeight: "500", mt: 1 }}>
                        Password Reset
                    </MDTypography>
                    <MDTypography fontWeight="medium" sx={{ fontWeight: "200", fontSize: "0.7em", marginBottom: "30px", mt: 1 }}>
                        Grande!, la tua password per l'account {userContext.details.username} è stata cambiata con successo.
                        Premi il pulsante in basso per poter iniziare subito ad utilizzare NEX.
                    </MDTypography>
                </Box>
                <MDButton variant="outlined" onClick={() => setUserContext((prev: any) => ({ ...prev, details: { ...prev.details, stato: { ...prev.details.stato, ultimoAccesso: new Date() } } }))}>
                    Continua
                </MDButton>
            </Stack>
        ) : (
            <React.Fragment>
                <TabContext value={indexStep.toString()}>
                    {/**
                     * Tap 2 -- Inserisci il VCode
                     */}
                    <TabPanel value="1" style={{ color: "#344767" }} id="emailCodeTextField">
                        <Box component="div"  display="flex" flexDirection="column" alignItems="center" mb={5}>
                            <EmailIcon sx={{ ...css_icon_psdres, transform: "rotate(321deg)" }} />
                            <MDTypography variant="h3" fontWeight="medium" sx={{ color: "#4b365a", fontWeight: "500", mt: 1 }}>
                                Controlla la tua email
                            </MDTypography>
                            <MDTypography fontWeight="medium" sx={{ fontWeight: "200", fontSize: "0.7em", marginBottom: "30px", mt: 1 }}>
                                Abbiamo inviato un email a {userContext.details.username}
                            </MDTypography>
                        </Box>
                        <InfoComponent text="inserisci il codice che hai ricevuto sulla tua email." />
                        <TextField fullWidth onChange={(e: any) => { setRCode(e.target.value) }} placeholder="" style={{ textAlignLast: "center" }} />
                    </TabPanel>
                    {/**
                     * Tap 3 -- Inserisci la password
                     */}
                    <TabPanel value="2" style={{ color: "#344767" }}>
                        <Box component="div"  display="flex" flexDirection="column" alignItems="center">
                            <VpnKeyIcon sx={{ ...css_icon_psdres, transform: "rotate(321deg)" }} />
                            <MDTypography variant="h3" fontWeight="medium" sx={{ color: "#4b365a", fontWeight: "500", mt: 1 }}>
                                Inserisci la nuova Password
                            </MDTypography>
                            <MDTypography fontWeight="medium" sx={{ fontWeight: "200", fontSize: "0.7em", marginBottom: "30px", textAlign: "center", mt: 1 }}>
                                La tua nuova password deve essere diversa dalla password usata in precedenza.
                            </MDTypography>
                        </Box>
                        <Box component="div"  sx={{ display: 'flex', justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                            <InfoComponent text="inserisci la tua nuova password e confermala per procedere al completamento dell'operazione." />
                            <FormControl sx={{ m: 1, width: '25ch', mt: 10 }} variant="standard">
                                <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
                                <Input
                                    onChange={(e) => { setHandlePassField(() => { return e.target.value }) }}
                                    className="standard-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => handleClickShowPassword()}
                                                onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => handleMouseDownPassword(e)}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                            <FormControl sx={{ m: 1, width: '25ch' }} variant="standard">
                                <InputLabel htmlFor="standard-adornment-password">Conferma Password</InputLabel>
                                <Input
                                    onChange={(e) => { setHandleConfPassField(() => { return e.target.value }) }}
                                    className="standard-adornment-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => handleClickShowConfirmPassword()}
                                                onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => handleMouseDownPassword(e)}
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                        </Box>
                    </TabPanel>
                </TabContext>
                <Box component="div"  sx={{ display: 'flex', flexDirection: 'row', }}>
                    <Button
                        color="inherit"
                        onClick={() => handleReset()}
                        sx={{ mr: 1 }}
                    >
                        Indietro
                    </Button>
                    <Box component="div"  sx={{ flex: '1 1 auto' }} />
                    {indexStep !== steps.length &&
                        (completed[indexStep] ? (
                            <MDTypography sx={{ display: 'inline-block' }}>
                                Step {indexStep + 1} already completed
                            </MDTypography>
                        ) : (
                            <TabContext value={indexStep.toString()}>
                                <TabPanel value="1">
                                    <LoadingButton variant="contained" loading={loadStatus.checkVCode} sx={{ color: '#fff' }} onClick={() => CheckRCode()}>
                                        {completedSteps() === totalSteps()
                                            ? 'Finish'
                                            : 'Verifica'}
                                    </LoadingButton>
                                </TabPanel>
                                <TabPanel value="2">
                                    <LoadingButton variant="contained" loading={loadStatus.checkVCode} sx={{ color: '#fff' }} onClick={() => ChangePassword(handlePassField, handleConfPassField)}>
                                        {completedSteps() === totalSteps()
                                            ? 'Finish'
                                            : 'Resetta la Password'}
                                    </LoadingButton>
                                </TabPanel>
                            </TabContext>
                        ))}
                </Box>
            </React.Fragment>
        )}
    </Stack>
};


export const ResetWelcomePassword: React.FC<{}> = () => {
    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);

    //Stato che tiene traccia del timer per il re-invio dell'email per il reset password
    const [timeReSendMail, setTimeReSendMail] = React.useState<Date | null>(null);
    const handleCountdownEnd = () => setTimeReSendMail(null);

    const [indexStep, setIndexStep] = React.useState<number>(0);
    const NextStep = () => setIndexStep(indexStep + 1);

    const [loadStatus, setLoadStatus] = React.useState<any>({
        sendEmail: false,
        checkVCode: false,
        changePassword: false,
    });
    const ChangeLoadStatus = ({ from, bool }: { from: "sendEmail" | "checkVCode" | "changePassword"; bool?: boolean }) => {
        setLoadStatus((prev: {
            sendEmail: boolean,
            checkVCode: boolean,
            changePassword: boolean,
        }) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    // Abort il panding del fetch all server
    const abortController = React.useRef(null);

    function sendEmail() {
        ChangeLoadStatus({ from: 'sendEmail', bool: true });
        setTimeReSendMail(new Date(new Date().getTime() + 1 * 60 * 1000));
        SendEmailAPI({ userContext, abortController, NextStep, ChangeLoadStatus, setTimeReSendMail });
    };


    return <Stack alignContent='center' className="css-height-width-100" justifyContent='center' alignItems='center'>
        <GeneralSettings indexStep={indexStep} />
        {indexStep == 0 ? <IntroMessage sendEmail={sendEmail} loadStatus={loadStatus} timeReSendMail={timeReSendMail} handleCountdownEnd={handleCountdownEnd} />
            : <ResetPassword indexStep={indexStep} setIndexStep={setIndexStep}
                abortController={abortController} loadStatus={loadStatus} ChangeLoadStatus={ChangeLoadStatus} />}
    </Stack>
};