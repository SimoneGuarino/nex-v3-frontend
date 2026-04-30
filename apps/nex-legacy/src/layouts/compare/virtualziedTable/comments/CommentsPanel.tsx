import React, { useContext, useMemo, useRef, useState } from "react";

import { UserContext } from "context/UserContext";
import { AddNote } from "../fetchData/actions/addNote";
import { RemoveNote } from "../fetchData/actions/removeNote";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { getRolesMappedByLabel, Notifications } from "utils/index";
import { BodyNotificationsProps } from "utils/notifications/notifications";
import { ContextMenu } from "components/UI/menu/ContextMenu";

//icons
import { IoIosSend } from "react-icons/io";
import { IoTrashOutline } from "react-icons/io5";
import { IoIosMore } from "react-icons/io";
import { UserAvatar } from "examples/Navbars/components/userInfo";

const SendIcon = IoIosSend as React.FC<{ size?: number; className?: string }>;
const IoTrashOutlineIcon = IoTrashOutline as React.FC<{ size?: number; className?: string }>;
const IoIosMoreIcon = IoIosMore as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type CommentEntry = {
    tempId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    userImage?: string;
    text: string;
    datePublish?: string | number | Date;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * genera una stringa unica della lunghezza di caratteri passata
 * @param length 
 * @returns 
 */
function generateUniqueString(length: number) {
    let result = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

/**
 * normalizza la struttura dei commenti in modo da avere sempre un array di oggetti
 * @param input 
 * @returns 
 */
function normalizeComments(input: any): CommentEntry[] {
    if (!Array.isArray(input)) return [];
    const out: any[] = [];
    const stack = [...input];
    while (stack.length) {
        const cur = stack.shift();
        if (Array.isArray(cur)) stack.unshift(...cur);
        else if (cur) out.push(cur);
    }
    return out.filter((c) => typeof c?.text === "string");
};

/**
 * calcola il tempo in secondi | minuti | ore | giorni
 * @param d 
 * @returns 
 */
function timeAgo(d?: string | number | Date) {
    if (!d) return "";
    const ms = new Date(d).getTime();
    if (!Number.isFinite(ms)) return "";
    const diff = Date.now() - ms;

    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s fa`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m fa`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h fa`;
    const days = Math.floor(h / 24);
    return `${days}g fa`;
};

/**
 * recupera buyer code assegnato al prodotto
 * @param r 
 * @returns 
 */
const getBuyerCode = (r: any) => {
    const base = r?.dati ?? r;
    const code = base?.AssegnatoBuyer;
    return typeof code === "string" && code.trim() ? code.trim() : undefined;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * restituisce la lista di commenti per la row passata, da la possibilita di aggiungere e rimuovere i commenti
 * inviando una notifica dopo ciascuna operazione
 * @param param0 
 * @returns 
 */
export function CommentsPanel({
    row,
    abortController,
}: {
    row: any;
    abortController?: React.MutableRefObject<AbortController | undefined>;
}) {
    const [userContext] = useContext<any>(UserContext);
    const [text, setText] = useState(""); //stato per settare il testo da aggiungere come commento
    const [comments, setComments] = useState<CommentEntry[]>(() => normalizeComments(row?.Comments)); //stato per passare la lista di commenti
    const [moreSettings, setMoreSettings] = useState<number | boolean>(false); //stato per aprire il menu contestuale

    const settingsPosRef = useRef<HTMLElement | null>(null); //ref per posizionare il menu contestuale
    const taRef = useRef<HTMLTextAreaElement | null>(null);

    /**
     * memo per ordinare i commenti secondo la data
     */
    const sorted = useMemo(() => {
        return [...comments].sort((a, b) => {
            const da = new Date(a.datePublish ?? 0).getTime();
            const db = new Date(b.datePublish ?? 0).getTime();
            return db - da;
        });
    }, [comments]);

    /**
     * controllo su ruolo o appartenenza per autorizzazione a eliminare il commento
     * @param c 
     * @returns 
     */
    const canDelete = (c: CommentEntry) => {
        const role = userContext?.details?.ruolo;
        const me = userContext?.details?.username;
        return role === "Admin" || role === "Dev" || (me && c.username && me === c.username);
    };

    /**
     * handler per far ingrandire automaticamente la textarea (altezza)
     * @param e 
     */
    const autoResize: React.FormEventHandler<HTMLTextAreaElement> = (e) => {
        const el = e.currentTarget;
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight}px`;
    };

    /**
     * handler per il reset dell'altezza della textarea
     * @returns 
     */
    const resetTextareaHeight = () => {
        const el = taRef.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight}px`;
    };

    /** costruisce il body della notifica */
    const BuilBodyNotifications = (): Omit<BodyNotificationsProps, "desc"> => {
        const buyerCode = getBuyerCode(row);
        const fromUsername = userContext?.details?.username ?? "";
        const fromNome = userContext?.details?.nome ?? "";
        const fromCognome = userContext?.details?.cognome ?? "";
        const fullName = `${fromNome} ${fromCognome}`.trim();
        return {
            user_from: fromUsername,
            user_from_details: { nome: fromNome, fullName, system: false },
            user_target: [],
            type: "Info",
            modality: "Generale",
            usersTargetStatus: "Tutti",
            timerMode: false,
            usersTargetCodiceBuyer: buyerCode,
        };
    };

    /**
     * usa la fetch Notification per inviare una notifica all'aggiunta di un commento
     * a tutti gli Admin, Dev e Buyers con lo stesso codice del prodotto selezionato
     * @param postText 
     */
    const sendCommentNotification = (postText: string) => {
        const buyerCode = getBuyerCode(row);
        const base = row?.dati ?? row;
        const codice = base?.CodiceProduttore ?? base?.Ci ?? "";
        const descr = base?.Descrizione?.Corta ?? "";

        Notifications({
            _id: userContext?.details?._id,
            userToken: userContext?.token,
            statusNotificationSend: false,
            body: {
                ...BuilBodyNotifications(),

                // HTML 
                desc: `<p>l'utente ha inserito un <strong>nuovo commento</strong> su:</p>
                <p><em>${codice}${buyerCode ? ` (Buyer ${buyerCode})` : ""}${descr ? " - " + descr : ""}</em></p>
                <p>${String(postText).replace(/\n/g, "<br/>")}</p>`,
            },
        });
    };

    /**
     * usa la fetch Notification per inviare una notifica all'eliminazione di un commento
     * a tutti gli Admin, Dev e Buyers con lo stesso codice del prodotto selezionato
     * @param deleted 
     */
    /*const sendCommentDeletedNotification = (deleted: CommentEntry) => {
        const buyerCode = getBuyerCode(row);
        const base = row?.dati ?? row;
        const fromUsername = userContext?.details?.username ?? "";

        const fromNome = userContext?.details?.nome ?? "";
        const fromCognome = userContext?.details?.cognome ?? "";
        const fullName = `${fromNome} ${fromCognome}`.trim();
        const codice = base?.CodiceProduttore ?? base?.Ci ?? "";
        const descr = base?.Descrizione?.Corta ?? "";
        const author =
            `${deleted.firstName ?? ""} ${deleted.lastName ?? ""}`.trim() ||
            deleted.username ||
            "Utente";

        Notifications({
            _id: userContext?.details?._id,
            userToken: userContext?.token,
            statusNotificationSend: false,
            body: {
                ...BuilBodyNotifications(),

                //HTML
                desc: `<p><strong>Commento eliminato</strong>${buyerCode ? ` (Buyer ${buyerCode})` : ""} su:</p>
                <p><em>${codice}${descr ? " - " + descr : ""}</em></p>
                <p><strong>Autore:</strong> ${author}</p>
                <p><strong>Eliminato da:</strong> ${fullName || fromUsername}</p>
                <p><del>${String(deleted.text).replace(/\n/g, "<br/>")}</del></p>`,
            },
        });
    };*/

    /**
     * aggiunge istantaneamente il commento appena inserito con un id temporaneo generato
     * generateUniqueString 
     * @returns 
     */
    const onSend = () => {
        const postText = text.trim();
        if (!postText) return;

        const uniqueString = generateUniqueString(10);

        // 1) salva commento (come prima)
        AddNote(uniqueString, row, postText, userContext, abortController);

        const entry: CommentEntry = {
            tempId: uniqueString,
            username: userContext?.details?.username,
            firstName: userContext?.details?.nome,
            lastName: userContext?.details?.cognome,
            userImage: userContext?.details?.imageProfile ?? userContext?.details?.userImage,
            text: postText,
            datePublish: Date.now(),
        };

        // 2) aggiorna UI subito (optimistic)
        setComments((prev) => [entry, ...(prev ?? [])]);
        if (!Array.isArray(row.Comments)) row.Comments = [];
        row.Comments.unshift(entry);

        // 3) invia notifica buyer + admin/dev
        if([0,1].includes(parseInt(getRolesMappedByLabel()[userContext.details.ruolo]) ?? -1)){
            sendCommentNotification(postText);
        }

        // 4) reset input
        setText("");
        requestAnimationFrame(resetTextareaHeight);
    };

    /**
     * elimina il commento
     * @param commentIndexInSorted 
     * @returns 
     */
    const onRemove = (commentIndexInSorted: number) => {
        const target = sorted[commentIndexInSorted];
        if (!target) return;
        // chiude il menu
        setMoreSettings(false);

        const raw = Array.isArray(row?.Comments) ? row.Comments : [];
        const idxInRow = raw.findIndex(
            (x: any) =>
                (target.tempId && x?.tempId === target.tempId) ||
                (!target.tempId &&
                    x?.text === target.text &&
                    x?.datePublish === target.datePublish &&
                    x?.username === target.username)
        );

        RemoveNote(comments, row, idxInRow >= 0 ? idxInRow : commentIndexInSorted, userContext, abortController);

        // notifica eliminazione (stessa logica: fire-and-forget)
        // sendCommentDeletedNotification(target);

        setComments((prev) => {
            const copy = [...(prev ?? [])];
            const idx = copy.findIndex(
                (x) =>
                    (target.tempId && x?.tempId === target.tempId) ||
                    (!target.tempId &&
                        x?.text === target.text &&
                        x?.datePublish === target.datePublish &&
                        x?.username === target.username)
            );
            if (idx >= 0) copy.splice(idx, 1);
            return copy;
        });

        if (idxInRow >= 0) row.Comments.splice(idxInRow, 1);  
    };

    return (
        <div className="min-w-[350px] w-auto max-w-[400px] flex flex-col max-h-[500px] overflow-y-auto p-2">
            {/* input */}
            <div className="w-full flex gap-1 items-center mb-2">
                <textarea
                    ref={taRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onInput={autoResize}
                    rows={1}
                    placeholder="Scrivi un commento…"
                    className={[
                        "w-full",
                        "min-h-[44px]",
                        "max-h-[100px]",
                        "resize-none",
                        "rounded-md",
                        "bg-transparent",
                        "border border-neutral-700",
                        "px-3 py-2",
                        "text-sm",
                        "outline-none",
                        "focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500",
                    ].join(" ")}
                />

                <FDIconButton icon={<SendIcon />} className="h-full" variant="primary"  size="medium" rounded="xs" onClick={onSend} />
            </div>

            {/* lista commenti */}
            <div className="mt-3 flex flex-col gap-4">
                {sorted.length === 0 ? (
                    <div className="text-xs text-neutral-400">Nessun commento.</div>
                ) : (
                    sorted.map((c, i) => {
                        const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.username || "Utente";

                        return (
                            <div
                                key={c.tempId ?? `${c.username ?? "u"}-${i}`}
                                className="flex gap-3 items-center"
                            >
                                <UserAvatar name={c.firstName} cognome={c.lastName} size={7} textSize="xs" />

                                <div className="flex-1 items-start">
                                    <div className="flex items-center justify-between gap-2 text-neutral-400">
                                        <div className="truncate text-[11px] font-light">{fullName}</div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-xs ">{timeAgo(c.datePublish)}</div>
                                            {canDelete(c) && (<div onClick={(e) => settingsPosRef.current = e.currentTarget}>
                                                <FDIconButton
                                                    icon={<IoIosMoreIcon className="text-gray-400" />}
                                                    onClick={() => setMoreSettings(i)}
                                                    size="small"
                                                    variant="text"
                                                /></div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="whitespace-pre-wrap break-words text-sm text-neutral-200">{c.text}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ContextMenu
                openFor={typeof moreSettings == "number"}
                pos={settingsPosRef as React.RefObject<HTMLElement | null>}
                onClose={() => setMoreSettings(false)}
                placement="bottom-start"
                stopMouseDownPropagation
                panel={
                    <FDButton variant="ghost" color="dark"
                        icon={<IoTrashOutlineIcon />} onClick={() =>  onRemove(moreSettings as number)}>
                        Elimina commento
                    </FDButton>
                }
            />
        </div>
    );
}

export default CommentsPanel;
