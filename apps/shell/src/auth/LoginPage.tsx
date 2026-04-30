import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FDButton, FDInput, ColorSwitch } from "@nex/fd-ui";
import { loginWithCredentials } from "@nex/shared-platform";
import { useNexTheme } from "@nex/theme-system";
import { BsLinkedin } from "react-icons/bs";
import { ImFacebook2 } from "react-icons/im";
import { SiTeamviewer } from "react-icons/si";

import bgPattern from "../assets/login/circle-doodle-bg.png";
import fcLogo from "../assets/login/logo-fc-new.webp";
import bgPoster from "../assets/login/astronaut-galaxy-helmet-reflecting-bright-stars-galaxies-projected_372999-8824.webp";
import bgVideo from "../assets/login/astronaut-galaxy-helmet-reflecting-bright-stars-galaxies-pr.mp4";
import nexLogo from "../assets/login/logo_nex_transp.webp";
import nexLogoWhite from "../assets/login/logo_nex_transp_white.webp";

export default function LoginPage({
    onLoginComplete,
}: {
    onLoginComplete: () => void;
}) {
    const { preferences, toggleMode } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const backgroundStyle = useMemo(
        () => ({
            backgroundImage: `linear-gradient(to left, rgba(${darkMode ? "15,15,15" : "245,245,245"}, 0.96), rgba(${darkMode ? "15,15,15" : "245,245,245"}, 0.96)), url(${bgPattern})`,
            backgroundSize: "contain",
            backgroundRepeat: "repeat",
            backgroundPosition: "center",
        }),
        [darkMode],
    );

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await loginWithCredentials({
                apiEndpoint: import.meta.env.VITE_AUTH_API_ENDPOINT,
                username: email,
                password,
                rememberMe,
            });

            onLoginComplete();
        } catch (err) {
            setError(
                typeof err === "string"
                    ? err
                    : "Sembra che ci sia stato un problema generale nel log-in.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={backgroundStyle}
        >
            <div className="flex h-[88vh] w-[92vw] max-w-[1600px] overflow-hidden rounded-[32px] shadow-2xl">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex min-w-0 w-full flex-col bg-white/95 p-6 backdrop-blur-md
                    dark:bg-[#262626]/90 dark:text-zinc-300 lg:w-[42%] lg:min-w-[420px]"
                >
                    <div className="flex items-center justify-between">
                        <img
                            src={fcLogo}
                            alt="Focelda Logo"
                            className="h-12 w-12 object-contain"
                        />

                        <button
                            type="button"
                            className="nex-theme-toggle"
                            onClick={() => toggleMode()}
                        >
                            {darkMode ? "☀️" : "🌙"}
                        </button>
                    </div>

                    <div className="flex h-full flex-col items-center">
                        <img
                            src={darkMode ? nexLogoWhite : nexLogo}
                            alt="NEX Logo"
                            className="mb-4 mt-2 block w-[min(320px,70%)]"
                        />

                        <p className="mb-2 text-center text-[13px] opacity-80">
                            Per rimanere connessi con noi esegui il login con email e password
                            {" "}🔔
                        </p>

                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="mx-auto mt-8 flex w-full max-w-[460px] flex-col gap-4"
                        >
                            <FDInput
                                type="email"
                                label="Email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEmail(e.target.value)
                                }
                                variant="outline"
                                size="md"
                                fullWidth
                            />

                            <FDInput
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPassword(e.target.value)
                                }
                                variant="outline"
                                size="md"
                                fullWidth
                            />

                            <div className="flex items-center justify-between gap-3 text-sm">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe((prev) => !prev)}
                                    />
                                    <span>Ricordami</span>
                                </label>

                                <button
                                    type="button"
                                    className="border-none bg-transparent text-blue-600 hover:underline"
                                >
                                    Password dimenticata?
                                </button>
                            </div>

                            <div className="min-h-[20px] text-[13px] text-red-600">
                                {error ?? ""}
                            </div>

                            <FDButton
                                type="submit"
                                color="dark"
                                variant="contained"
                                size="md"
                                fullWidth
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Accesso..." : "Entra!"}
                            </FDButton>
                        </motion.form>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="mt-auto flex flex-col items-center gap-3 text-sm"
                        >
                            <div>Seguici sui nostri social</div>

                            <div className="flex items-center gap-4">
                                <a
                                    href="https://get.teamviewer.com/focelda"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition hover:scale-110"
                                >
                                    <SiTeamviewer size={20} />
                                </a>

                                <a
                                    href="https://www.facebook.com/Focelda/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition hover:scale-110"
                                >
                                    <ImFacebook2 size={18} />
                                </a>

                                <a
                                    href="https://www.linkedin.com/company/focelda-spa?originalSubdomain=it"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition hover:scale-110"
                                >
                                    <BsLinkedin size={18} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                <div className="relative hidden flex-1 overflow-hidden bg-black lg:block">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={bgPoster}
                        className="absolute inset-0 h-full w-full object-cover"
                    >
                        <source src={bgVideo} type="video/mp4" />
                    </video>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative z-10 flex h-full flex-col justify-end p-10 text-white"
                    >
                        <motion.h1
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                            className="m-0 text-[clamp(48px,7vw,110px)] leading-none"
                        >
                            “
                        </motion.h1>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="max-w-[700px] text-[clamp(28px,3vw,48px)]"
                        >
                            Go anywhere you want in a Galaxy full of wonders!
                        </motion.h2>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}