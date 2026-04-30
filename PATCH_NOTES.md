# NEX vNext patch — Shell chrome separation + realtime optimizations

## Included improvements

### 1. Route-aware shell chrome
- adds `chrome` metadata to each microfrontend definition
- allows survey-builder to run with `chrome: "hidden"`
- keeps runtime/socket/store alive in shell even when shell UI is hidden
- keeps legacy on `chrome: "full"`

### 2. Realtime store hooks/selectors
- introduces fine-grained hooks for unread counts, session, maintenance and connection state
- reduces broad `useRealtimeStore()` usage inside shell chrome
- prepares reusable shell/legacy/survey adapters without rerendering on unrelated state changes

### 3. Realtime kernel hardening
- reconnect now re-emits `userConnected`, `join`, and `MTCStatus` on socket reconnect
- runtime keeps `startedUserId` explicitly instead of relying only on current mount state
- connection handling is centralized through `ensureConnected()`

## Why this matters
This patch closes an important architectural gap:
- runtime persistence and UI chrome are now clearly separated
- survey-builder can have no shell chrome while still receiving realtime data
- shell becomes closer to a true orchestration layer instead of a permanent visible layout

# Auth/session consolidation + legacy cleanup

## Obiettivi coperti
- session snapshot persistita davvero in storage condiviso
- shell in grado di reidratarsi da `shared-platform` senza dipendere solo dal mount live del legacy
- login / bootstrap / role switch allineati al layer shared
- rimozione progressiva del vecchio ownership model socket dal legacy

## Impatto architetturale
- `@nex/shared-platform` diventa la source of truth per token, rememberMe e user details persistiti
- `@nex/realtime-core` diventa l'unico punto di accesso ai socket
- `nex-legacy` smette di possedere i wrapper socket locali e i vecchi runtime hook superati
