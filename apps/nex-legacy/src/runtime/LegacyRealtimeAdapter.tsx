import { useEffect } from "react";
import { getRealtimeKernel } from "@nex/realtime-core";
import { LogoutLogic } from "classes/log-out";

export default function LegacyRealtimeAdapter({
    userContext,
    setUserContext,
    abortController,
    setGSettingsMode,
    setUsersOnline,
    upsertIncomingMessageFromSocket,
    ViewdMessages,
    CloseBlock,
    setMessagesData,
    setPrivateMessagesData,
    setOverviewMessage,
    setChatLoad,
    audio,
}: {
    userContext: any;
    setUserContext: any;
    abortController: any;
    setGSettingsMode: any;
    setUsersOnline: any;
    upsertIncomingMessageFromSocket: any;
    ViewdMessages: any;
    CloseBlock: any;
    setMessagesData: any;
    setPrivateMessagesData: any;
    setOverviewMessage: any;
    setChatLoad: any;
    audio: HTMLAudioElement | null;
}) {
    useEffect(() => {
        const kernel = getRealtimeKernel();

        return kernel.subscribe((event) => {
            switch (event.type) {
                case "maintenance-status":
                    setGSettingsMode((prev: any) => {
                        if (prev?.Manutenzione === event.payload.maintenanceMode) return prev;
                        return { ...prev, Manutenzione: event.payload.maintenanceMode };
                    });
                    return;
                case "users-online":
                    setUsersOnline(event.payload);
                    return;
                case "user-banned-status-update": {
                    const currentUserId = userContext?.details?._id;
                    const payload = event.payload as { userId?: string; disabilitato?: boolean } | null;
                    if (payload?.disabilitato && payload.userId === currentUserId) {
                        LogoutLogic({ userContext, setUserContext, abortController });
                    }
                    return;
                }
                case "chat-message":
                    void upsertIncomingMessageFromSocket(event.payload)
                        .then(() => {
                            if (audio) {
                                audio.play().catch((err: unknown) => console.error("Errore suono:", err));
                            }
                        })
                        .catch((err: unknown) => {
                            console.error("[realtime] receiveMessage upsert error:", err);
                        });
                    return;
                case "chat-viewed":
                    ViewdMessages(event.payload);
                    return;
                case "sblocco-ordini-unread":
                    window.dispatchEvent(new CustomEvent("sbloccoOrdini:unread", { detail: event.payload }));
                    return;
                case "sblocco-ordini-read":
                    window.dispatchEvent(new CustomEvent("sbloccoOrdini:read", { detail: event.payload }));
                    return;
                case "chat-message-list": {
                    const data = Array.isArray(event.payload) ? event.payload : [];
                    if (data.length > 0) {
                        const privateMessages = data.filter((x: any) => x.path === "privata");
                        const publicMessages = data.filter((x: any) => x.path !== "privata");

                        if (privateMessages.length > 0) {
                            setPrivateMessagesData((prevMessages: any[]) =>
                                JSON.stringify(prevMessages) !== JSON.stringify(privateMessages)
                                    ? privateMessages
                                    : prevMessages,
                            );
                        }

                        if (publicMessages.length > 0) {
                            setMessagesData((prevMessages: any[]) =>
                                JSON.stringify(prevMessages) !== JSON.stringify(publicMessages)
                                    ? publicMessages
                                    : prevMessages,
                            );
                        }
                    }

                    setChatLoad(false);
                    return;
                }
                case "chat-block-end":
                    CloseBlock(event.payload);
                    return;
                case "chat-file-uploaded": {
                    const { idBlock, path, messageId } = event.payload;
                    const setDataFunction = path !== "privata" ? setMessagesData : setPrivateMessagesData;
                    setDataFunction((prev: any[]) => {
                        const next = [...prev];
                        if (!next.length) return prev;

                        const blockIndex = next.findIndex((x) => x.idBlock == idBlock);
                        if (blockIndex === -1) return prev;

                        const messages = next[blockIndex]?.messages || [];
                        const messageIndex = messages.findIndex((m: any) => m.tempId === messageId || m._id === messageId);
                        if (messageIndex === -1) return prev;

                        next[blockIndex] = {
                            ...next[blockIndex],
                            messages: messages.map((m: any, index: number) =>
                                index === messageIndex ? { ...m, uploadStatus: "uploaded" } : m,
                            ),
                        };

                        return next;
                    });
                    setOverviewMessage((prev: any) => prev ? { ...prev } : prev);
                    return;
                }
                default:
                    return;
            }
        });
    }, [
        CloseBlock,
        ViewdMessages,
        abortController,
        audio,
        setChatLoad,
        setGSettingsMode,
        setMessagesData,
        setOverviewMessage,
        setPrivateMessagesData,
        setUserContext,
        setUsersOnline,
        upsertIncomingMessageFromSocket,
        userContext,
    ]);

    return null;
}
