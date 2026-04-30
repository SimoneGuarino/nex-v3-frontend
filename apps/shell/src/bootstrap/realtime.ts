import { configureRealtimeCore } from "@nex/realtime-core";

configureRealtimeCore({
    serverHost: import.meta.env.VITE_SERVER_HOST,
});