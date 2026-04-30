import { motion, AnimatePresence } from "framer-motion";
import Spinner from "./spinner";

type Props = {
    visible: boolean;
    darkMode?: boolean;
    logoSrc: string;
    logoDarkSrc?: string;
};

export default function SplashLoader({
    visible,
    darkMode = false,
    logoSrc,
    logoDarkSrc,
}: Props) {
    const currentLogo = darkMode && logoDarkSrc ? logoDarkSrc : logoSrc;

    return (
        <AnimatePresence>
            {visible && <motion.div
                key="splash"
                className={`fixed gap-8 inset-0 flex flex-col items-center justify-center z-[9999] ${darkMode ? "bg-neutral-900" : "bg-white"
                    }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4 } }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
                <motion.div
                    className="w-48"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{
                        scale: 1,
                        rotate: 0,
                        transition: { type: "spring", stiffness: 260, damping: 20 },
                    }}
                >
                    <img src={currentLogo} alt="NEX Logo" className="select-none" />
                </motion.div>

                <motion.div
                    className="w-14 h-14 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.6 } }}
                >
                    <Spinner />
                </motion.div>
            </motion.div>}
        </AnimatePresence>
    );
}
