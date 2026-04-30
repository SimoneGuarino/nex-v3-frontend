import { motion, AnimatePresence } from "framer-motion";

type Props = {
    progress: number;
    label?: string;
    darkMode?: boolean;
    logoSrc: string;
    logoDarkSrc?: string;
};

export default function SplashProgressLoader({
    progress,
    label = "Caricamento modulo...",
    darkMode = false,
    logoSrc,
    logoDarkSrc,
}: Props) {
    const safeProgress = Math.max(0, Math.min(100, progress));
    const currentLogo = darkMode && logoDarkSrc ? logoDarkSrc : logoSrc;

    return (
            <motion.div
                key="splash-progress"
                className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 ${darkMode ? "bg-neutral-900" : "bg-white"
                    }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.35 } }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
                <motion.div
                    className="w-48"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: { duration: 0.35 } }}
                >
                    <img
                        src={currentLogo}   
                        alt="NEX Logo"
                        className="select-none"
                    />
                </motion.div>

                <div className="w-[320px] max-w-[80vw] flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className={darkMode ? "text-neutral-300" : "text-neutral-600"}>
                            {label}
                        </span>
                        <span className={darkMode ? "text-white" : "text-neutral-900"}>
                            {safeProgress}%
                        </span>
                    </div>

                    <div
                        className={`h-2 w-full overflow-hidden rounded-full ${darkMode ? "bg-neutral-800" : "bg-neutral-200"
                            }`}
                    >
                        <motion.div
                            className="h-full rounded-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${safeProgress}%` }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </motion.div>
    );
}
