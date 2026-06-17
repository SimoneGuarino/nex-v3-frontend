// shareToChat.ts
import { getChatSocket } from '@nex/realtime-core';
const chatSocket = getChatSocket();

import { type ShareDoc } from '@nex/fd-ui';

import { enqueueSnackbar } from 'components/MessageBox';
import { ChatBlock } from 'context/GeneralDataContext';
import { Dispatch, SetStateAction } from 'react';

type Company = "FOCELDA" | "IOT";
type ShareTarget = { _id: string; nome: string; cognome: string; idBlock?: string | null };
export async function shareDocumentsToUsers({
    userContext,
    abortController,
    targets,
    docs,
    messageText,
    overviewMessage,
    setMessagesData,
    setPrivateMessagesData,
    CreateNewChatBlock,
}: {
    userContext: any;                     // UserContext
    abortController: any;                 // come negli altri API helper
    targets: ShareTarget[];               // utenti selezionati
    docs: ShareDoc[];                       // documenti selezionati dal pannello
    messageText?: string;
    overviewMessage: ChatBlock | null;
    setMessagesData: Dispatch<SetStateAction<ChatBlock[]>>;
    setPrivateMessagesData: Dispatch<SetStateAction<ChatBlock[]>>;
    CreateNewChatBlock: ({ data, settings }: 
        { data: any; settings: { loadFromRemote: boolean; createRemoteBlock: boolean; loadState: boolean } }) => Promise<{ idBlock?: string | null; messages: ChatBlock[] }>;
}) {

    // 1) assicurati blocchi chat (privati) esistenti (o creali)
    const ensureBlock = async (t: ShareTarget) => {
        if (t.idBlock) return t.idBlock;
        const data_ = {
            idb: t.idBlock ?? null, // id temporaneo
            titleBlock: "",   // opzionale
            path: "privata",
            disabilitato: false,
            users: [
                { _id: userContext.details._id, nome: userContext.details.nome, cognome: userContext.details.cognome },
                { _id: t._id, nome: t.nome, cognome: t.cognome }
            ],
        };

        const {idBlock, messages} = await CreateNewChatBlock({
            data: data_,
            settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
        });

        console.log(idBlock, messages);

        /*const idb = await ActionsOnRemoteBlocksAPI({
            userContext,
            abortController,
            data: data_,
            tp: 0,                    // create
            idBlock: t.idBlock ?? undefined,
        });*/
        return idBlock || undefined;
    };

    // 2) allegati resource-based
    const attachments = docs.map((d) => ({
        kind: "resource",
        fileType: "pdf",
        company: d.company,
        fileName: d.fileName,
        displayName: d.displayName ?? d.fileName,
    }));

    // 3) per ognuno, crea/ottieni il blocco ed emetti il messaggio
    for (const t of targets) {
        const idBlock = await ensureBlock(t);
        if (!idBlock) continue;

        const payload = {
            idBlock,
            user: {
                _id: userContext.details._id,
                nome: userContext.details.nome,
                cognome: userContext.details.cognome,
            },
            msg: messageText ?? "",
            viewed: false,
            date: new Date(),
            attachments,
        };

        await new Promise<void>((resolve) => {
            chatSocket.emit('privateMessage', payload, (response: { status: boolean; message_id: string }) => {
                if (response && !response.status) {
                    enqueueSnackbar("Sembra che ci sia stato un problema durante l'invio del messaggio, riprova tra qualche istante.", {
                        title: 'Ops.. Errore in risposta dal server',
                        type: 'error',
                    });
                } else {
                    // salva sullo stato principale dei blocchi o dei messaggi privati.
                    setPrivateMessagesData((prev: ChatBlock[]) => {
                        const blocks: ChatBlock[] = [...prev];
                        const indexMap: Map<string, number> = new Map(
                            blocks.map((value, index) => [value.idBlock, index])
                        );
                        if (!idBlock) return blocks;
                        const blockIndex = indexMap.get(idBlock);

                        if (blockIndex !== undefined && blockIndex !== -1) {
                            // Trova il blocco target
                            const blockTarget = blocks[blockIndex];

                            if (blockTarget) {
                                // Aggiungi il messaggio al blocco
                                (blockTarget.messages as any[]).push({ ...{ _id: response?.message_id, ...payload }, sended: true });

                                // Rimuovi il blocco dalla posizione attuale
                                blocks.splice(blockIndex, 1);

                                // Sposta il blocco in cima
                                blocks.unshift(blockTarget);
                            }
                        };

                        return blocks;
                    });
                };
                resolve();
            });
        });
    }
}
