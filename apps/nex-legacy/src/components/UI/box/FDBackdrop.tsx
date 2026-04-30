import { motion } from "framer-motion";

export const FDBackdrop: React.FC<{ onClick: () => void; passThrough?: boolean }> = ({ onClick, passThrough }) => (
    <motion.div
        className={`fixed inset-0 z-10 bg-black/40 backdrop-blur-xs ${passThrough ? "pointer-events-none" : ""}`}
        onClick={!passThrough ? onClick : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden={passThrough ? "true" : "false"}
    />
);