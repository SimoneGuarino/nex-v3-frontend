import React, { useContext } from "react";
import { motion } from "framer-motion";
import { UserContext } from "context/UserContext";
import { CiViewTable } from "react-icons/ci";
import FDButton from "components/UI/buttons/FDButton";
import { IoStatsChartOutline, IoCartOutline } from "react-icons/io5";

const TableIcon = CiViewTable as React.FC<{ size?: number }>;
const StatsIcon = IoStatsChartOutline as React.FC<{ size?: number }>;
const CartIcon = IoCartOutline as React.FC<{ size?: number }>;


const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    },
};

const AnimateWrapper: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    return (
        <motion.div
            variants={(container as any)}
            initial="hidden"
            animate="show"
            transition={{ delay }}
            className="z-10 relative"
        >
            {children}
        </motion.div>
    );
};

interface HeroProps {
    handleSend: ({ input } : { input: string }) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
}
const Hero: React.FC<HeroProps> = ({ handleSend, ChangeLoadStatus }) => {
    const [userContext, setUserContext] = useContext<any>(UserContext);

    const Send = (text: string) => {
        ChangeLoadStatus({ from: "ai_message", bool: true });
        handleSend({input: text });
    };

    return (
        <AnimateWrapper delay={0.1}>
            <motion.div className="flex flex-col items-center text-center space-y-6 mb-[15%]" 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-300">Felice di rivederti, {userContext.details.nome}</p>
                    <h1 className="text-4xl font-bold tracking-tight">
                        <span className="text-black/80 dark:text-neutral-100">Come posso aiutarti?</span>
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6 w-full flex-wrap justify-center">
                    <FDButton
                        onClick={() => Send('Visualizza tabella gestione scorte')}
                        variant="soft"
                        color="neutral"
                        icon={<TableIcon size={20} />}
                    >Visualizza tabella gestione scorte</FDButton>
                    <FDButton
                        onClick={() => Send('Visualizza statistiche previsionali')}
                        variant="soft"
                        color="neutral"
                        icon={<StatsIcon size={20} />}
                    >Visualizza statistiche previsionali</FDButton>
                    <FDButton
                        onClick={() => Send("Qual'è il prodotto che dovrei acquistare?")}
                        variant="soft"
                        color="neutral"
                        icon={<CartIcon size={20} />}
                    >Qual'è il prodotto che dovrei acquistare?</FDButton>
                </div>
            </motion.div>
        </AnimateWrapper>
    );
};

export default Hero;
