# File legacy da eliminare dopo l'integrazione di questa patch

Questi file appartengono al vecchio ownership model del realtime/auth dentro `nex-legacy` e possono essere rimossi dopo avere applicato le sostituzioni import incluse nella patch:

## Runtime legacy superato
- `legacy/src/runtime/useAppActivity.ts`
- `legacy/src/runtime/useAppLogoutSync.ts`
- `legacy/src/runtime/useAppRealtime.ts`

## Socket wrapper legacy superati
- `legacy/src/socket/createSocket.ts`
- `legacy/src/socket/WebSocketModuleUser.ts`
- `legacy/src/socket/WebSocketModuleChat.ts`
- `legacy/src/socket/WebSocketModuleAdmin.ts`

## Perché
- il realtime runtime vive ormai nella shell
- i socket reali sono posseduti da `@nex/realtime-core`
- auth/session persistence passa da `@nex/shared-platform`
- questi file legacy mantengono solo duplicazione, drift e rischio di ownership incoerente

## Dopo l'applicazione
1. rimuovi i file sopra
2. fai `rg "WebSocketModule|useAppLogoutSync|useAppActivity|useAppRealtime|socket/createSocket" src`
3. verifica che non esistano più import legacy residui
4. rebuilda i package shared e poi shell/legacy
