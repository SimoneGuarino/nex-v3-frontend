import { motion } from "framer-motion";
import React from "react";

interface SpinnerProps {
    size?: number;
    color?: string;
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 50, color = "#3498db", className = "" }) => (
    <motion.div
        className={className}
        style={{
            display: "inline-block",
            width: size,
            height: size,
        }}
        animate={{ rotate: 360 }}
        transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 1,
        }}
    >
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ display: "block" }}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 4}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={Math.PI * (size - 8) * 0.7}
                strokeDashoffset={Math.PI * (size - 8) * 0.15}
                strokeLinecap="round"
            />
        </svg>
    </motion.div>
);

export default Spinner;