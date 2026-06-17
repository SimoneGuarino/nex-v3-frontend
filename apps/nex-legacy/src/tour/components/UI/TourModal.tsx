import React, { memo } from "react";
import { enqueueSnackbar } from "components/MessageBox";

import { FDButton, FDBackdrop, FDBox} from "@nex/fd-ui";

import OnboardingBG from "assets/images/tour/user_onboarding_loading.webp";
import locationIMG from "assets/images/tour/firstOpen_location.webp";

import nexLogoWhite from "assets/images/login/logo_nex_transp.webp";
import { MdClose } from "react-icons/md"; // o le tue icone
import { FDIconButton } from "@nex/fd-ui";

const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;

type TourModalProps = {
    open: boolean;
    onClose: () => void;
    hasTourHere: boolean;
    onStart: () => void;
    /** Indica se è la prima volta che l'utente apre il tour */
    firstOpen: boolean;
};

const TourModal: React.FC<TourModalProps> = ({ open, onClose, hasTourHere, onStart, firstOpen }) => {
    if (!open) return null;

    const handleStart = () => {
        if (!hasTourHere) {
            enqueueSnackbar("In questa pagina non è disponibile il tour guidato.", {
                title: "Tour non disponibile",
                type: "info",
            });
            return;
        }; 
        onStart();
        onClose();
    };

    return (
        <>
            <FDBackdrop onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none max-h-full">
                <FDBox
                    variant="solid"
                    color="light"
                    radius="xl"
                    shadow="2xl"
                    className="w-[90%] max-w-md pointer-events-auto max-h-[90vh] flex flex-col overflow-hidden"
                    translate="no"
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Image */}
                    <div className="bg-gray-200">
                        <div className="px-4 flex items-center justify-between pt-4 pb-0">
                            <img src={nexLogoWhite} alt="" className="w-20" loading="lazy" />
                            <FDIconButton variant="dark" size="small" icon={<MdCloseIcon />} onClick={onClose} className="float-right" />
                        </div>
                        <img
                            src={OnboardingBG}
                            alt=""
                            className="w-full h-52 object-cover rounded-lg mb-4"
                        />
                    </div>

                    {/* Content */}
                    <div className="p-6 font-light overflow-auto">
                        <h2 className="text-xl font-semibold mb-3">Benvenuto nel Tour</h2>

                        <div className="text-sm text-neutral-700 dark:text-neutral-200 space-y-6 mb-4">
                            <p>
                                Il tour guidato ti aiuta a scoprire le funzioni principali della pagina che stai usando.
                                È disponibile solo nelle sezioni in cui è stato previsto: quando sei in una pagina senza tour,
                                il pulsante ti avviserà che non c’è un percorso attivo.
                            </p>

                            <div>
                                <p className="font-semibold">Durante il tour puoi:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>passare allo step successivo o tornare a quello precedente.</li>
                                    <li>chiudere il tour in qualsiasi momento se non vuoi più seguirlo.</li>
                                </ul>
                            </div>

                            {firstOpen && (
                                <div>
                                    <h2 className="font-semibold">Dove apro il tour?</h2>
                                    <p>
                                        Puoi avviare il tour guidato cliccando sull’icona del tuo avatar
                                        in alto a destra nella barra di navigazione secondaria.
                                        Nel menu utente troverai il comando per aprire il tour ogni volta che vorrai.
                                    </p>
                                    <img src={locationIMG} alt="Tour location example" loading="lazy"/>
                                </div>
                            )}

                            <p className="text-[12px] text-neutral-400 dark:text-neutral-600">
                                Quando chiudi il tour, la pagina torna a funzionare normalmente
                                e puoi sempre riaprirlo (se previsto in quella sezione) per ripartire da capo.
                            </p>
                        </div>

                        <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs 
                            text-blue-900 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-100">
                            Premendo "Avvia" verrà avviato il tour guidato per questa pagina.
                            Buon viaggio!
                        </div>

                        {!hasTourHere && (
                            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs 
                            text-amber-900 dark:bg-amber-900/20 dark:border-amber-500 dark:text-amber-100">
                                In questa pagina, al momento, non è disponibile il tour guidato.
                                Potrai avviarlo quando ti trovi in una sezione che supporta il tour.
                            </div>
                        )}
                    </div>

                    {/* Footer - Actions */}
                    <div className="flex justify-end gap-2 p-4 pt-2">
                        <FDButton
                            variant="soft"
                            color="neutral"
                            size="medium"
                            radius="md"
                            onClick={onClose}
                        >
                            Chiudi
                        </FDButton>
                        <span data-tour="tour-modal-start">
                            <FDButton
                                variant="solid"
                                color={hasTourHere ? "dark" : "neutral"}
                                size="medium"
                                radius="md"
                                disabled={!hasTourHere}
                                onClick={handleStart}
                            >
                                Avvia
                            </FDButton></span>
                    </div>
                </FDBox>
            </div>
        </>
    );
};

export default memo(TourModal);
