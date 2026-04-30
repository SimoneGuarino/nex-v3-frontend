import { getRealtimeKernel } from "./RealtimeKernel";

export function getUserSocket() {
    return getRealtimeKernel().userSocket;
}

export function getChatSocket() {
    return getRealtimeKernel().chatSocket;
}

export function getAdminSocket() {
    return getRealtimeKernel().adminSocket;
}
