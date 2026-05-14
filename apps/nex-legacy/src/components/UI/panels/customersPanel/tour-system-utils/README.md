# Tour Scheda Cliente - Guida Strutturale

Questa guida spiega come e' stato organizzato il tour della scheda cliente, come aggiungere step (anche annidati) e come riusarlo dentro tour esistenti (es. `quotazioni`) o futuri (es. `clienti`).

## 1) Obiettivo dell'architettura

L'idea e' separare:

- orchestrazione globale dei tour di pagina (`src/tour/tours.ts`)
- contenuto specifico della scheda cliente (`src/components/UI/panels/customersPanel/tour-system-utils/tours.ts`)

In questo modo:

- il file globale non cresce troppo
- la scheda cliente resta riusabile in piu' pagine
- apertura/chiusura scheda restano step standard e coerenti ovunque

## 2) Dove vive cosa

### Registry scheda cliente

File: `src/components/UI/panels/customersPanel/tour-system-utils/tours.ts`

Contiene:

- `CUSTOMER_PANEL_TOUR_SELECTORS`: tutti i selector `data-tour` della scheda
- `CUSTOMER_PANEL_GLOBAL_OPEN_STEP`: step globale apertura scheda
- `CUSTOMER_PANEL_MAIN_STEPS`: step dei pannelli interni
- `CUSTOMER_PANEL_GLOBAL_CLOSE_STEP`: step globale chiusura scheda
- `buildCustomerPanelTourSteps()`: compone apertura + pannelli + chiusura

### Integrazione nel tour globale

File: `src/tour/tours.ts`

Nel tour di `quotazioni` (o altro) puoi usare:

```ts
...stepDelTourDiPagina,
...buildCustomerPanelTourSteps(),
...stepSuccessiviDelTourDiPagina,
```

Questa e' la modalita' consigliata per agganciare la scheda cliente senza duplicare blocchi di step.

## 3) Come aggiungere uno step interno

1. Aggiungi (o verifica) il `data-tour` nel componente UI reale.
2. Registra il selector in `CUSTOMER_PANEL_TOUR_SELECTORS`.
3. Inserisci lo step in `CUSTOMER_PANEL_MAIN_STEPS` nell'ordine voluto.
4. Se lo step deve restare "protetto" dal lock tour, aggiungi il selector in `CUSTOMER_PANEL_CONTENT_STEP_SELECTORS`.

Esempio base:

```ts
{
  selector: CUSTOMER_PANEL_TOUR_SELECTORS.fido,
  title: "Fido cliente",
  description: "...",
  side: "left",
}
```

## 4) Come aggiungere step annidati (sotto-step di un pannello)

Nel file `tour-system-utils/tours.ts` trovi gia' un esempio commentato per `Anagrafica`.

Pattern consigliato:

1. Step 1: azione utente (es. click su bottone "Dettagli")
2. Step 2: focus sul contenuto comparso (es. box "IDENTIFICATIVI")

Esempio (semplificato):

```ts
{
  selector: '[data-tour="scheda-cliente-anagrafica-details-btn"]',
  title: "Apri i dettagli anagrafica",
  advanceOn: { selector: '[data-tour="scheda-cliente-anagrafica-details-btn"]', event: "click" },
  afterAdvanceWaitFor: '[data-tour="scheda-cliente-anagrafica-identificativi"]',
  blockNextUntilAdvance: true,
},
{
  selector: '[data-tour="scheda-cliente-anagrafica-identificativi"]',
  title: "Box Identificativi",
  enterWaitFor: '[data-tour="scheda-cliente-anagrafica-identificativi"]',
}
```

Nota pratica: prima decommenta/attiva questi step solo quando i selector esistono davvero nel DOM.

## 5) Come interagisce con il lock interazioni

Per `quotazioni` il lock e' configurato in:

- `src/layouts/quotazioni/tour/customerPanelInteractionLockConfig.ts`

Logica:

- durante step "contenuto scheda" blocca interazioni e chiusure accidentali
- nello step di chiusura mantiene lock body ma abilita la X

I selector usati dal lock vengono dallo stesso registry condiviso (`CUSTOMER_PANEL_CONTENT_STEP_SELECTORS` e `CUSTOMER_PANEL_CLOSE_STEP_SELECTOR`), quindi lock e step restano sempre allineati.

## 6) Ruoli: cosa succede se alcuni vedono pannelli e altri no

### Regola nel tour

Gli step interni possono avere `roles`.

Punto importante: `roles` filtra solo gli step dove e' dichiarato.

Se uno step non ha `roles`, e' valido per tutti i ruoli.

Se un ruolo non e' incluso negli `roles` di uno step, quello step viene automaticamente saltato da `getStepsFor(...)` nel tour globale.

Stato attuale del codice:

- nel blocco scheda cliente, il filtro `roles: ["Commerciale", "Admin", "Dev"]` e' gia' presente su alcuni step
- gli step senza `roles` restano globali

Quindi, se vuoi che un pannello interno sia escluso per `Buyer`, devi mettere esplicitamente `roles` anche su quello step.

### Caso pratico quotazioni

- `Commerciale/Admin/Dev`: durante tour aperto ricevono anche `tourMockPayload`, quindi i pannelli guidati risultano stabili.
- `Buyer`: durante tour aperto non riceve `tourMockPayload`, quindi la scheda resta allineata ai permessi reali backend.

Nota operativa: se in `quotazioni` vuoi garantire al 100% che `Buyer` non percorra certi step interni, aggiungi `roles: ["Commerciale", "Admin", "Dev"]` su tutti quegli step.

## 7) Comportamento fuori dal tour (importante)

Le modifiche tour non devono alterare i flussi normali.

Nel dettaglio quotazioni:

- `tourMockPayload` della scheda cliente e' usato solo quando il tour e' aperto (`isOpen`)
- fuori dal tour il valore e' `null`, quindi la scheda usa fetch reali

Questo mantiene invariato il comportamento standard deciso da middleware/permessi backend.

In pratica, la visibilita' finale dei pannelli dipende sempre da due livelli:

1. livello tour (`roles` negli step)
2. livello dati/permessi reali (`sectionFetchStates === "success"` nel pannello)

## 8) Come riusare la scheda cliente in un nuovo tour pagina

Se domani aggiungi la scheda cliente in un'altra pagina (es. `clienti`):

1. Metti nel tour globale gli step di quella pagina.
2. Inserisci `...buildCustomerPanelTourSteps()` nel punto corretto del flusso.
3. Se serve, crea una lock config dedicata a quella pagina (stesso pattern di `quotazioni`).

## 9) Checklist veloce prima del merge

- ogni nuovo step ha un selector realmente presente
- eventuali step con click hanno `advanceOn` coerente
- eventuali step che aspettano UI hanno `enterWaitFor`/`afterAdvanceWaitFor`
- selector da lock allineati al registry
- ruoli verificati (`roles`) per evitare step non validi
- conferma manuale che fuori dal tour il comportamento non cambia
