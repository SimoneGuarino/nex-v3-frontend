import React from "react";

// Icons
import { BsStars } from "react-icons/bs";

const StarIcon = BsStars as React.FC<{ size?: number, className?: string }>;


// ——————————————————————————————————————————————————————————
// SUB COMPONENT
// ——————————————————————————————————————————————————————————
const InfoCard: React.FC<{
    title?: string;
    description?: string;
    children?: React.ReactNode;
}> = ({ title, description, children }) => {
    return (
        <div className="p-4 bg-gray-100 dark:bg-neutral-700/50 rounded-lg">
            {title && <p className="font-medium mb-2">{title}</p>}
            {description && <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>}
            {children && <div className="mt-2">{children}</div>}
        </div>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const AboutSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Informazioni</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Informazioni sull'applicazione.
                </p>
            </div>

            {/* Contenuto */}
            <div className="space-y-4">
                {/* App Info Card */}
                <InfoCard>
                    <div className="flex items-center gap-3 mb-4">
                        <StarIcon size={32} className="text-blue-500" />
                        <div>
                            <p className="font-bold text-xl">NEX AI</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Versione 1.5.0</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Assistente AI avanzato per l'analisi dati e il supporto alle decisioni aziendali.
                    </p>
                </InfoCard>

                {/* Developer Info */}
                <InfoCard title="Sviluppato da" description="NEX Team | Focelda S.p.A."></InfoCard>

                {/* Support Info */}
                <InfoCard title="Supporto">
                    <a href="mailto:helpdesk@focelda.it" className="text-sm text-blue-500 hover:underline">
                        helpdesk@focelda.it
                    </a>
                </InfoCard>
            </div>
        </div>
    );
};

export default AboutSettings;