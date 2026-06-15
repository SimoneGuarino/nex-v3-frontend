import React from 'react';
import MinLoader from '../../../../minLoader';
import RichTextEditor from 'components/UI/input/RichTextEditor';
import FDButton from 'components/UI/buttons/FDButton';
import { LuSend } from "react-icons/lu";
import { FDBox } from '@nex/fd-ui';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { IoCloseOutline } from "react-icons/io5";
import { useTour } from "tour/TourProvider";

const SendIcon = LuSend as React.FC<{ size?: number; className?: string }>;


interface NoteProps {
    sendPanelStatus: boolean;
    handleNote: string;
    onSendLoad: boolean;
    checkAdminDev: boolean;
    selectedFile?: any;
    generalDataExist: boolean;

    ChangeSendPanelStatus: () => void;
    Send: (res: { tp?: 0 | 1 | 2; esito?: 1 | 2 }) => void;
    ChangeNote: (e: any) => void;
    lockInteractions?: boolean;
    onRequestClose?: () => void;
}

export const Note: React.FC<NoteProps> = ({
    sendPanelStatus,
    handleNote,
    onSendLoad,
    checkAdminDev,
    generalDataExist,
    lockInteractions,
    onRequestClose,
    ChangeSendPanelStatus,
    Send,
    ChangeNote
}) => {
    const { isOpen, index } = useTour();
    const disableClose = (isOpen && checkAdminDev && index === 11) || (isOpen && !checkAdminDev && (index === 7));
    const disabledAll = disableClose || lockInteractions;

    // Se il pannello non è aperto, non renderizzo nulla (equivalente a Backdrop open={false})
    if (!sendPanelStatus) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            role="dialog"
            aria-modal="true"
        >
            <FDBox
                pad='md'
                radius='xl'
                className='flex flex-col gap-2 min-h-[300px] h-[70%] !overflow-y-auto'
            >
                {/* Header */}
                <div className="flex w-full items-center justify-between mb-2 pl-1">
                    <div className="flex flex-col">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Completa la richiesta
                        </span>
                        <span className="text-xs text-neutral-400">
                            La richiesta verrà inviata all'amministrazione per la revisione.
                        </span>
                    </div>
                    <FDIconButton
                        disabled={disabledAll}
                        icon={IoCloseOutline({})}
                        variant="danger"
                        onClick={() => (onRequestClose ? onRequestClose() : ChangeSendPanelStatus())}
                    />
                </div>

                {/* Editor / Loader */}
                <div className="flex-1 overflow-auto">
                    {!onSendLoad ? (
                        <RichTextEditor
                            value={handleNote || ""}
                            onChange={(html: any) => ChangeNote(html)}
                            placeholder="Scrivi una nota..."
                            className="h-full w-full"
                            debounceMs={120}
                            actions={[
                                "bold",
                                "italic",
                                "underline",
                                "strike",
                                "h1",
                                "h2",
                                "ul",
                                "ol",
                                "quote",
                                "code",
                                "link",
                                "clear",
                            ]}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <MinLoader sx={{ width: 25, height: 25 }} />
                        </div>
                    )}
                </div>

                {/* Footer / Pulsanti */}
                <div className="mt-auto flex w-full items-center justify-between pt-2">
                    {checkAdminDev ? (
                        <>
                            <FDButton
                                disabled={onSendLoad || disabledAll}
                                color='success'
                                radius='md'
                                onClick={() => Send({ tp: 1, esito: 1 })}
                            >
                                Accetta
                            </FDButton>

                            <FDButton
                                radius='md'
                                color='error'
                                onClick={() => Send({ tp: 1, esito: 2 })}
                                disabled={onSendLoad || disabledAll}
                            >
                                Rifiuta
                            </FDButton>

                        </>
                    ) : (
                        <FDButton
                            color="primary"
                            radius='md'
                            className="ml-auto"
                            disabled={onSendLoad || disabledAll}
                            onClick={() => Send({ tp: generalDataExist ? 0 : 2 })}
                        >
                            <SendIcon className='mr-1.5' />
                            invia la richiesta
                        </FDButton>
                    )}
                </div>
                {/* </div> */}
            </FDBox>
        </div>
    );
};
