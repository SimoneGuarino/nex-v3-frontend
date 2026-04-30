# NEX V3 multi web-app POC

Questo proof-of-concept introduce una migrazione incrementale:

- `apps/nex-legacy`: frontend attuale NEX V2, quasi invariato
- `apps/shell`: shell applicativa leggera per auth/session bootstrap, layout e routing alto livello
- `apps/survey-builder`: nuova web-app esempio per validare il passaggio multi web-app
- `packages/shared-platform`: helper condivisi minimi (storage/session)

## Obiettivo
Validare:
1. fluidità di switch tra legacy e nuova app survey
2. fattibilità della shell centrale
3. possibilità di evolvere V2 -> V3 senza big bang rewrite

## Routing suggerito
- `/legacy/*` -> nex-legacy
- `/survey/*` -> survey-builder
- `/` -> shell

## POC attuale
Il legacy contiene una nuova entry Marketing > Survey Builder che effettua redirect verso la nuova app `survey-builder`.
La shell usa gli stessi storage key (`token`, `rememberMe`) e presenta accesso ai moduli.

## Run locale (concettuale)
Aprire 3 terminali:

```bash
npm install
npm run dev:shell
npm run dev:survey
npm run start:legacy
```

Server previsti:
- shell: `http://localhost:3001`
- survey-builder: `http://localhost:3002`
- legacy: `http://localhost:3000/legacy`

## Note
È un POC architetturale: la shell non rimpiazza ancora tutta la logica attuale di `App.js`, ma sposta il punto di ingresso e stabilisce il pattern di evoluzione.



npm run dev -w @nex/survey-builder
npm run dev -w @nex/shell
npm run dev -w @nex/legacy

npm run build -w @nex/ui-feedback