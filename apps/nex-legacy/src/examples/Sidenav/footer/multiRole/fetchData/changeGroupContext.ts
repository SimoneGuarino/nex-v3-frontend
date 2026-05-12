import { FetchData } from "examples/Fetch";
import { MutableRefObject } from "react";

export interface GroupContextOption {
    _id: string;
    key?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
}

interface DataAPIProps {
    groupId: string;
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (payload: { newToken: string; activeGroupId: string; activeGroupKey?: string; actorTeamKey?: string; activeGroup: GroupContextOption; groupContexts: GroupContextOption[] }) => void;
    HandleError: (errorMessage: string) => void;
}

export async function ChangeGroupContextAPI({ groupId, abortController, HandleComplete, HandleError }: DataAPIProps) {
    return await FetchData(
        `${import.meta.env.VITE_API_ENDPOINT}mn8hngld92ffdekxsl6r/actAsGroup`,
        "POST",
        { groupId },
        abortController,
    ).then((res: { newToken: string; activeGroupId: string; activeGroup: GroupContextOption; groupContexts: GroupContextOption[] }) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== "AbortError") {
            console.error(errorState);
        }
        HandleError("Qualcosa è andato storto durante il cambio team, se questo errore persiste contatta il supporto tecnico.");
    });
}
