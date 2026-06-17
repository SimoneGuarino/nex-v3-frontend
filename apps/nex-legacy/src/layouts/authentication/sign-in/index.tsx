import { useContext, useState, useRef, FormEvent } from "react";
import { UserContext } from "context/UserContext";
import { RememberMeContext } from "context/RememberMe";
import ChangeEmaPass from "../../../examples/ChangeEmaPass";
import Switch from "@mui/material/Switch";
import { Stack } from "@mui/material";

import { motion } from 'framer-motion';

import BasicLayout from "layouts/authentication/components/BasicLayout";

import fcLogo from "assets/images/logo-fc-new.webp";
import bg2 from "assets/images/login/astronaut-galaxy-helmet-reflecting-bright-stars-galaxies-projected_372999-8824.webp";
import bgVid from "assets/images/login/astronaut-galaxy-helmet-reflecting-bright-stars-galaxies-pr.mp4";
import nexLogo from "assets/images/login/logo_nex_transp.webp";
import nexLogoWhite from "assets/images/login/logo_nex_transp_white.webp";

import { DayNightMode } from "examples/Navbars/components/dayNightMode";
import { TempKey } from "./fetchData/tempKey";
import { Login } from "./fetchData/login";
import { EncryptRSA } from "utils/crypt/EncryptRSA";
import { useTheme, useMediaQuery } from "@mui/material";

import { enqueueSnackbar } from "components/MessageBox/SnackbarProvider/SnackbarProvider";
import { FDInput } from "@nex/fd-ui";

import { BsLinkedin } from "react-icons/bs";
import { ImFacebook2 } from "react-icons/im";
import { SiTeamviewer } from "react-icons/si";
import { Tooltip } from "react-tooltip";
import { useNexTheme } from "@nex/theme-system";

const SiTeamviewerIcon = SiTeamviewer as React.FC<{ size?: number }>;
const LinkedInIcon = BsLinkedin as React.FC<{ size?: number }>;
const FacebookIcon = ImFacebook2 as React.FC<{ size?: number }>;

function Basic(): JSX.Element {
    const { preferences, toggleMode} = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const handleChangeDayNightMode = () => toggleMode(darkMode ? "light" : "dark");

    const [userContext, setUserContext] = useContext<any>(UserContext)
    const [rememberMe, setRememberMe] = useContext(RememberMeContext);
    const [resetPwd, setResetPwd] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const abortController = useRef<AbortController | null>(null);

    const handleSetRememberMe = () => setRememberMe(!rememberMe);

    const login = async ({ pbk }: { pbk: string }) => {
        const psw = await EncryptRSA(pbk, JSON.stringify({ psw: password }));
        Login({ username: email.toLowerCase(), psw, abortController, rememberMe, setUserContext, setIsSubmitting });
    };

    const formSubmitHandler = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!email || email.trim() === "") {
            setIsSubmitting(false);
            enqueueSnackbar("Sembra che ci sia un problema con la tua email. Riprova o contatta l'assistenza.", {
                title: "Ops..",
                type: "info",
            });
            return;
        }

        TempKey({ username: email.toLowerCase(), abortController, rememberMe })
            .then((res) => login({ pbk: res.pbk }))
            .catch((error) => {
                console.error(error);
                enqueueSnackbar("Sembra che ci sia un problema con il server. Riprova o contatta l'assistenza.", {
                    title: "Ops..",
                    type: "error",
                });
                setIsSubmitting(false);
            });
    };

    const downloadTeamViewer = () => {
        //funzione che scarica TeamViewer dal url https://get.teamviewer.com/focelda aprendo un altra finestra
        const url = "https://get.teamviewer.com/focelda";
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if ((localStorage.getItem("token") || sessionStorage.getItem("token")) && userContext !== null) return <></>;

    return (
        <BasicLayout image={bg2}>
            {resetPwd && <ChangeEmaPass setChangeEmaPass={setResetPwd} />}
            <div className="flex md:w-9/10 lg:w-7/10 h-[900px] h-4/5 max-w-[1600px] m-2 overflow-hidden flex-row justify-center p-0">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`z-[1] text-center flex items-center p-6 h-full flex-col
                        bg-white dark:bg-neutral-800 overflow-auto rounded-l-4xl
                        ${isMobile ? "w-full" : "w-5/10 xl:w-4/10"}`}
                >
                    <Stack className="w-full mb-auto !flex-row h-1/10 items-center justify-between">
                        <motion.img
                            src={fcLogo}
                            alt="Focelda Logo"
                            className="w-12 h-12 select-none"
                            initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        />
                        <DayNightMode handleChangeDayNightMode={handleChangeDayNightMode} darkMode={darkMode} />
                    </Stack>

                    <Stack className="items-center h-8/10 w-full">
                        <div className="h-full w-full flex flex-col items-center dark:text-gray-500 text-gray-700">
                            <img src={darkMode ? nexLogoWhite : nexLogo} alt="Nex Logo" className="w-4/10 md:w-6/10 lg:w-8/10 select-none mb-3 lg:mb-5" />
                            <p className={`text-xs mb-2 lg:mb-5`}>
                                Per rimanere connessi con noi esegui il login con email e password 🔔
                            </p>

                            <motion.form
                                onSubmit={formSubmitHandler}
                                className="w-full max-w-md px-4 mt-6 space-y-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <motion.div
                                    className="mb-2 lg:mb-3 w-full !space-y-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                >
                                    <FDInput
                                        type="email"
                                        label="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        variant="outline"
                                        size="md"
                                        fullWidth
                                    />

                                    {/* Password con toggle e helper */}
                                    <FDInput
                                        type="password"
                                        label="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        variant="outline"
                                        size="md"
                                        fullWidth
                                    />

                                </motion.div>

                                <div className="flex-col justify-center items-center text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                                        <Switch checked={rememberMe} onChange={handleSetRememberMe} />
                                        <span onClick={handleSetRememberMe}>Ricordami</span>
                                    </label>
                                    <span
                                        onClick={() => setResetPwd(true)}
                                        className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                                    >
                                        Password dimenticata?
                                    </span>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full py-2 px-4 bg-gray-800 dark:bg-blue-600 hover:bg-gray-900 dark:hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-60"
                                >
                                    Entra!
                                </motion.button>

                            </motion.form>
                            <motion.div
                                className="flex flex-col justify-center gap-4 mt-2 mt-auto text-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2, duration: 0.6 }}
                            >
                                Seguici sui nostri social
                                <div className="flex justify-center gap-4 items-center">
                                    <span onClick={downloadTeamViewer} className="cursor-pointer"
                                    data-tooltip-id="general-login-tooltip" data-tooltip-content="Scarica il TeamViewer aziendale">
                                        <SiTeamviewerIcon size={20}/></span>
                                    <a href="https://www.facebook.com/Focelda/" data-tooltip-id="general-login-tooltip" data-tooltip-content="Seguici su Facebook"
                                    className="text-inherit lg:text-xl"><FacebookIcon /></a>
                                    <a href="https://www.linkedin.com/company/focelda-spa?originalSubdomain=it" data-tooltip-id="general-login-tooltip" data-tooltip-content="Seguici su LinkedIn"
                                    className="text-inherit lg:text-xl"><LinkedInIcon /></a>
                                </div>
                            </motion.div>
                        </div>
                    </Stack>
                </motion.div>

                {!isMobile && (
                    <div className="flex flex-col w-full xl:w-6/12 relative bg-black overflow-hidden rounded-r-4xl">
                        {/* Video full con proporzioni */}
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute top-0 left-0 w-full h-full object-cover z-0"
                        >
                            <source src={bgVid} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Contenuto animato */}
                        <motion.div
                            className="relative z-10 p-10 text-white h-full flex flex-col justify-end"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            <motion.h1
                                className="text-4xl lg:text-6xl xl:text-8xl leading-2 font-bold font-sans"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                            >
                                “
                            </motion.h1>
                            <motion.h2
                                className="text-2xl lg:text-3xl xl:text-4xl mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                            >
                                Go anywhere you want in a Galaxy full of wonders!
                            </motion.h2>
                        </motion.div>
                    </div>
                )}
            </div>
            <Tooltip id="general-login-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
        </BasicLayout>
    );
}

export default Basic;
