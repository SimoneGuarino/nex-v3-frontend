# VERSIONING_POLICY.md

> **Scopo**: definire una politica chiara, coerente e sostenibile per versionare NEX (gestionale aziendale interno) e i suoi componenti (Frontend React/TypeScript e Backend a microservizi su Node/Express), in modo che ogni rilascio sia prevedibile, tracciabile e reversibile.

---

## 1) Cosa versioniamo

* **Versione di Prodotto (NEX)** — `MAJOR.MINOR.PATCH` (SemVer)

  * È la versione “visibile” agli utenti interni e riportata nelle release notes e nell’UI (es. *Help → Informazioni*).
  * Rappresenta lo stato complessivo del sistema così come percepito dagli utenti (FE + BE).
* **Versione di Servizio (microservizi + FE)** — `MAJOR.MINOR.PATCH`

  * Ogni microservizio backend e il frontend hanno una **loro** versione tecnica indipendente (per tag, artefatti, rollback).
  * Si usa per tracciabilità e manutenzione puntuale.

> **Fonte di verità Prodotto**: un file `VERSION` nel repo FE (root).
> **Fonte di verità Servizi**: tag Git e/o file `package.json`/`VERSION` in ciascun repo/servizio.
> **Artefatto:** Nel mondo del software, un artefatto è qualunque output generato da un processo di build o di deploy.
In altre parole: è il “prodotto finito” che viene poi distribuito o eseguito.
---

## 2) SemVer in breve (vale per Prodotto e Servizi)

Formato: `MAJOR.MINOR.PATCH`

* **PATCH**: correzioni e miglioramenti **non breaking** (nessun impatto sui contratti o sui flussi utente).
* **MINOR**: **nuove funzionalità retro-compatibili** (aggiunte additive/opt-in, UI o API che non rompono ciò che esiste).
* **MAJOR**: **breaking changes** (modifiche ai contratti API, rimozioni/rename di campi o pannelli, cambi auth/permessi, migrazioni dati incompatibili).

Pre-release (opzionali): `X.Y.Z-alpha.N`, `X.Y.Z-rc.N` per staging/test.
Build metadata (opzionale): `+build.sha` per legare l’artefatto al commit.

---

## 3) Regole pratiche per decidere il bump **del Prodotto (NEX)**

Usa queste domande **in ordine**:

1. **Qualcosa cambia per l’utente?** (UI, flusso, risultato, performance percepibile)

   * **No** → *Nessun bump Prodotto*. Versiona solo il servizio toccato.
   * **Sì** → vai al punto 2.
2. **Il cambiamento rompe o modifica un contratto?** (API, permessi, semantica dati)

   * **Sì** → **MAJOR**
   * **No** → vai al punto 3.
3. **È una correzione/miglioria senza feature nuova?**

   * **Sì** → **PATCH**
   * **No** (aggiungi funzione/pannello/comportamento opzionale) → **MINOR**

### Esempi reali

* **PATCH**

  * Fix conteggi nel comparatore, sistemazione filtri, correzione bug di layout, performance tuning visibile ma senza nuove opzioni.
* **MINOR**

  * Nuovo pannello (es. *Scouting*), nuove colonne o filtri opzionali, campi API aggiuntivi **non obbligatori**, nuove impostazioni UI.
* **MAJOR**

  * Rinomina/rimozione campi API, modifica semantica parametri/response, cambio auth/ruoli, rimozione di un pannello senza sostituto compatibile, migrazioni DB che impattano i flussi.

> **Regola d’oro**: ogni deploy **user-visible** in produzione aumenta la versione di Prodotto almeno a **PATCH**.

---

## 4) Regole per il bump **dei Servizi** (FE + microservizi)

* Ogni servizio segue SemVer in base **al proprio** contratto e responsabilità.
* Linee guida:

  * `fix:` → **PATCH**
  * `feat:` (additivo) → **MINOR**
  * `feat!`, `refactor!`, `perf!` (breaking) → **MAJOR**
* Il **FE** segue SemVer in relazione alle proprie API consumate. Se introduce UI o logiche nuove senza rompere, è **MINOR**; se corregge bug, **PATCH**; se impone nuovi contratti lato BE, coordinare un **MAJOR** con i servizi.

> **Nota**: è possibile rilasciare servizi con bump indipendenti **senza** bump Prodotto quando l’impatto **non è visibile** agli utenti o non cambia i flussi.

---

## 5) Cadenza rilasci

* **PATCH**: secondo necessità (anche più volte a settimana).
* **MINOR**: cadenza regolare (consigliato: ogni 2–4 settimane, giorno/orario fissi).
* **MAJOR**: pianificate (consigliato: 6–12 mesi), con periodo di deprecazione annunciato.

Pre-release su **staging** (`-rc.N`) prima della promozione in produzione.

---

## 6) Compatibilità, deprecazioni e versioni API

* Cambi **additivi** (nuovi campi/endpoint opzionali) → **PATCH/MINOR**.
* **Rimozioni/rename** o cambi semantici → **MAJOR**.
* Gestione deprecazioni:

  1. Introdurre il nuovo comportamento/campo come **opzionale**.
  2. Segnalare la **deprecazione** nella release note e nei log (e.g., header `Deprecation`, warning nei client).
  3. Mantenere **al massimo due versioni API** in parallelo (es. `/api/v1` e `/api/v2`) per una finestra definita (es. 1–2 versioni **MINOR** di Prodotto).
  4. **Rimuovere** nella successiva **MAJOR**.
* **Feature flag**: introdurre funzioni UI/BE dietro flag per attivazione controllata e riduzione del rischio.

---

## 7) Branching, tag e artefatti

Questa sezione spiega in modo semplice come gestiamo i **rami (branch)**, i **tag** e gli **artefatti** del progetto NEX.

### 🔹 Branching

* **Trunk-based leggero** → Significa che lavoriamo quasi sempre sul ramo principale `main`.
  Quando devi fare una modifica o una nuova feature:

  1. Crea un piccolo ramo di lavoro (es. `fix/filtri-documenti` o `feat/nuovo-pannello`)
  2. Fai una Pull Request (PR) su `main`
  3. Dopo la revisione, si unisce (merge) su `main`, che deve sempre poter essere rilasciato in produzione.

* **Release branch** → È un ramo speciale usato per preparare una versione stabile, ad esempio `release/2.6`.
  Si usa per versioni più grandi (MINOR o MAJOR), quando serve testare per qualche giorno prima del rilascio.

In parole semplici: `main` è la versione “viva” del progetto, i branch di feature sono temporanei e le release branch servono solo per versioni importanti.

* **Creazione Branch** → per convenzione seguiremo il seguente flusso in fase di creazione:

  1. Controllo da main la versione attuale nel package.json del servizio attuale (ES. 2.1.0)
  2. Controllo con `git branch -r` a che versione siamo con le modifiche
  3. In fase di creazione in base al tipo di modifica andremò a comporre il nome della branch secondo lo standard → servizio_versione_task/anomalia (per il frontend basta scrivere `v` al posto del nome dekìl servizio). Per la versione scriveremo l'incremento solo in base al tipo di modifica (major/minor/patch) mentre per gli altri numeri scriveremo semplici `x`.
  ESEMPIO:
  - in caso di una piccola patch BE nel servizio product, scriverò: `git checkout -b product_x.x.1_a0132`
  - in caso di creazione di un pannello nuovo FE scriverò: `v_x.4.0_it0111`

  4. Ovviamente la versione è progressiva per ogni servizio. Dunque se per un servizio bisogna fare una modifica minor, bisognerà azzerare il contatore delle patches e così via.

---

### 🔹 Tag Git

Un **tag** è come un’etichetta attaccata a un punto preciso della storia del codice, che indica una versione ufficiale.

* **Tag del prodotto** → Serve per la versione completa di NEX visibile agli utenti.
  Esempio: `nex@v2.5.1`
* **Tag dei servizi** → Serve per versionare i singoli microservizi del backend.
  Esempio: `pricing-svc@v1.3.2`

I tag aiutano a sapere **esattamente quale codice è stato rilasciato** in produzione e permettono di tornare indietro in caso di problemi.

---

### 🔹 Artefatti

Gli **artefatti** sono i file o pacchetti generati dal codice che vengono poi distribuiti o eseguiti in produzione.
In NEX possono essere di due tipi:

* **Frontend:** i file creati dopo il comando `npm run build` (quelli che Nginx serve agli utenti).
* **Backend:** le immagini **Docker** o pacchetti **.zip** dei microservizi.

Ogni artefatto deve avere un **tag di versione** uguale a quello del codice, ad esempio:

```
nex-frontend:v2.5.1
pricing-service:v1.3.2
```

Per ambienti di test (non produzione) si può anche usare il tag `latest`.

In breve: i tag identificano il codice, mentre gli artefatti sono i file o container reali che vengono eseguiti.

---

### 🔹 File `VERSION`

Il file `VERSION` (senza estensione) si trova nel frontend e contiene solo la versione del prodotto, ad esempio:

```
2.5.1
```

Questo file è la **fonte ufficiale** della versione del prodotto e viene letto dal codice per mostrare la versione a schermo e per sincronizzare le release tra frontend e backend.


---

## 8) Changelog & Release Notes

Ogni release di Prodotto deve avere una nota **breve e leggibile** da utenti e manager:

```
# NEX v2.5.1 — 2025-10-05

## Fixed
- Corretto calcolo "Δ Prezzo" nel comparatore.
- Migliorata la reattività dei filtri in Documenti.

## Added
- (N/D per patch)

## Changed
- (N/D per patch)

## Deprecated / Removed / Security
- (se presenti)

Compatibilità: FE v2.5.x — BE compatibile con /api/v1 e /api/v2 (in deprecazione /api/v1, rimozione prevista in v3.0.0).
```

> Le note dei **servizi** possono essere più tecniche (link PR, migrazioni), ma evitare overload nella nota di Prodotto.

---

## 9) Convenzioni commit (per automazione e chiarezza)

Per mantenere coerenza e leggibilità tra tutti i membri del team, NEX utilizza una convenzione di commit semplice ma chiara, chiamata **NEX Commit Convention**.

### Formato generale

```
[TYPE] [SCOPE] messaggio breve in minuscolo
```

Esempi:

```
[FIX] [compare] risolto problema di calcolo percentuale variazione prezzi
[FEAT] [filters] aggiunto filtro per data e azienda nel pannello scouting
[REFACTOR] [orders-api] migliorata gestione cache ordini
[STYLE] [ui] aggiornato layout pulsante esportazione
[CHORE] [deploy] aggiornato script build frontend
```

---

### Struttura del messaggio

| Campo         | Descrizione                                      | Esempio                                                                   |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| **[TYPE]**    | Tipo di modifica effettuata                      | `[FIX]`, `[FEAT]`, `[REFACTOR]`, `[STYLE]`, `[CHORE]`, `[DOCS]`, `[TEST]` |
| **[SCOPE]**   | Area o modulo del progetto toccato               | `[compare]`, `[orders-api]`, `[filters]`, `[auth]`, `[ui]`, `[dashboard]` |
| **Messaggio** | Descrizione breve e chiara, scritta in minuscolo | `corretto errore nel calcolo totale imponibile`                           |

---

### Tipologie principali

| Tag          | Significato                                             | Quando usarlo                                    |
| ------------ | ------------------------------------------------------- | ------------------------------------------------ |
| `[FIX]`      | Correzioni di bug o malfunzionamenti                    | Fix nel comparatore, errori query, glitch UI     |
| `[FEAT]`     | Nuova funzionalità o pannello                           | Nuovo modulo, campo, endpoint, filtro            |
| `[REFACTOR]` | Modifica interna al codice senza cambiare comportamento | Pulizia, ottimizzazione, ristrutturazione logica |
| `[STYLE]`    | Cambi estetici o di formattazione                       | Aggiornamento icone, layout, colori              |
| `[CHORE]`    | Task tecnico o manutentivo                              | Aggiornamento dipendenze, script, CI             |
| `[DOCS]`     | Modifiche alla documentazione                           | README, versioning policy, guide interne         |
| `[TEST]`     | Aggiunta o modifica di test                             | Unit test, integrazione, mock                    |

---

### Linee guida operative

1. **Un commit = un cambiamento logico.** Evita commit enormi e confusi.
2. **Usa verbi chiari e coerenti.** Es.: `corretto`, `aggiunto`, `migliorata`, `rimosso`, `aggiornato`.
3. **Messaggio breve (max ~80 caratteri).**
4. **Aggiungi descrizione estesa se necessario**, ad esempio:

   ```
   [FIX] [compare] corretto errore nel calcolo percentuale
   La variabile delta veniva calcolata prima del rounding finale.
   Aggiunto test unitario di controllo.
   ```
5. **Evita accenti o caratteri speciali** per compatibilità CI/CD.

---

### Mappatura verso il versionamento (per uso futuro con automazione)

Se in futuro verrà introdotta l’automazione (es. semantic-release), il mapping sarà:

* `[FIX]` → incremento **PATCH**
* `[FEAT]` → incremento **MINOR**
* `[FEAT!]` → incremento **MAJOR** (breaking change)

In questo modo il team può continuare a usare lo stile attuale senza cambiare abitudini, mantenendo compatibilità con strumenti automatici di versionamento e changelog.

> Questa convenzione è pensata per essere chiara a tutti i membri del team, inclusi nuovi arrivati, e per garantire consistenza nel tempo.


---

## 10) Procedura di rilascio (checklist)

1. **Verifica tipo di bump** (PATCH/MINOR/MAJOR) con le **domande del punto 3**.
2. Aggiorna (o lascia aggiornare al CI) la versione di **Prodotto** nel file `VERSION` (FE) **se il cambiamento è user-visible**.
3. Tagga i servizi interessati (`service@vA.B.C`).
4. Genera **Release Notes** di Prodotto (sintetiche, orientate all’impatto) e dei servizi (tecniche).
5. Deploy in **staging** (se MINOR/MAJOR: usa `-rc.N`).
6. **Smoke test** end-to-end (FE ↔ BE) con scenari critici.
7. Promozione in **produzione**, verifica post-deploy e monitoraggio.
8. Eventuale **annuncio** interno (canale #nex-release) con highlight e azioni richieste.

**Hotfix**: per bug bloccanti in produzione, apri `hotfix/…`, risolvi, tagga **PATCH**, deploy rapido, back-merge su `main`.

---

## 11) Matrice di compatibilità (esempio)

| Componente      | Versione minima compatibile | Note                                                     |
| --------------- | --------------------------: | -------------------------------------------------------- |
| Frontend (FE)   |                     `2.5.x` | Compatibile con `/api/v1` e `/api/v2` (preferenza `v2`). |
| Orders Service  |                     `1.8.x` | `orderStatus` presente (campo nuovo opzionale).          |
| Pricing Service |                     `1.3.x` | Algoritmo sconti v2 dietro feature flag.                 |

> Mantieni aggiornata la matrice quando introduci dipendenze minime tra componenti.

---

## 12) Rollback e recovery

* Ogni deploy deve poter essere **rollback**-ato al tag precedente (FE e servizi).
* **Migrazioni DB** breaking: progettare **forward-only** + feature flag + *dual write/read* se necessario; in alternativa, mantenere script di **down** testati.
* Monitorare KPI post-deploy (error rate, latenze, log alert) per almeno X minuti.

---

## 13) Onboarding rapido (per nuovi del team)

Questa sezione serve per aiutare le **nuove persone nel team NEX** a capire in modo semplice e pratico come funziona la gestione delle versioni e cosa significano alcuni termini tecnici.

1. **Leggi il file `VERSION` nel repo frontend (FE)**
   Questo file contiene la **versione attuale di NEX** (es. `2.5.1`). È utile per sapere quale versione è in uso e se stai lavorando su qualcosa che sarà parte della prossima release.

2. **Quando apri una Pull Request (PR) o fai un deploy**, chiediti:
   *L’utente aziendale vedrà questo cambiamento?*

   * Se **no** (es. refactor interno, log, test), **non serve cambiare la versione di prodotto**, basta aggiornare quella del servizio.
   * Se **sì** (es. nuova funzione, bugfix, cambiamento visibile), allora aumenta la **versione di prodotto** secondo la regola:

     * Piccolo fix → `PATCH`
     * Nuova funzione → `MINOR`
     * Cambiamento importante o incompatibile → `MAJOR`

3. **Segui le convenzioni dei commit**
   Usa la sintassi `[FIX] [scope] descrizione` per indicare il tipo di modifica.
   Questo aiuta chi legge il codice e in futuro potrà permettere di **automatizzare** la creazione delle release notes.

4. **Cosa sono le API additive e breaking**

   * *Additive*: aggiungi nuovi campi o endpoint ma **non rompi** ciò che già esiste → versione **PATCH** o **MINOR**.
   * *Breaking*: cambi nome, formato o comportamento di qualcosa già usato → **MAJOR**.
     Prima di fare modifiche breaking, parla con il team per pianificare una **deprecazione**, cioè un periodo in cui il vecchio comportamento è ancora supportato.

5. **Cos’è lo staging e cosa sono gli smoke test**

   * **Staging**: è un ambiente di test che **replica la produzione**, ma serve solo per provare nuove versioni prima di renderle disponibili a tutti.
     In pratica, è un NEX “di prova” dove puoi testare tutto senza rischiare di rompere quello usato in azienda.
   * **Smoke test**: è un test veloce per verificare che tutto funzioni dopo il deploy (login, caricamento pannelli, azioni base).
     Serve solo a controllare che non ci siano errori evidenti.

In sintesi:
- Se il cambiamento **è visibile**, aumenta la versione di NEX.
- Se è **interno o invisibile**, aggiorna solo il servizio.
- Testa sempre su **staging** prima di andare in **produzione**.


---

## 14) FAQ

* **Quando NON aumento la versione di Prodotto?**
  Quando il cambiamento è solo interno/tecnico (log, refactor, metriche) e non ha impatto visibile né modifica contratti.

* **Se aggiungo un campo API opzionale usato dal FE?**
  Se il FE in produzione **inizia a usarlo**, aumenta **MINOR** per il Prodotto; il servizio fa **MINOR**. Se il campo esiste ma non è ancora usato, può bastare **PATCH** sul servizio e nessun bump Prodotto.

* **Se rimuovo un endpoint?**
  È breaking → **MAJOR** (servizio **e** Prodotto), con finestra di deprecazione annunciata.

* **Possiamo rilasciare patch ogni giorno?**
  Sì. Le patch servono a mantenere qualità e velocità.

---

### Esempi di decisione

1. *Fix filtro date che saltava in “Documenti”* → **PATCH** Prodotto; **PATCH** FE (se toccato).
2. *Nuovo pannello “Comparazione Listini Fornitori”* → **MINOR** Prodotto; **MINOR** FE; **MINOR** servizi interessati.
3. *Rinomina `status` → `orderStatus` nell’API ordini* → **MAJOR** servizio; **MAJOR** Prodotto; nota di migrazione e finestra di deprecazione.

---

**Responsabile documento**: Team NEX Engineering
**Ultimo aggiornamento**: 2025-10-05