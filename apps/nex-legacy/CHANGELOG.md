# Change Log
    ███████╗ █████╗  █████╗ ██████╗ ███████╗██╗   ██╗
    ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║░░░██║
    █████╗░░██║░░██║██║░░╚═╝██║░░██║█████╗░░╚██╗░██╔╝
    ██╔══╝░░██║░░██║██║░░██╗██║░░██║██╔══╝░░░╚████╔╝░
    ██║░░░░░╚█████╔╝╚█████╔╝██████╔╝███████╗░░╚██╔╝░░
    ╚═╝ ░░░░░╚════╝░░╚════╝░╚═════╝░╚══════╝░░░╚═╝░░ 
     Application Developed by Focelda Developers.



## Dev versione: [1.0.6] 07-01-25
- [FIX] [Notifiche] Risolte alcune problematiche legate al invio e alla ricezione della notifica, ora viene ricevuto solo la notifica e non la lista di tutte le notifiche utente, in piu è stato fix un problema di posizionamento nella ricezione delle notifiche che venivano messe in ultima posizione anziche prime.
- [ADD] [DarkTheme] Aggiunto il salvataggio dell'impostazione tema in modo che anche se la pagina viene re-freshata continua a mantenere il tema precedente.
- [ADJUSTMENTS] [PesiVolumi] Problema relativo alla conversione delle proprietà inserite dall'utente, devono essere esplicitamente numeriche tranne il campo "Ci". Applicate ulteriori regole di limitazione per il calcolo del volume.
- [FIX] [PesiVolumi] Si presentava il problema quando l'utente provava ad inserire un valore che era esempio: 0,0. perche il valore veniva convertita a float e quindi vieniva sovrascritto con 0.
- [EDIT] [obiettivi_stocks] Modificata la query principale per i retrive dei dati con filtri quando visualizza tutti gli articoli con i dettagli annessi.
- [ADD] [FidoCliente] Ora nel overview delle richieste fido fatta dal commerciale c'è la possibilità di aprire dei messaggi sulle tale richieste

- [FIX] [OrdiniFBCNR] Suddivisa la colonna Commerciale, che conteneva dati sia sul cod.Commerciale che sul canale di vendita, ora tali informazioni sono suddivise all'interno delle rispettive colonne
- [FIX] [FidoCliente] [RichiestaFido] Risolto il problema correlato alla richiesta fido multipla con clienti diversi. Succedeva che se si faceva la richiesta fido e si cambiava cliente, rifacendo nuovamente la richiesta fido, veniva inviata con i dettagli del fido precedente. Risolto resettando il componente/pannello della richiesta, permettendo al pannello stesso di accedere alle info solo quando si apre nuovamente.

- [ADD] [DriveMarche] Inserita condizione di allert per il corpo email vuoto, durante l'invio email con allegati.
- [FIX] [Pesi&Volumi] All'interno delle caselle di inserimento dati, ora verrà vista solo ed esclusivamente la virgola a livello visivo, nel codice verrà gestito tutto con il ".", per far si che il backside lo percepisca come numero in maniera corretta.
- [FIX] [Notifiche] Ora gli utenti admin/dev vedono di nuovo esclusivamente il pulsante di invio notifiche.

## Dev versione: [1.0.5] 12-12-24
- [ADD] [Chat] Negli ultimi aggiornamenti del sistema di chat, sono state introdotte diverse nuove funzionalità e miglioramenti, oltre alla risoluzione di un bug critico per garantire una migliore esperienza utente.

1. Caricamento e anteprima delle immagini
Una delle principali novità è l'introduzione della visualizzazione in anteprima per le immagini caricate dagli utenti. Ora, quando un'immagine viene caricata nella chat, questa viene immediatamente mostrata in formato di anteprima, rendendo l'interazione più fluida e intuitiva. Questa funzionalità permette agli utenti di verificare visivamente i contenuti caricati, migliorando sia l'estetica che l'usabilità della chat.

2. Nuovo sistema di caricamento file tramite Drag & Drop
È stato implementato un sistema avanzato per il caricamento dei file che consente agli utenti di allegare i file semplicemente trascinandoli nella finestra della chat. Questo approccio semplifica enormemente l'operazione di caricamento, specialmente per gli utenti meno esperti. Per garantire la sicurezza e la stabilità del sistema, sono state introdotte delle restrizioni sulla tipologia di file consentiti, evitando così potenziali problematiche legate a file non supportati.

3. Risoluzione di un bug nel caricamento/scaricamento file
Un problema rilevante è stato individuato e risolto: in alcune situazioni, gli utenti che caricavano un file non erano in grado di scaricarlo immediatamente, a meno che non aggiornassero la pagina o ricaricassero il componente della chat. Questo bug è stato completamente eliminato grazie a un miglioramento nella gestione dei file caricati, assicurando che ogni file allegato sia immediatamente scaricabile senza interruzioni o azioni aggiuntive da parte dell'utente.

4. Un'importante miglioria riguarda l’implementazione di stati di caricamento dettagliati, visibili durante le interazioni con i file. Ora il sistema informa l’utente in tempo reale sullo stato del processo, mostrando notifiche o indicatori come:

In caricamento: Il file è in fase di caricamento sul server.
Caricamento completato: Il file è stato caricato con successo.
Errore: In caso di problemi durante il caricamento, viene visualizzato un messaggio chiaro e comprensibile.
Pronto per il download: Una notifica avvisa quando il file è disponibile per essere scaricato.
Ed altri.

- [ADD] [Notification] Inserita la possibilità di visualizzare o cancellare tutte le notifiche presenti all'interno dell'account utente, in modo da agevolare tali operazioni se necessario.
- [ADD] [TableVirtualized] Aggiunte delle modifiche riguardanti la possibilità di style nel retriveElement.
- [FIX] [Dashboard] Modificati gli url nella dashboard per i collegamenti al comparatore.
- [ADD] [Chat] Introduzione delle chat private: ora gli utenti possono creare conversazioni private per comunicare in modo sicuro e riservato con altri membri della piattaforma. Questa funzione consente di interagire liberamente, senza che le comunicazioni siano visibili ad altri utenti, migliorando l’esperienza complessiva di comunicazione. La creazione di chat private permette di gestire in modo più flessibile e confidenziale le interazioni, facilitando collaborazioni e discussioni dirette. nel sistema inoltre sono state inseriti svariati fasi di caricamento per comunicare in maniera chiara il load di un evento.

## Dev versione: [1.0.2] 01-12-24
- [FIX] [Notifiche] [Invio] Era presente un errore nella sanificazione del testo, che non permetteva l'invio delle notifiche in maniera corretta se venivano utilizzati caratteri come '.' o ',', per questo motivo è stato momentaneamente disabilitato come controllo. 
- [NEW] [DocumentiPDF] Ora anche gli utenti Buyers potranno vedere e utilizzare il pannello senza nessuna limitazione sui clienti e sui documenti.
- [NEW] [global] Per gli agenti è stato dato un sort per nome e cognome, in modo tale da permettere un ordinamento piu concreto all'interno dei vari filtri.
- [FIX] [fido] Era prensete un problema relativo ai clienti privati come il cliente 'Covella Simone', non avendo la partita IVA andava il sistema non lo percepiva come cliente effettivo e quindi bloccava subito la richiesta. E' stato modificato tutto il processo logico per permettere a tali utenti di mostrare comunque il profilo cliente, con i dati al minimo, in modo tale da fare una richiesta fido.

- [FIX] [Amministazione] [user_management] Risolto il problema relativo alla ricerca utente, che dava alcune volte red screen, inoltre risolto il problema quando si cerca di cambiare i permessi ad un account che non ha ruolo, è stata inserita una limitazione per emitare problemi con la logica stessa del pannello.
- [FIX] [Login] Aggiunta casistica dove l'account è presente ma non è presente il ruolo, con relativo messaggio di avvertimento di tale problema all'utente stesso.
- [FIX] [General] Cambiamenti generali per evitare l'apparizione della enqueueSnackbar quando l'utente cambia pannelli. Nel momento in cui l'utente entra nel pannello viene fatta una o piu chiamate fetch per il retrive delle informazioni/dati di tale pannello, e switchando tra un pannello e l'altro entra in gioco l'abort della chiamata il che genera la call della enqueueSnackbar che prima non gestiva l'abortController su ogni singola chiamata.

- [FIX] [gestione_fido] Utilizzata la stessa funzione per la generazione dei colori e acronimi degli avatar in overview, in modo da mantenere la coerenza generale.
- [FIX] [Notifiche] Risolto un problema con la gestione delle notifiche che si verificava in specifiche situazioni:
Quando un utente presentava la richiesta di sblocco ordini, la notifica di risposta risultava priva di due proprietà, apparentemente non influenti, che però causavano problemi nell'elaborazione delle email. Risolto un problema di duplicazione dei documenti all'interno della collection `notifications`. Il sistema non riconosceva documenti già esistenti, nonostante fossero identici in proprietà e valori, causando una duplicazione indesiderata.

- [NEW] [ADD] [Sblocco_ordini] Aggiunta l'integrazione con il chat block system. Ora sarà possibile chattare con il commerciale che ha fatto la richiesta, simile come in gestione fido, ma con la differenza che anche il commerciale in questo caso potra inizializzare la chat block.
- [NEW] [ADD] [Sblocco_ordini] Ora il commerciale potrà inviare piu ordini fb nella stessa richiesta di sblocco ordini.
- [NEW] [Style] [General] Bilanciamento dei colori per la gestione_fido, e sblocco_ordini, sia per la modalità darkMode che non.
- [FIX] [gestione_fido] Risolto il problema della modalità editMode per il fido richiesto quando è ancora in collapse.
- [ADD] [routine] [users] Modificata la logica di importazione degli utenti, prima c'era solo un controllo di esistenza email all'interno della collection, se non esisteva l'account veniva generato e inserito, ora è stato implementato il processo logico per definire un aggiornamento generale dell'account, piu nello specifico per i magazzini di riferimento per i vari utenti commerciali, quindi se l'account esiste ma presenta un magazzino di riferimento diverso allora, lo aggiorna.
- [ADD] [Gestione_fido] Aggiunto nel header, in filter bar, la possibilità di vedere il totale € di fido richiesto e il numero dei risultati attualmente caricati.

- [ADD] [Gestione_fido] Modificata la visualizzazione della data di richiesta, ora sia nell'elemento che nei dettagli che nella chrono degli eventi la data della richiesta è in maniera esplicità, esempio: "Giovedì 8 Febbraio 2024 alle 11:22", definendo giorno, mese, anno, e ora

- [FIX] [Sblocco_ordini] Sembra che ci fosse un problema relativo alla gestione dei vari sblocchi, se il cliente già aveva fatto una richiesta di sblocco. questo problema era dovuto al fatto che sulla ricerca del updateOne c'era solo codiceCliente = codiceCliente, aggiornando sempre lo stesso document. E' stato aggiunto oltre al codice cliente anche la data di creazione del document per far si che venga preso proprio quel document nello specifico.
- [ADD] [Chat] Introduzione del nuovo sistema chat a blocchi, il sistema utilizza il websocket per avere i messaggi in tempo reale tra due utenti. Cliccando sulle richieste fido attualmente aperte si potrà interagire con il commerciale che ha fatto la richiesta fido, nel momento in cui termina la richiesta fido, si avrà comunque la possibilità di visualizzare le chat avvenuto. Le funzionalità Generali sono molteplici, una di queste è la possibilità di inviare e scaricare gli allegati tra utenti nei vari blocchi, un altra funzionalità è quella del vedere se l'utente ha visualizzato il messaggio in tempo reale, suoni di quando arrivano le notifhce, possibilità di inviare emoji e molto altro ancora.


## Dev versione: [1.0.1] 04-11-24
- [FIX] [sblocco_ordini] Modificata la query per il retrive dei dati. nel servizio orders è stata aumentata la soglia di peso del JSON per quando il server riceve il payload
- [Style] [notifications] Modificata la dimensione della finestra delle notifiche per mantenere una certa proporzione di grandezza coerente con quella della futura chat.
- [FIX] [ADD] [fido_cliente] Risolto il problema sul controllo effettivo dei parametri con (*) nella richiesta effettivo, parametri che inizialmente dovevano essere obbligatori ma per via del bug non lo erano, inoltre sono state modificate le domanda che dovrebbero essere obbligatorie.
- [ADD] [sblocco_ordini] aggiunto un blocco quando il totale ordine è uguale a zero.
- [FIX] [sblocco_ordini] Il problema si presentava quando un utente inseriva il codice FB correlato ad un cliente che avava il codice IOT non presente, e con il codice strutturato generava un errore, il problema è stato gestito correttamente, inoltre sono state implementate funzioni ulteriori di controllo del codice, per evitare problemi sul invio di codici nulli, gestendo in maniera efficiente il catch degli errori, è stato implementato inoltre uno stato di loading sul button per evitare spam di richieste.

- [ADD] [fido_cliente] E' stata aggiunta la parte dedicata all comunicare all'utente se quel fido cliente è già in fase di elaborazione/attesa o se è stato mai rifiutato, in base alla casistica bloccherà l'apertura del pannello richiesta fido cliente, in modo tale da evitare molteplici richieste fido quando tale fido è gia stato richiesto ed è in fase di elaborazione/attesa, inoltre è stato aggiunto un ulteriore button per tornare alla ricerca del cliente base cioè quella con il form centrale grande.
- [FIX] [products] [compare] Fix per il sanitize della marca quando componi i filtri nel backside, in modo tale da permettere i valori con la /, come la marcha ROLINE/VALUE.

- [ADD] [sblocco_ordini] Aggiunta la ricezione delle notifiche sulla modifica degli stati delle richieste di sblocco per gli ordini, ora il commerciale riceverà una notifica se lo stato delle richieste fatte viene cambiata dall'amministrativo.
- [ADD] [sblocco_ordini] Inserita la possibilit per i commerciali di vedere i commenti se presenti lasciati dall'utente o dal amministrativo.
- [FIX] [sblocco_ordini] ribilanciamento del Offset.
- [FIX] [gestione_fido] Risolto un problema che si è presentato nel momento in cui veniva rifiutato il fido richiesto, andava in errore per via di una mancata presenza in quella determinata condizione del indexSelected, inoltre sono state settate di default solo gli elementi in Attesa o in Lavorazione.
- [ADD] [sblocco_ordini] Aggiunto il totale euro degli ordini fatti, e il numero effettivo di elementi trovati nella ricerca.
- [EDIT] [ins_of_fb] [Tesis] Applicate modifiche come da richiesta, cambio nome da "descrizione" a "richiesta", inserimento di un placeholder nella richiesta, e reso come campo obbligatorio.
- [ADD] [Chat] Inizializzata un UI per il nuovo sistema di Chat che si trova in fase attualmente di sviluppo.
- [FIX] [sblocco_ordini] ulteriori modifiche applicate al pannello di sblocco ordini per far si che quando carica la prima volta faccia il retrive di default delle richieste in attesa, modifiche inoltre fatte sulla grandezza della tabella per renderla a schermo, e altri fix generali.

- [FIX] [ADD] [sblocco_ordini] Aggiunta tutta la parte dell'infinite scroll relativa agli elementi in tabella, cosi che gli utenti possano visualizzare correttamente i dati, inoltre sono stati aggiunti diversi fix di relativi bug, ed è stata ggiunto un filtraggio sui clienti per evitare sdoppiamenti ri Ragione Sociale.
- [FIX] [sblocco_ordini] Presenti alcuni problemi nei parametri per i filtri, sia per il range di date che per i clienti, la condizione di inclosura del cliente nei parametri non era presente, sia su lato front che back, per quanto riguarda il range di date, veniva gestito in maniera sbagliata sul backside, i parametri si auto-sovrascrivevano a vicenda il che non permetteva di prenderli entrambi correttamente.
- [FIX] [Drive] E' stato corretto il problema della mail quando si apriva il pannello la prima volta non veniva presa la mail del cliente.
- [FIX] [REMOVED] rimosso anagraficaClienti da permission.js (dalla side-navBar)

## Dev versione: [1.0.0] 09-09-24
- [NEW] [ADD] Cambiato UI/UX al reset password component di default e al welcome password reset, sono state aggiunte diverse impostazioni e modifiche, tra cui, controllo se esiste l'account prima di inviare l'email, countdown per l'invio dell'email se è stata già inviata, sono state fatte modifiche inoltre per ottimizzare il codice e aggiornarlo siccome era rimasto alla versione vecchia.
- [FIX] [Pagamenti] Risolto il problema relativo ad ogni commerciale vedeva i pagamenti anche degli altri, inoltre sono state apportate delle modifiche per admin, ora utilizza la lista clienti globale, quindi è stato ottimizzato e aggiornato il codice front/back sistemando anche imperfezioni tabellari/barra dei filtri, aggiugendo inoltre stati di caricamento.
- [FIX] [Stocks] [FB] [CNR] Sono stati applicati svariati fix per entrambi i pannelli tra cui il loading della tabella, filtro commerciali per admin ristrutturato, ed è stato corretto il problema che se eri un commerciali vedi comunque tutti i gli elementi non solo i tuoi.
- [ADD] [WelcomeResetPassword] E' stato implementato un nuovo stadio intermedio per le persone che entrano per la prima volta su nex, permettendo loro di resettare in maniera obbligatoria la loro password se non sono mai entrati, il pannello è composto in diversi fasi come il classico reset della password ma presenta uno stile grafico piu elaborato, con una ristrutturazione del codice completa, che dà beneficio sia dal punto di vista visivo che dal punto di vista ottimizzazione.

- [FIX] [Comparatore] Risolto il problema relativo all'info, per via dei cambiamenti passati alle proprietà, l'info nella colonna prezzo aveva smesso di mostrare il prezzo totale, la sia, la raee ed altre informazioni. il tutto è stato fix, facendolo tornare operativo.
- [FIX] [Notifiche] Risolto il problema relativo al impossibilità nel cancellare le notifiche, dovuta ad un passaggio di props sbagliato.
- [NEW] [Contribuzione] Aggiunta del campo di input per il codice della contribuzione quando viene rischiesto di scaricare il BOIMP
- [ADD] [config_fornitori] Aggiunti due flag sul configuratore quando si stanno per inserire i fornitori o modificare quest'ultimi,
ogni fornitore deve avere la possibilità di poter aggiungere due nuovi flag:
1) rimani disabilitato cioè nonostante hai configurato il prezzo deve rimanere in grigio.
2) nascondi prezzo, quindi mostrerà solo la disponibiltà nonostante sia stato configurato il fornitore.
- [ADD] [products] se c'è una promo focelda che è diversa da tipo B (Brand) e le disponibilità sono uguali a 0, il prezzo (focelda) del prodotto viene nascosto.
- [ADD] [config_obiettivi_commeficali] gli elementi vengono filtrati in base alle combinazioni di agents-chVendita non presenti negli array, lista dei commerciali e canali di vendita, all'interno non devono essere disponibili le stesse combinazioni di elementi già inseriti, esempio se è già stato inserito DPA con ch.Vendita WEB a quel punto quando si selezionerà DPA, WEB non dovrà essere disponibile e viceversa.
- [ADD] [pesi&volumi] è stata eliminata la possibilità di andare in negativo sui campi di input di inserimento delle configurazioni peso-volume, inserite le unità di misura sopra nei label di tali input cm, cm, cm, kg. Aggiunto inoltre il codice produttore prima della descrizione articolo quando si fa la "ricerca per cod.articolo". E' stato dato un max length su tutte e 4 gli inputbox in modo da non superare la lunghezza dei numeri interi e decimali. seguendo la struttura già definita della lunghezza in tabella.

CDAR	Codice articolo	    6	
LALTE	Altezza	            6	2
LLUNG	Lunghezza	        6	2
LPROF	Profondità	        6	2

PESO	Peso in Kg.	        7	3
VOLUM	Volume in m³	    7	3 (i 2 numeri sono i decimali)

- [ADD] [contribuzione] inserito numero promo all'interno di contribuzione quando è il prodotto (blocco) è in promo.

- [FIX] [config_obiettivi_commerciali] 'Altro' è stato sviluppato in maniera corretta, il valore dei vari Q. cambierà in base all'inserimento o alla rimozione delle combinazioni commerciale-ch.vendita, inoltre sono stati aggiunti dei controlli sull'inserimento dei valori quarter quando tenta di inserire una nuova combinazione commerciale-ch.vendita, inoltre ora quando inserisce una nuova linea la ricerca direttamente.

- [CHANGE][config_obiettivi_commerciali] Ora è possibile inserire piu commerciali con diversi canali di vendita, bloccando pero l'inserimento di elementi già presenti nella configurazione
- [FIX] [Compare] Codice Promo dava problemi con i risultati e con la ricerca, modificata l'altezza della tabella per far si che prenda tutto lo schermo, aggiunta del uppercase e fix aggiuntivo per quanto riguarda la schermata no products was found.
- [ADD] [config_obiettivi_commerciali] Stato dei caricamenti, spostamento delle linee da uno stato ad un altro quando vengono inserite, fix sui colori per la dark-mode, altri fix generali
- [UPDATE] [NEW] [config_obiettivi_commerciali] Aggiornamento generale e continuo delle sviluppo, situazione generale: si è iniziata a correlare le parti front/back side, interegendo con mariaDB.
- [FIX] [UploadCSV] sono stati fix ulteriori problemi all'interno dello script, come ad esempio il fatto che sanificava e toglieva parti di stringhe, come il codice del prodotto.
- [FIX] [Contribuzione] E' stato fatto un fix sulla contribuzione quando veniva fatta la ricerca dei prodotti impersonificando un buyer, filtrando gli elementi inzialmente per i fornitori attualmente attivi, cosa che prima saltava. Cio portava a un miss-match del totale dei risultati quando si modificava il filtro dei fornitori attivi.
- [FIX] [GestioneUtenti] Sono stati risolti vari problemi per la creazione dell'account tramite pannello.

- [FIX] [Comparatore] [UploadCSV] C'era un problema relativo all posizionamento delle colonne e dei valori che venivano sballati, è stato corretto, ottimizzando ulteriormente le tempistiche di risposta. Inoltre è stata fix il problema dei prodotti con il codArt che presentavano meno caratteri di 6.
- [ADD] [Pesi&Volumi] Ora la ricerca del prodotto avviene a prescindere se è presente o meno nella tabella dei pesi&volumi, in modo tale da rimandare indietro i dettagli del prodotto attualmente ricercato.
- [ADD] [General] Aggiunte e miglioramenti generisci ai vari components richiamati nelle varie tabelle.
- [FIX] [Compare] [UploadCSV] E' stata cambiata la logica di script per l'upload nel comparatore, cio significa che è stato ridotto il numero di righe scritte ottimizzando il codice in alcuni punti, raggiungendo ad ottenere un miglioramento delle tempistiche di risposta del 33%.
- [FIX] [ADD] [Pesi&Volumi] sono stati fix alcuni problemi relativi all'inserimento di un nuovo elemento, sono stati aggiunti nuove colonne e la descrizione quando si fa la ricerca del prodotto pre-inserimento.
- [SVILUPPO] [config_obiettivi_commerciali] E' in stato di avanzamento il nuovo pannello di configurazione obiettivi per i commerciali.

- [FIX] [FB] [FBCNR] Fix per il retrive dei dati che non caricava i dati in tabella portando errore.
- [ADD] [Fido_client] Ribilanciamento dei colori per il pannello dei clienti, inoltre è stato bilanciato anche la richiesta fido per il tema dark, e anche il pannello in questione è stato convertito con la nuova Snackbar.
- [ADD] [ordiniFB] [ordiniFBCNR] [sbloccoOrdini] il sistema generale di notifiche su questi pannelli è stato aggiornato, [ X ] openErrorSB ==> [ V ] enqueueMessage del nuovo sistema di Snackbar.
- [ADD] [FIX] [obiettivi_stocks] Quando veniva fatta la prima chiamata per visualizzare i raggruppamenti, non riusciva a prendere in tempo il confg dei Dati sui ragruppamenti, dovuta all'async degli stati, inoltre l'assegnazione dei parametri quorters gruppi cioè q1_gr, q2_gr ecc.. veniva fatta solo in una determinata condizione, il che è sbagliato siccome i valori gruppo devono essere presenti su tutti gli elementi. E' stato aggiornanto anche il sistema generale di notifiche su questo pannello, [ X ] openErrorSB ==> [ V ] enqueueMessage del nuovo sistema di Snackbar.
- [FIX] [Configuratore] [obiettivi_stocks] Risolti alcuni bug relativi al sort per Marca e Buyer che generavano errore.
- [FIX] [Route] [Configuratore] [obiettivi_stocks] E' stata aggiornato l'url e la chiave di confg_obiettivi_stocks per evitare problemi con l'omonima route obiettivi_stocks.

- [FIX] [pesiVolumi] Conversione della colonna data da ibm a data leggibile, e fix del sort sulla colonna data.
- [FIX] [pesiVolumi] Risultavano esserci problemi relativi all'inserimento degli elementi all'interno dello stato cronologia, quando venivano inseriti piu elementi, i valori venivano scambiati. Inoltre ora è possibile inserire . all'interno della dei parametri da compilare. E' stato introdotto anche la funzionalità di Snackbar.
- [ADD] [Globals] Aggiunta la lista dei listini all'interno dello stato globale.
- [FIX] [Logs_prodotti] Problema relativo al sort delle colonne, problema dovuto alla macanza del parametro sortType. Inoltre è stato aggiunto il select per i vari Listini.
- [FIX] [Contribuzione] [Export] E'stato fatto un ribilanciamento dei colori per il pannello di esportazione dei BOIMP che rendeva difficile da capire se il bottone fosse attivo o meno.
- [FIX] [Contribuzione] [Export] il problema era dovuto alla mancata presenza di data: [..] all'interno della risposta della funzione checkBoimpExport, e inoltre per il mancato riconoscimento della funzione createExcel.
- [ADD] [MessageBox] [Snackbar] E' stato creato un sistema generale di gestione dei vari message box (messaggi in basso a destra), prima i box venivano inizializzati su ogni singolo pannello insieme ai 3/4 stati che settavano i parametri del messaggio && 2 funzioni di apertura e chiusura del box. cio rendeva impossibile avere piu messaggi contemporaneamente e si necessitava dichiararli su ogni singolo pannello e passando le props della funzione di apertura si riusciva a far mostrare il pannello. [NEW] Ora c'è un sistema globale provider che permette tramite un richiamo di funzione, di inserire il messaggio nella enqueue, in modo tale da far visualizzare piu messaggi alla volta (parametro di default settato su 4). Evitando cosi di dichiarare funzioni e componenti ulteriori nei vari pannelli. Inoltre è stata rivista la grafica del pannello rendendola piu stondata cambiando anche la struttura interna della posizione degli elementi.

- [ADD] [GestioneFido] Aggiunta la possibilità di scaricare un Excel contenente gli indicatori di tutti i clienti
- [ADD] [TableVirtualized] aggiunta la possibilità di fare l'infinite scroll all'interno delle varie tabelle.
- [NEW] [ADD] [Administrations] [logs_prodotti] Creato un nuovo pannello con API, dedicato alla visione delle variazioni prezzo dei vari prodotti fatti dai buyers.
- [NEW] [ADD] [obiettivi_stocks] Ora se il ruolo utente è admin o dev non verrà piu fatta la ricerca dei dati base ma verrà aperto di default il pannello dei filtri per fare ricerche personalizzate, inoltre la logica per la ricerca degli elementi con raggruppamenti è stata spostata perche non avendo piu accesso a tutti i dati, i re-group deve venir fatto in base allo stato e sui dati che provengono dal back-end.
- [FIX] [Configuratore] [Fornitori] E' stato fix il problema che riguardava il mantenere i valori dei fornitori una volta inserita la configurazione o modificata una già esistente, inoltre è stato aggiunto un nuovo pulsante per l'eliminazione dei campi all'interno della colonna.
- [FIX] [Compare] Risolto il problema del colore quando si fa la ricerca di un prodotto.
- [FIX] [ObiettiviStocks] [CheckAdminPermissions] Risolto il problema correlato al non poter piu visualizzare i buyers per via del ruolo passato sbagliato.
- [FIX] [DocumentiPDF] Risolti vari problemi correlati al servizio drive riguardandi la key del nome del pannello che non permetteva una corretta ricerca dei clienti, inoltre è stato fix un problema grafico quando l'utente apriva il pdf da visualizzare.

- [ADD] Aggiunta la notifica per gli amministrativi quando un utente commerciale esegue una richiesta fido, quindi è stata creata la logica aggiuntiva per inviare notifiche agli utenti di un determinato ruolo, disponibile anche quando vengono inviate le notifiche manualmente, inoltre è stato fatto un ribilanciamento dei colori per la ricesca dei fidi cliente e per il pannellino laterlae delle richieste fido fatte dall'utente.
- [ADD] Aggiunti nuove colonne per obiettivi stock sia sulla dashboard che sul pannello di riferimento: fatturatoTrimestreAttualeNew, fatturatoTrimestrePrecedenteNew, ocfb
- [ADD] Aggiunta del colore bianco sulla sidenavbar per il tema dark,  quando un menu è selezionato
- [Palette] [Color] E' stato bilanciato al livello dei colori per il tema Scuro, il pannello delle notifiche

- [FIX] [ADD] Ora gli esiti fido verranno inviati tramite notifica ai commerciali che hanno fatto tale richiesta
- [ADD] [Comparatore] Il Filtro codice Promo non prende in considerazione il filtro delle disponibilità dei prodotti
- [ADD] [Comparatore] Ora il colore del box Prezzo tiene conto anche delle disponibilità dei vari fornitori.
- [FIX] checkAdminPermission mandava in errore se l'oggetto dei permessi era presente ma senza la relativa proprietà
- [NEW] E' stata fatta un ristrutturazione generale relativa a tutti i servizi. Ora ogni servizio utilizza connessioni, richiami di funzioni ecc.. relativi alle ultimi versioni di tale elementi. Il servizio di auth è stato ristrutturato completamente ed è stato inoltrato una nuova metodologia di log-in attraverso utilizzo di crypt/decrypt di dati. La collection degli utenti insieme a quelli dei ruoli sono state cambiate le proprietà in italiano per avere una congruenza allo stile generale dei nomi delle nuove collections.
(Il front è stato riadattato di conseguenza).

## Dev versione: [0.5.4] 02-07-24
- [ADD] [obiettivi_stocks] Modificato il sistema logico del pannello obiettivi_stocks, ora la logica di raggruppamento viene fatta tramite front-side, in modo da essere piu responsivo. Inoltre ora avvengono diversi raggruppamenti e somme per ridare i valori in base alla linea-categoria-gruppo.
    da caricare:    - components/Virtualized/grid/tag
                    - components/Virtualized/table/retriveElements && index.tsx
                    - layouts/stocks/targetStocks
                    - src/routes.js
                    - src/App.css
[CARICATO] - [ADD] [Route] Abilitata la route ocf_logs per gli admin

[CARICATO] - [ADD] [GestioneFido] Ora è presente una cronolgia che tiene conto dei cambi di stato e delle variazioni fido per ogni richiesta, per permettere una futura statistica per la gestione interna dei fidi migliorata.
- [ADD] [sblocco_ordini] E' Stato creato il pannello per la gestione e la creazione di richiesta sblocco fb per extra fido. la funzionalità è in base all'utente attualmente loggato, cioè puo assumere due funzionalità, [1°] Permette di gestire le richieste filtrandole attraverso una barra dei filtri inoltre permette di vedere le richieste nel dettaglio con tutti i blocchi che normalmente vede l'utente (fatta eccezzione per i commenti), cioè fatturati del cliente, la spesa totale del Ordine FB ecc..  [2°] Permette di fare la richiesta tramite l'inserimento del N°FB, al quale ti darà accesso al ordine e alla possibilità di inviare una richiesta di sblocco ordine per l'extra fido, inoltre l'utente avrà la possibilità di vedere la chrono delle richieste fatte filtrandole per diversi parametri.
- [FIX] [config_fornitori_products] Modificata la condizione di query per l'aggregazione delle tabelle in modo da fixare il problema relativo al non mostrare correttamente chi non è stato configurato sulla tabella disponibile ai commerciali.
- [ADD] [config_fornitori_products] Ora è possibile modificare o inserire il Raggruppamento per ogni configurazione già presente all'interno della tabella.

- [FIX] [config_fornitori_products] E' stato corretto il bug che impediva l'inserimento di prodotti quando veniva selezionato il codice Raggruppamento.
- [FIX] [config_obiettivi_stocks] Alcune categorie e sottocategorie non erano presenti all'interno dei select box per via di Errori presenti nel back-end sulla logica di cicli di correlazione tra i due DB per evitare doppi inserimenti.
- [FIX] [Contribuzione] [1°] Il problema presentato riguardava il non aggiornarsi del fido residuo count in alto quando venivano applicati filtri, tale problema ha comportato il cambiamento di diverse logiche interne per evitare re-call eccessivi di funzioni, il tutto per gestire la seguente problematica, tali modifiche hanno necessitato l'intervento su piu funzioni per tornare ad avere un corretto funzionamento generale. [2°] il secondo problema posto era che la funzionalità di ricerca dei prodotti aveva un malfunzionamento quando venivano inserite categorie e brand. Il problema era dovuto al mancata chiave di collegamento nella chiamata fetch per separare i parametri '&'. [3°] Tali modifiche hanno permesso di risalire ad un ulteriore BUG, quando venivano inserite le contribuzioni, modificato il prezzo nel blocco e veniva cambiata la contribuzione sul singolo prodotto, a quel punto la contribuzione si ri-azzerava portando la contribuzione euro a quella base dimenticandosi del prezzo cambiato. [4°] il filtro Qnt.Min anche se non portava nessun errore a livello visivo generava malfunzionamenti interni dovute al richiamo di una funzione non esistente.
RIASSUNTO: Il codice è stato ottimizzato evitando inutili re-render e re-call di funzioni e sono stati fix i BUG elecanti in precedenza.

- [ADD] [RichiesteSbloccoFb] Creato un nuovo sistema che permette la richiesta di sblocco di un determinato OrdineFB da parte del commerciale, e la gestione di tali richieste da parte degli amministrativi/admin con possibilità di rifiuto o accettazione di tale richiesta, il tutto gestito all'interno di un unica route/panello.
[CARICATO] - [FIX] [Fido] [CustomersProfile] Fixato il problema dovuto alla struttura per accedere al codice IOT che impediva la chiamata per i fatturati, inoltre è stato fixato a livello stilistico la barra di ricerca quando si è sul profilo cliente e un bug di ricerca dovuto al controllo del ID nel url per la ricerca dinamica tramite url.
[CARICATO] - [FIX] [Compare] [SmartSearch] Ora quando viene fatta una ricerca insieme alla stringa ricercata viene inviato anche il token per motivi di sicurezza.
- [FIX] [utils/checkAdminPermissions] Ora la funzione accetta un parametro aggiuntivo che permette di definire i target ruoli per far tornare la funzione True, quindi permette di indentificare sia nei permessi che nei ruoli se l'utente è Admin o Dev ad esempio.
[CARICATO] - [FIX] [ADD] [PesiVolumi] Sono stati risolti i vari problemi presenti con il cambio dei nomi delle proprietà, inoltre è stato aggiunto la nuova TAB Variazioni.
- [FIX] [Contribuzione] Quando il margine cambia e c'è una contribuzione selezionata allora a quel punto ricalcola le contribuzioni (solo per i blocchi che ne hanno una e solo quelle che sono state settate dal sistema) basandosi sul margine attualmente inserito.
[CARICATO] - [ADD] [GestioneRichiesteFido] Ora all'interno del pannello è presenta una barra di ricerca con diversi parametri che filtra e ricerca tutte le richieste fido.

## Dev versione: [0.5.3] 25-06-24
- [FIX] [Comapre] Il pannello ora presenta una struttura per la gestione dei dati e delle chiamate in maniera diversa, in modo tale da avere maggiore fluidità nel interagire con l'applicativo stesso, inoltre il pannello dei filtri è stato spostato da global a interno quindi potrà essere richiamato solo sul compare a differenza di prima nella quale c'erano diverse condizioni per evitare che veniva richiamato fuori. lo stile grafico dei filtri inoltre è stato cambiato per permettere una migliore esperienza utente. E' stato inoltrato una maggiore compresione dei caricamenti generali introducendo lo skeleton per gli elementi in fase di caricamento.

- [FIX] [Comapre] E'stato fixato il sort per gli elemnti nel menu, nello specifico per la proprietà multiplay e disponibilità ora il sort per la tipologia numerica e multiplay accetta anche la parent key in modo da accedere alla proprietà anche se è innestata.
- [FIX] [GestioneUtenti] Risolto il problema relativo al Ban Utente, quando si faceva la ricerca e si provava a disattivare l'utente, l'utente disattivato era quello sbagliato. 
- [ADD] E' stata introdotto un nuovo status per utente: "Assente" che definisce quando l'utente non compie nessun tipo di azione all'interno dell'applicativo per TOT minuti, ciò permette di capire quale utente è in stato di AFK sul gestionale Utenti. inoltre è stata introdotta la funzionalità che permette un logout forced per evitare che l'utente occupi rete.
- [ADD] [Configuratore] [ObiettiviStock] Aggiunta la nuova funzionalità di ricerca, permettendo di trovare gli elementi in base al buyer selezionato. Inseriti ulteriori stati di caricamento in modo tale da definire e dichiarare all'utente cosa sta facendo il browser in quel momento, se è in fase di caricamento o meno.
- [FIX] [Configuratore] [ObiettiviStock] Ora gli elementi nella lista di selezione cat-marca-sottocat. vengono escluse in automatico in base a se la cat-martca-sottcat. è già present in tabella.
- [FIX] [Compare] E' stato risolto il problema relativo all'export CSV, ora prende in considerazione correttamente i dist attivi. Il metodo di trasmissione del dato è stato cambiato, ora genera il file direttamente da frontSide, non appena gli vengono passati i dati formatti.
- [ADD] [Configuratore] [ObiettiviStock] E' stato realizzato un pannello che permette agli admin di configurare buyer-marca-categ.-sottocat. in modo da prefissare degli obiettivi di vendita per i buyer. E' stata realizzata sia frontSide che backSide con integrazione a mariaDB come riferimento per la storicizzazione dei dati.
- [ADD] [Contribuzione] Sviluppato un riadattamento al utilizzo del pannello che in principio era dedicato solo alla lista dei fornitori, ora è multifunzione, ospita anche la lista delle contribuzioni già attive su quel blocco. Inoltre la grandezza dei blocchi è stata cambiata per consentire l'inserimento anche di quest ultima informazione a video. La predisposizioni delle informazioni sul aspetto tabellare è stato cambiato permettendo alle informazioni di essere mostrate in maniera da non dare problemi all'height del virtualized. 

## Dev versione: [0.5.1] 14-06-24
- [FIX] [DocumentiPDF] E' stato riscritta la logica finale condizionale per il retrive dei Customers, che non teneva conto dei permessi in maniera complementare, cioè teneva conto solo dei permessi focelda, quindi quando si selezionava la ricerca su entrambe le aziende ricercava con il ruolo focelda senza tenere in considerazione il ruolo IOT.
- [FIX] [GestionePermessi] Risolvo il problema che non venivano salvati tutti i permessi all'interno della tabella per via che faceva affidamento sul modello anziche sul modello blank.
- [FIX] [Contribuzione] Quando veniva modificato il prezzo consigliato di un prodotto dove entrava in gioco la contribuzione. Facendo il BOIMP veniva generato un errore dovuto al fatto che cercava di convertire in toFixed una stringa, inoltre il calcolo del valore presente sul BOIMP di XVLSCI è stato corretto. Quando viene selezionata un altra contribuzione viene resettato lo stato che si occupa di gestire la contribuzione selezionata in precendenza, portandola in uno stato di selezione = null. E' Stata creata una maschera Skeleton per far capire all'utente quando c'è un caricamento in corso nella prima chiamta per evitare la schermata bianca, inoltre è stato risolto il problema che non era piu visibile il mainLoader quando venivano fatte delle chiamta per i filtri, ora il mainLoader è correttamente visibile.

- [ADD] [Utilis] [numberToEuro] Modificata e aggiunte nuove funzionalità di operazione sul array che viene inviata come dati, sarà possibile ora convertire, sommare e sottrare i numeri in base alla proprietà passata nella funzione.
- [ADD] [Contribuzione] ora la contribuzione applicata al blocco varia in base al prezzo variabile inserito anche manualmente, è presente inoltre un contantore che registra la contribuzione attualmente utilizzata in rapporto a quella disponibile, il blocco reagirà di conseguenza togliendo o modificando la contribuzione. Inoltre sono stati aggiunti 4 campi sul BOIMP per definire se un prodotto ha contribuzione e i dettagli della contribuzione stessa.
- [ADD] [OC&FBLogs] Le operazioni di update ora presentano sui blocchi cambiati, un cambio colore del BG per evidenziare qualle quale proprietà è cambiata rispetto alla operazione di update_before correlata, in modo da avere un idea piu chiara su quale colonne prestare maggiore attenzione.
- [FIX] [Customers] [documentiPDF] il pannello presentava diversi problemi tra cui permessi generali e il crash del pannello per via dei clienti la cui ragione sociale risultava essere NULL per i clienti IOT, ora durante la fase di importazione dei clienti vengono esclusi quelli con RagioneSociale NULL sia per Focelda che IOT.
- [ADD] [Contribuzione] Introduzione della nuova funzionalità di contribuzione, nel quale puoi "contribuire" i vari blocchi (prodotti) in modo da rendere i blocchi con margine negativo in margine positivi rispettando almeno il margine di default applicato, cosi facendo gli elementi con il contributo avranno un dei campi aggiunti sul export del BOIMP.
- [ADD] Aggiunti i permessi del programma "Pagamenti"  per tutti i commerciali.

## Dev versione: [0.5.0] 31-05-24
- [ADD] [OC&FB] Introduzione del nuovo pannello amministrativo per il controllo dei logs azione sui vari ordini OC & FB.
- [FIX] [UserManagement] Quando avveniva la ricerca non venivano mandati i permessi degli utenti trovati, infatti entrando sul pannello dedicato al settaggio dei permessi generava errore.

- [FIX] [Pagamenti] Condizione dei permessi e del codiceAgente aggiunto all'invio dei dati dal backside per il frontside tabellare,
ora il commerciale (in base al ruolo dinamico assegnato) vedrà i propri pagamenti.
- [FIX] [Logs] Cambiata la struttura tabellare dei logs, inoltre ora vengono richiamati in maniera piu costante per garantire il register del log stesso durante la fase di azione utente, come ad esempio il F5 della pagina o log-in e log-out.
- [FIX] [Permessi] [Pannelli] Con l'inserimento del nuovo sistema dei permessi si sono creati conflitti con il ruolo per gli elementi che applicavano filtri per admin/dev come ad esempio nel pannello comparatore (filtro admin), è stata creata una funzione di controllo dei permessi che gestisce il problema dando in return un valore boolean che definsce se far apparire l'elemento o meno in base ai permessi e al ruolo utente, inoltre l'oggetto con i permessi dal db sostituisce quello delle route sulla chiamata principale del retrive dei dati utente (chiamta fetch per dettagli utente).
- [FIX] [Permessi] [Pagamenti] l'API è stata aggiornata per permettere il retrive del ruolo in maniera corretta in modo da prendere in considerazione il ruolo nei permessi se presenti e attivi.
- [FIX] [Contribuzione] I parametri che prima erano globali e condivisi (esmp. brand, category, subcategory ecc.) ora sono personali del pannello e quindi le selezioni non verranno mostrate sugli altri pannelli (compare).
- [ADD] [Contribuzione] Ora è presente il Codice della promo quando un blocco prodotto si trova effettivamente in promo.
- [FIX] [Admin] [Permessi] Fix del bug relativo a quando l'admin modificava i permessi di un utente e salvava, i permessi venivano cambiati nel db, ma se si ri-apriva il pannello non vedeva il cambimaneto fatto visivo, solo se si ricaricava la pagina.

- [ADD] [Route] [Permessi] Ora le route vengono generate dinamicamente in base alle impostazione dei permessi se settati per ogni singolo utente, in modo da comporre la SideNavBar con elementi permessi. Qual'ora l'utente non abbia dei permessi speciali, la sideNavBar mostrerà solo ed esclusivamente elementi predefiniti dal sistema generale in base al proprio ruolo.
- [ADD] [Prodotti] Ora all'interno della route prodotti, i commerciali hanno la possibilità di inserire i prodotti all'interno di un carrello in modo tale da poi emettere un ordine che arriverà direttamente ai buyers, inoltre nella fase di ordine potranno avere informazioni sul cliente selezionato come il fido. I buyers inoltre riceveranno solo i prodotti a loro assegnati con pero delle informazioni sul totale ordine fatto dal commerciale in €, in modo tale da avere un idea generale sulla importanza dell ordine.
- [ADD] [Configuratori/Fornitori] Come da richiesta ora è possibile inserire un ulteriore campo di target durante la configurazione dei brand/categorie/gruppi che è il parametro raggruppamento.
Tramite il raggruppamento si ha la possibilità ora di generare eccezioni solo per quel determinato raggruppamento.
- [ADD] [Configuratori/Fornitori] Creato inoltre il pannello che ha la possibilità di modificare/inserire le nuove limitazioni sui brand/categorie/gruppi per i prodotti sul pannello dedicato ai commerciali.
- [ADD] [Prodotti] Sviluppato il nuovo pannello per i commerciali incentrato sul visualizzare i prodotti disponibili in focelda (come il comparatore) ma con una struttura logica sui prezzi in base ai fornitori abilitati (con percentuale addizionale sul prezzo) dai buyers sulle categorie e brand assegnati a loro dalla direzione aziendale. Lo scopo del pannello è mostrare ai commerciali su ogni prodotto una sorta di limitazione sui fornitori.

## Dev versione: [0.4.5] 18-04-24
- [EDIT] [commons/classes/sanitize] Aggiunta la possibilità di decidere se lasciare i caratteri speciali nel brand part code (codice produttore), inserendo un array di oggetti
- [EDIT] [routines/imports] [routines/imports_distributors] Aggiunta la regola per Datamatic del punto finale

## Dev versione: [0.4.4] 16-04-24
- [RE-STYLE] [EDIT] [GestioneRichiesteFido] Modificato il virtualized e il pannello "Overview" per evitare problemi di recalcolo degli height di ogni blocco ed evitare quindi di bug grafici. ora l'overview non occupera width del virtualized ma sarà un pannello sopra elevato. Inoltre è stato aggiunto il pulsante stato che definisce il disimpegno della richiesta in modo da far tornare la richiesta fido in uno stato di Attesa. 
- [EDIT] [GestioneRichiesteFido] Modificato i parametri di filtraggio per il retrive delle richieste fido attualmente attive, togliendo dal invio dei dati le richieste che sono state accettate.
- [ADD] [Contribuzione] Ora ogni blocco sia in TableView che in GrindView potrà avere l'icona (coppa) che indicherà che il prezzo Focelda è piu basso rispetto al prezzo piu basso del competitor. inoltre i fornitori nel pannello extra dedicato alla lista dei prezzi dei fornitori sarà ordinato in base al prezzo piu basso per permettere una migliore leggibilità del sul prezzo piu basso.


- [ADD] [Utils] E' stato creato il .ts che ha come @return il valore piu basso tra due numeri con eccezzione dello 0, cioè se A è piu basso di B ed A è diverso da 0 prendi in considerazione A.
- [RE-STYLE] [Contribuzione] I IconButton dedicati al filtraggio per margine e promo sono stati spostati dalla paramBar alla extraBar in modo da avere una coerenza con i filtri sulla stessa barra.
- [ADD] [Contribuzione] Problema riguardava l'apertura del box sulla GrindView, problema dovuto al pacchetto di base react-virtuoso che gestisce interamente il virtualized. Il pacchetto pero non sembra essere ottimizzato per l'apertura di blocchi con ricalcolo (height) delle dimensioni del blocco singolo, il che portava a una chiusura instant del blocco expanded non permetendo la visione di tutti i fornitori in lista ==> per il GrindView è stato implementato un nuovo pannello che ti permette di visualizzare i fornitori del blocco cliccato.
- [FIX] [Contribuzione] Il TableView è stato aggiornato portandolo a paro di GrindView, quindi entrambe le visioni tabellari avranno le stesse funzionalità ma con modi di rappresentazione a livello grafico differenti.
- [ADD] [Contribuzione] Ora selezioando/deselezionado i fornitori verrà applicato un metodo di filtraggio per includere/escludere gli elementi che hanno almeno uno dei fornitori attualmente attivi.


- [ADD] [Contribuzione] E' stato aggiunto un nuovo filtro applicabile alla chiamata fetch API, il filtro riguarda il flag della gestione dei codici, con la possibilità di selezionare diversi parametri: ['Codici ADJ', 'Codici Discontinui', 'Codici EOL', 'Codici REL', 'Codici Slow Moving', 'Codici su Ordinazione'], l'elemento selezionato rappresenterà un filtraggio aggiuntivo sulla proprietà aggiunta sui prodotti nel DB.
- [ADD] [Contribuzione] Ora i dati vengono inviati tutti, senza filtraggio dal back dei prodotti senza fornitori o con disponibilità uguali a 0, in modo da avere un array completo sul front e filtrarli in base ai fornitori selezionati dal utente. se vengono tolti tutti i fornitori il sistema selezionerà tutti i prodotti anche quelli senza fornitori comparandoli con focelda stessa. 
- [ADD] [Contribuzione] Ora togliendo i fornitori nel pannello dei settings, filtrerà i prodotti in base a se ha almeno 1 fornitore degli elementi attivi attuando l'eccezione delle disponibilità del fornitore stesso sul prodotto.
- [ADD] [Contribuzione] Aggiunto il filtro promo/non per filtrare i prodotti che si trovano in promo/non. L'aggiunta di un ennesimo filtro ha portato alla mini-ristrutturazione della gestione di filtraggio di tutti i dati, il che renderà piu semplice la lavorazione dei dati stessi.

- [FIX] [FidoCliente] Provando ad inserire un testo all'interno del form della richiesta fido, i textbox andavano fuori focus permettendo di scrivere solo 1 lettera alla volta e non un testo in maniera normale. Il problema era generato dalle re-render che avvenivano quando veniva aggiornato lo stato che manteneva i dati inseriti dall'utente, => Trasformazione di elementi React.memo in arrow functions nel return principale del pannello, questa modifica ha portato la soluzione del problema.
- [FIX] [GestioneUtenti] Il cambio del ruolo utente generava un errore bloccante, relativo al impossibilità di assegnare a una variabile un proprietà che non è iterabile, => ora la copia viene fatta sul prev stesso e non su prev.dati e in return viene passato copy invece che {...prev, dati: copy}. perche lo stato ora contiene esclusivamente un array di dati.
- [ADD] [PesiVolumi] Sono stati aggiunti come da richiesta i due magazzini '052' & '055' alla lista per il filtraggio degli elementi.
- [FIX] [BACK] [GestioneRichiesteFido] Interagendo con i pulsanti di azione sul blocco, generava un errore dovuto al campiamento del return della funzione per la sanificazione delle proprietà body passate dalla chiamata fetch API => E' stato riadattato con le nuove props passate in return della funzione sanitize.
- [FIX] [GestioneRichiesteFido] Quando si selezionava un blocco generava errore, dovuto alla props passata a stringToAvatar locale dello script, il cui cercava di accedere al elemento 0 di una variabile undefined => Ora viene richiamata la funzione StringToAvatar da utils che inoltre terrà conto della possibile assenza anche del parametro nome.

## Dev versione: [0.4.3] 28-03-24
- [FIX] [Contribuzione] Risolto il problema relativo all'errore che veniva mostrato quando si cambiava un prezzo, e rimaneva in loop a scaricare il BOIMP => nella proprietà del boimp si faceva un .toFixed su un valore non numerico il che generavo l'errore .toFixed is not a function.
- [ADD] [svcs_Compare] [PesiVolumi] Aggiunto filtro "Flag Gestione codici" sul pannello dei filtri.

- [ADD] [PesiVolumi] E' stata aggiunta una condizione alla query relativa ai 'Mancanti', ora la selezione di un prodotto dalla query è in base anche alla disponbiilità che ha quel prodotto con il magazzino attualmente filtrato. Inoltre è stato selezionato il magazzino '010' come default.
- [FIX] [Compare] [UploadCSV] E' stato fix il problema relativo al csv elaborato, che presentava la posizione dei campi rispetto alle colonne sbagliata.
- [EDIT] [Permission] è stata creata un eccezione per l'utente ('lluciani@adj.it') in modo tale che veda solo determinate route.

- [EDIT] [Fido] Modificato lo stato di apertura iniziale del pannello status delle richieste fido, utilizzo "utils" StringToColor.
- [EDIT] [PesiVolumi] [Front] [Back] Sono state apportate modifiche come da richiesta al pannello pesi&volumi, 1) i magazzini devono essere tutti e non solo: '010', '029'. il pannello filtri doveva essere simile a quello della contribuzione, il send nella param bar doveva essere posizionato sulla sinistra.

- [ADD] [PesiVolumi] [Front] [Back] E' stato aggiunto l'opzione Mancanti rendendo funzionale lo switch dei button. E' Stato aggiunto il filtro Magazzini default settato su 010, sono state applicate ulteriore logiche per ottimizzazione dello script index.js.
- [EDIT] [Customers] [Back] Sono state apportate modifiche in modo tale da gestire i gruppi e il merge dei singoli clienti IOT/Focelda. Ora all'interno della collection ci sono clienti che hanno la proprietà Gruppo con la partita IVA uguale per definire l'id del gruppo.

- [ADD] [Pesi&Volumi] Aggiunto il salvataggio dei log sulle azioni di richiesta al server.
- [EDIT] [Contribuzione] E' Stato aggiunto l'infobox all'interno delle impostazioni di selezione dei fornitori, e sono state apportate delle modifiche al ribasso a livello style, in modo da comunicare all'utente che quel determinato box ha una doppia funzionalità.
- [ADD] [Generale] [Theme] Sono stati modificati i colori sbilanciati sul theme/color, con cui interfacciano i vari componenti html, come input, label ecc..
- [ADD] [Generale] [Pesi&Volumi] [Contribuzione] E' Stato creato un componente per raffigurare la mancata comunicazione dal client al server.
- [ADD] [Contribuzione] E' stata aggiunta la possibilità di applicare un ribasso in percentuale, sia sulla param_bar che sul action bar e quindi sull'applicazione dei parametri sul singolo blocco.

- [ADD] [routines/handle_logs] Aggiunto il servizio per le mail di errore giornaliere
- [ADD] [commons/classes] [security] Aggiunta la sicurezza per la logistica
- [EDIT] [commons/classes] [generate] Fix su undefined nell'ora
- [ADD] [services/logistics] Aggiunta la route e tutto il processo per la logistica
- [EDIT] [services/configurators] Spostato dalla main root ai services

## Dev versione: [0.4.2] 14-03-24
- [ADD] [RE-STYLE] [FIX] [Gestione-Richiest-Fido] Aggiunte al pannello overveiw di gestione, diverse funzionalita e uno stile graifco migliorato e piu inerente al adamento del tema generale dell'applicativo. fixato inoltre il problema del non poter cambiare stato del fido dovuto al cambimento nome delle proprietà.
- [ADD] [Front] [Pesi&Volumi] Sviluppato il pannello per la logistica dedicato all'inserimento dei pesi e volumi, il pannello presenterà 3 blocchi: 1) dedicato al inserimento dei parametri da poter inserire in tabella, 2) la cronologia degli elementi inseriti, 3) gli effettivi elementi da inserire.
- [FIX] [Contribuzione] Ulteriori fix di aggiustamento finali alla parte (1) della contribuzione, esempio => aggiunta filtro buyer, fix filtro magazzini, aggiutna label CMG => costo medio gestione ecc..

- [FIX] [RE-STYLE] [Contribuzione] Fix dei relativi problemi di aggiunta del filtro magazzini, come: totale ora si aggiorna quando vengono selezionati i magazzini, i magazzini ora funzionano in concomitanza con il filtro margine positivo/negativo/neutro, cambiato il posizionamento degli elementi per la vista a blocchi (CMP), fixato del salvataggio dei cambiamenti sui blocchi selezionati, le disponbilità sul BOIMP cambiano in base ai magazzini.
- [ADD] [Contribuzione] Aggiunto il filtro dedicato ai magazzini. Ora attraverso un pannello hai l'opportunita di filtrare gli elementi in base ai magazzini selezionati. in modo tale da vedere solo gli elementi che hanno effettivamente quei magazzini all'interno della proprietà disponibilita.magazzini[].
- [ADD] [Administration] [User] Ora gli Admin hanno la possibilità di eseguire ricerca veloci. Attraverso l'utilizzo della smart search che da loro la possibilità di cercare attraverso l'array. E' possibile ricercare gli utenti tramite: Nome, Cognome, Email, Nome + Cognome.
- [ADD] [Contribuzione] Aggiunta la possibilità di selezionare tutti e deselezionare tutti i blocchi, il comportamento di tale funzione viene inoltre definito in base alla presenza o non del filtro Margine.

- [FIX] [Compare_v3] Fixato il problema relativo allo sfasamento dei prezzi, cioè quando avveniva la ricerca e l'inserimento della tabella succedeva che l'elemento inserito a catena prendeva i prezzi fornitori del elemento che prima aveva com index 0 e cosi via per tutti gli altri => sono stata apportare delle modifiche allo script Type_supplier_eur.js il quale si occupa della scelta tra prezzo e prezzoListino, evitando che in prezzo rimanesse collegato in qualche modo all'index.
- [ADD] [Permissions] Aggiunto il ruolo logistico sia nel back che nel front inserendo la route documentiPDF, quindi i permessi di documentiPDF sono stati modificati permettendo la visibilità di tutti i clienti per gli utenti con ruolo 'Logistica'. Inoltre è stato assegnato il ruolo a log@focelda.it.
- [EDIT] [General] sono state apportare modifiche generali per permettere il corretto funzionamento di script .ts e .tsx
- [ADD] [Icons] sono state aggiunte altre diverse icone alla lista.
- [ADD] [Contribuzione] Aggiunta la  possibilità di composizione ed esportazione del BOIMP inserendo al interno del file .xlsx tutti gli elementi selezionati attualmente dal utente, che possono essere selezionati di default dal sistema o dal utente stesso attraverso modifiche sui singoli blocchi. creazione inoltre del panello dedicato per la richiesta di download del file.


## Dev versione: [0.4.1] 05-03-24
- [BACK] [EDIT] [Contribuzione] inserite alcune esclusioni delle proprietà in modo da rendere l'oggetto inviato al front piu leggero.
- [FIX] [Contribuzione] Risolto il problema che non cambiava il margine e il ribasso del blocco dovuto al inserimento del nuovo blocco e il cambio manuale di prezzo consigliato.

- [BACK] [ADD] [services/compare/average] Aggiunta la media/contribuzione e dell'export in Excel dei risultati
- [ADD] [Compare] [Style] Le date vengono formattate nel formato italiano gg/mm/aaaa
- [ADD] [Compare] Aggiunto ComputerGross
- [BACK] [EDIT] [commons/classes/sanitize] Permesso il carattere speciale # nel CodicePulito
- [BACK] [ADD] [commons/functions/createExcel] Aggiunta la classe che permette la creazione degli export in Excel

- [BACK] [ADD] [services/fido] Aggiunte funzioni di acquisizione e formattazione dei dati da CreditSafe, file cambiati:  
-> ./index.js  
-> ./routes/customersFidoProfile/credits.js  
-> ./routes/customersFidoProfile/fetch/credits.js  

## Dev versione: [0.4.0] 20-02-24
- [ADD] [Contribuzione] Aggiunto un nuovo parametro di filtraggio nella paramBar che consente all'utente di filtrare gli elementi con margine percentuale : Mixed, Positivo, Negativo. Con annessa automatizzazione di selezione/deselezione dei blocchi.
- [ADD] [Contribuzione] Possibilità di modificare il prezzo per ogni singolo blocco.
- [ADD] Aggiunto e riallineato il sistema di colorazione styled della navBar e per i componenti della dashboard.
- [ADD] Aggiunti i permessi per la visualizzazione dei filtri e box in dashboard del comparatore per gli utenti Giuseppe Patalano e Ramona.
- [ADD] [Compare_v3] [Style] Cambiato lo style dello switch che era presente in settings delle colonne, in modo che sia piu compatto il pannello.
- [FIX] [Compare_v3] Risolto il problema di accavallamento delle colonne nascoste con quelle presenti.
- [FIX] [Ordini] [CNR] corretto il problema relativo al crash se si selezionava il canale per via della mancata presenza del label, che non veniva inviato dal back.
- [FIX] [Compare_v3] Risolto il bug relativo alla ricerca di prodotti icecat => il problema è che non venivano inviati effettivamente i fornitori dal back, il che generava errore sul front, inoltre è stato corretto l'accesso alla proprietà descrizione quando si cercava il prodotto.
- [FIX] [RE-STYLE] [Admin] [GestioneUtenti] ora anche se si cercano gli utenti per ruolo sarà rispettato l'ordinamento generale, ovvero precedenza alfabetica e per chi è attualmente Online. Aggiunte diverse stylizzazioni in modo da sistemare diversi bug grafici e animazioni sui button.

- [ADD] [General] Aggiunti i permessi per la visualizazzione della route contabilita/pagamenti per gli amministrativi.
- [ADD] [Contribuzione] a) Aggiunta la possibilità di selezionare e deselezionare i fornitori, b) possibilità di selezionare e deselezionare il singolo blocco (se vuoi inserirlo nel csv o meno), c) possibilità di cambiare visione della tabella se mod. tabellare o a griglia, d) se non c'è nessun fornitore con cui comparare o che ha un prezzo/prezzoListino disponibile allora fai sparire il blocco del consiglia prezzo, e) svariati fix generali al sistema logico funzionale. 
- [FIX] [Compare_v3] è stato fixato l'upload/elaborazione del CSV in modo tale da ridare CSV elaborato correttamente, inoltre ora in base alle colonne dei fornitori attive ridarrà il csv con solo i fornitori selezionati.
- [ADD] [Admin] [User] Ora l'info box sullo swtich varia in base allo stato dell'utente, Attiva | Disabilita l'account di questo utente.
- [FIX] [Dashboard] Modificato il servizio dedicato al retrive dei dati del blocco compare, che risultavano essere ancora antecedenti al inserimento del compare_v3, è stata riallineata la versione, in modo da calcolare i valori numerici in modo corretto.


- [FIX] [DocumentiPDF] E' stato corretto il problema riguardo al fatto che se l'utente presentava il document permission controllando che l'oggetto del pannello in questione sia IOT e Focelda era false allora tornava null nei permessi invece in quel caso deve prende in considerazione il ruolo attuale restituendo i valori di default.
- [Admin] è stato reso possibile a l'utente scovella@focelda.it la possibilità di vedere la dashboard il pannello dedicato al compare e i filtri admin sul compare stesso.
- [RE-STYLE] [Admin] [User] Cambiato lo stile dei bottoni per la disabilitazione del utente, ora se è verde lo switch significa che l'utente è attivo, se rosso è disabilitato.
- [FIX] [Comparev_3] con l'importazione delle esclusioni del vecchio comparatore, e con la visione dei prodotti esclusi, è capitato che qualche esclusione non avesse piu il prodotto perche magari cancellato dalla tabella products per motivi terzi, è stata aggiunta una condizione di metch sul aggragazione delle esclusioni in modo tale da definire che se il predotto non trova il corrispettivo prodotto con il lookup allora evita di inserirlo nel array di dati.
- [FIX] [Compare_v3] è stato fixato la visibilità dei prezzi di keepa sul nuovo comparatore.
- [ADD] [Dashboard] Stato dei Fidi è stato aggiunto il pannello sulla dashboard, per capire la quantita dei fidi in gestione, numerico e in euro complessivo.


- [ADD] [DocumentiPDF] Ora è possibile fare le ricerche, scaricare e visualizzare pdf da entrambe le aziende.
- [ADD] [User_Permission] Creazione della collection con seguita logica dei permessi utente, dove il document definsce come si deve comportare l'applicativo se la proprietà nome corrispettiva del pannelo ha come status: true, prendendo in considerazione e sovrascrivendo il ruolo del utente esempio => Compare : { Focelda: {Status: true, ruolo: 1}, IOT: {status: false, ruolo: null} }.
- [ADD] [Database] [Customers] Ora sul database è presenta una tabella dei clienti unificata delle due azienda (Focelda & IOT),
importando i dati relativi a vari clienti e i CodiciCliente di ogni azienda.
- [ADD] [Dashboard] [Fido] Aggiunto un box con riassunto dei vari fidi in maniera numerica esempio: 'quanti fidi ci sono attualmente => in lavorazione: 1' ecc.. in modo tale da avere uno stato generico della situazione dei fidi.
- [ADD] [Fido] Aggiunta il sistema logico per visualizzare i fidi richiesti nel pannello apposito, in modo tale che il commerciale sappia sempre lo stato dei fiti richiesti, avendo anche un riassunto delle informazioni di quei determinati fidi. E' Stato aggiunto un actionBar in modo tale da avere accesso a pulsanti e filtri in maniera rapida e visibile.

## Dev versione: [0.3.5] 07-02-24
- [FIX] [ADD] corretto il problema relativo all'anteprima per il TOT delle pagine del documento e aggiunta la possibilità di andare avanti/indietro con le pagine del pdf che attualmente si sta visualizzando.
- [CHANGE] [ADD] Aggiunta la possibilità di vedere Documenti PDF per gli utenti amministrativi.
- [FIX] [FB] [DNR] Rimandava errore sul front se si selezionava apriva il menu a tendina del CANALE, errore dovuto alla mancaza nel back della proprietà main che mostrava i label da selezionare,
errore generato dal mal convert della proprietà.
- [FIX] [Drive] [Email] Quando si modifica il testo del email e poi si chiudeva ri-apriva il pannello non era piu presente l'email dell'azienda selezionata.
- [FIX] [Drive] Fix relativo alla ricerca di CONTO, l'elemento che veniva trovato era sbagliato, cioè non era della stessa azienda ricercata.
- [ADD] [Drive] Creato pannello dedicato al accesso di file PDF con la possibilità di agire su tali files. Ricerca di tali file avviene attraverso l'inserimento di svariati filtri cliente/codice documento/range di date/tipologia. Con ulteriore possibilità attraverso la comparsa della actionBar di agire su uno o piu file selezionadoli con CLICK + CTRL, esemp. inviare l'email con gli elementi selezionati, download dei file selezionati, e la possibilità di vedere in anteprima il singolo elemento selezionato. Il tutto in concomitanza con l'interno sviluppo del servizio dedicato svc_drive, che agisce da web-server e interagisce con i client.


## Dev versione: [0.3.2] 07-02-24
- [FIX] [Filter] [Compare] Il problema era che inserendo i pre-filtri all'interno dell'url succedeva che rimanevano forzati e anche se si modificava i valori all'interno del pannello dei filtri, i pre-filtri rimanevano assoluti modificando i valori inseriti dall'utente e inviandoli al back come parametri, => per risolvere è stato modificato lo stato del dfval da useRef a useState in piu è stata creata una funzione che gestisce le proprietà del url al primo caricamento del componente e li assegna vari stati context globali che gestiscono i filtri, cosi facendo l'utente ha la possibilità di editare e inviare le richieste con i propri filtri partendo di base al primo caricamento con i filtri del url.
- [ADD] [Permessi] i commerciali ora possono avere accesso al configuratore => cartucce.
- [FIX] [Routines] [Import] E' Stato fixato l'importazione dei file per quei distr. che avevano piu file, il problema era relativo alla presenta di un lenght - 1 su un ciclo for loop che non prendeva in considerazione gli altri file, inserita per via di datamatic, ora vengono letti tutti i file ed è stata aggiunta la condizione solo su datamatic in modo da avere tutte le proprietà in maniera corretta.
- [FIX] [Dashboard] [URL] l'url di ri-indirizzamento verso il comparatore su Articoli da Modificare
dove focelda è piu alto è stata fixata.
- [FIX] [Compare] [Filtri] Fix del problema relativo al totale € dei prodotti in magazzino problema gestito con l'inserimento dello stato nei casi per il re-render della funzione callback
- [ADD] [Compare] [InfoBox] E' stato aggiunto un infobox per segnalare all'utente le nuove novità del comparatore, con possibilità di chiuderlo.
- [ADD] [Compare] il filtro iniziale di default è stato cambiato ora di base l'utente vedrà tutti i prodotti a lui assegnati, senza nessun tipo di filtraggio piu alto/basso di focelda. E' stato realizzato il sistema di gestione del colore del prezzo in base a delle al prezzo dei competitors.
- [FIX] [svc_compare] Bug relativo al filtraggio delle le esclusioni in modo da prendere in considerazione solo gli elementi che hanno la proprietà codice. Il sistema non riusciva a filtrare in maniera corretta le esclusioni che non hanno una proprietà codice all'intero, il che generava un errore dando indietro un array vuoto [], e quindi ne risentivano la lista dei Brand e Categorie.
- [FIX] [Routines] [Import] il nuovo import presentava diversi problemi di importazzione e associazione dei prodotti agli altri vari prodotti, è stato fatto un lavoro di ristrutturazione dei vari file creati in precedenza e fixati tutti i bug che impedivano tale operazione.

- [ADD] [orders] Ora l'amministrativo puo inviare testo aggiuntivo da poter inserire all'interno della mail, attraverso un nuovo pannello disponibile cliccando sull'icona di invio mail presente quando si seleziona il commerciale da sollecitare.
- [FIX] [ConfiguratoreCartucce] [Style] Modficiati i vari colori deedicati ai vari elementi.
- [FIX] [Query] [svc_targetstock] [svc_user] fix delle query back per il retrive del backorder corretto sia sul pannello dedicato che sulla dashboard
- [FIX] [Prestazioni] [Dashboard] [General] Ottimizzazioni delle prestazioni generali dell'applicativo con test su X4 slow CPU.
- [FIX] Server sono stati modificati : svc_auth_main, svc_community => Tali servizi ora presentano il fix sulla conessione unica per quanto riguarda il problema delle multiconessioni che ogni richiesta al servizio si moltiplicavano, in piu ora le API sono tutte async e presentano i moduli delle classi dichiarati una volta sola all'interno del'index di ogni servizio in modo da ottimizzare il codice, in piu sono stati riadattati i codici al blocco try-catch con le classi indirizzate a commons.
- [FIX] [Route] Corretto il problema relativo al inserire nei permessi una route nello specifico anche se fa parte di un gruppo nested => in modo tale da avere quel gruppo con solo quella route.
- [FIX] [SVC_USER] [PaymentsNotifications] Risolto il bug relativo al fatto che non inviava correttamente le notifiche per mancanza di un await sulla risposta da parte del IBM, inoltre se un pagamento presentava il campo CDAGE = null, le notifiche venivano inviate anche a chi non aveva il codiceAgente.
- [FIX] Correzione dei vari console.error sulla dashboard e alcuni sul comparatore per permettere il corretto funzionamento generale dei vari pannelli.
- [ADD] [TableVI] [ConfiguratoreCartucce] Aggiunta la possibilità di inserire piu proprietà all'interno del infoBox, aggiunta la possibilità di inserire dei miniBox colorati per indicare il colore.
- [ADD] [Compare] Aggiunta compatibilità di ricerca in tutti i fornitori, ora l'utente potra interagire con il nuovo pannello di ricerca e di selezione elementi per accedere alle proprietà degli oggetti presenti nel db di tutti i fornitori.
- [FIX] Server sono stati modificati : svc_accountability, svc_admin, svc_compare, svc_orders, svc_user => Tali servizi ora presentano il fix sulla conessione unica per quanto riguarda il problema delle multiconessioni che ogni richiesta al servizio si moltiplicavano, in piu ora le API sono tutte async e presentano i moduli delle classi dichiarati una volta sola all'interno del'index di ogni servizio in modo da ottimizzare il codice, in piu sono stati riadattati i codici al blocco try-catch con le classi indirizzate a commons.

## Dev versione: [0.3.0] 11-01-24
- [FIX] [svc_user] [Notification] Spostamento della variabile di controllo dell'esistenzadi altre notifiche Pagamenti per quel determinato utente, all'interno della condizione per evitare errore di accesso alla proprietà di un oggetto undefined nel caso in cui non trova l'utente all'interno della collection.
- [FIX] [Dashboard] Risoluzione dei vari log error sulla pagina principale in modo da avere il corretto funzionamento di tutti i componenti.
- [FIX] [TableVI] [Sort] Correzione agli errori del sort dovuti al cambiamento di nome della colonna, tale cambiamento provocava un miss-matching sull'oggetto Test dedicato alla gestione e al salvataggio delle impostazioni sort, ora se non riesce a trovare nessuna corrispondenza prende il nome del valore a posizione 0 nella prorpietà key nell'oggetto della colonna. 
- [ADD] [Ordini] [FB] [CNR] Aggiunta Sort su ogni colonna della corrispettiva tabella ad eccezione delle colonne per le date.
- [UPDATE] [Dashboard] [ObiettiviStock] Modificato l'ordinamento degli elementi in tabella, ora gli elementi verranno ordinati in base alla formula per il calcolo della completazione mettendo in primo piano le persone che sono molto distanti dal obiettivo. 
- [ADD] [Payments] [svc_user] [svc_accountability] Creato il sistema logico front/back end per l'inserimento dei dati nella tabella se l'utente si troverà all'interno del pannello in questione e l'avvertenza tramite notifiche in tempo reale sullo stato dei pagamenti entrambi gli elementi gestiti a webSocket.
- [FIX] [Comapre] il compare non permetteva il download del file, l'errore era dovuto alla mancata presenza dei ? su alcune variabbile nella funzione, il che generava un errore di mancata presenza della proprietà oggetto.
- [ADD] [TargetStock] Ora è possibile vedere il grafico di andamento del singolo Buyer. Il grafico riporterà il dato (Stock + BackOrder) di ogni singolo giorno degli ultimi 30dd, in modo da vedere l'andamento di tale buyer verso l'obiettivo prefissato.
- [ADD] [Compare] [Filter] [TAG] ora il compare presenta la struttura logica che mostra i filtri caricati come TAG => l'utente selezionado i filtri sul pannello dedicato avrà un riassunto situazionale dei filtri attualmente attivi nelle ricerca con la possibilità di eliminarli uno ad uno cliccando sulla 'X' presente all'interno del TAG in modo da fare un ulteriore chiamata per il retrive dei dati senza il TAG attualmente cancellato.
- [FIX] [Route] [Permision] [SideNavBar] Risolto il problema relativo al non-cambio colore per gli elementi(button) nested nella navBar quando ci si trovava nella pagina correlata.
- [ADD] [Accountability] [Stocks] Aggiunta dei vari sort su ogni colonna, cambio colore per i tag fissi come esempio 'Fatturato 45day' con il seguente colore '#b2d1ff' e aggiunta del sistema logico TAG in modo da agire in maniera rapida sui filtri.
- [FIX] [Accountability] [Payments] correzzione e aggiunta delle dovute casistiche per i filtri in modo tale da filtrare gli elementi direttamente sugli elementi inviati dal server ad eccezzione delle date range e num. mov che interpellano il quel caso il server.
- [ADD] [General] Ora le tabelle con filtri hanno i TAG riassuntivi dei filtri attualmente attivi con possibilità di eliminarli clicando sulla 'X' presente all'interno dei singoli TAG.
- [ADD] [Accountability] [Payments] Aggiunti i vari sort alle colonne, con riadattamento del componente Sort di component/virtualized per indicare se i dati effettivi sono presenti all'interno di una proprietà o all'interno all'oggetto in arrivo dal back.
- [REMOVE] [Accountability] [Payments] Eliminato sistema infinte Scroll con offset, per diversi problemi relativi alle query di backend.
- [FIX] [Accountability] [Payments] Risolto il problema del'infinte scroll, offset, data-range. => ora l'utente puo scrollare piu elementi in maniera corretta, il componente Grid-Virtualized ora ha la possibilità di manifestare uno stato di caricamento durante la richiesta di dati da parte del client al server, event => infinte-scroll.

## Dev versione: [0.2.8] 04-01-24
- [ADD] [Compare] Aggiunto il salvataggio della posizione al richiamo del infintescroll per evitare il reset della posizione della barra di scorrimento, aggiunto inoltre una barra di caricamento nel footer per dare un elemento di status del caricamento all'utente.
- [CHANGE] [SideNavBar] Ora la barra laterale rimarrà aperta o chiusa in base alla volontà dell'utente, per aprirsi dovrà essere premuto il pulsante stessa cosa per chiudersi, (default la barra è aperta).
- [FIX] [Stocks] Le date nei filtri non mostravano di default la data pre-impostata. 
- [FIX] [Stocks] Prima i brand ricevuti venivano inseriti nel autocomplete cosi come sono, cosi facendo si veniva a riscontrare il problema della duplicazione dei brand dovuti dal fatto che lo stesso brand poteva avere piu prefissi, ora l'array viene elaborato in modo da far apparire solo 1 brand univoco, il criterio che viene utilizzato per la sceltà è il primo elemento inserito, se riscontra che il brand con lo stesso nome è gia inserito non lo re-inserisce, mantenendo cosi uno stanto di Dinstinct sul Nome del brand.
- [FIX] [Stocks] Aggiunto tag grafici per indicare lo stato giornaliero delle date in modo da dare un idea chiara del perche ci sono quelle date di default.
- [FIX] [Stocks] Risolto il problema della sequenza delle colonne in apparizione e sparizione in base alla necessità espressa.
- [ADD] [Compare] E' Stato aggiunto un nuovo fornitore : Xpress

- [FIX] [Dashboard] [TargetStock] Fix relativo al progess bar che aveva dei valori sbagliati dovuti al fatto che non eseguiva l'operazione di somma nella formula matematica in maniera corretta (per via che l'AS400 o MariaDB inviano tutto come String).
- [ADD] [Stocks] Creato il servizio e il pannello annesso sul client riguardo agli Obiettivi Stock fine Anno, il pannello sulla dashboard rappresenterà lo stato degli stock per i relativi buyer notificando con la barra all'interno del'elenco lo stato attuale dell'obbiettvo predisposto. cliccando inoltre sul icona in alto a destra sarà possibile andare sugli articoli nello specifico che compongono la situazione generale del buyer. Sarà possibile filtrare i vari elementi attraverso vari filtri presenti nell sub pannello a comparsa laterale. 
- [FIX] [Compare] [Filtri] Risolto il problema relativa al fatto che alcune volte modificando il filtro piu basso inviava il valore positivo. Ora inoltre quando si entra nella pagina del compare con dei filtri applicati nel url, il sistema di filtraggio riconoscerà quei filtri e li applicherà in default all'interno della barra dei filtri nella giusta posizione per quanto riguarda solo ed esclusivamente per il prezzo piu alto o piu basso. Aggiunta la possibilità di possibilità di inviare anche la & per quei brand particolari come 'PANTUM PRINTER & SUPPLIES' che erano presenti ma venivano rifiutati per motivo della & => ora viene convertito in UTF-8 e inviato al server per poi essere de-convertito e associarlo alla variabile di riferimento.
- [FIX] [SideNavBar] risolto il problema creato all'inserimento di memo e callback per evitare re-renderizzazioni, il che portava al non aggiornamento totale della sidenavbar e non riusciva ad cambiare lo stile del bottone anche quando si trovava nella pagina correlata. In oltre è stato fixato il problema che quando entravi in una pagina Nested (contenuta all'interno di una micro categoria esempio: Contabilità => Fido) succedeva che al refresh lo stato del box nested nella sideNavBar si resettava perdendo lo stile.


## Dev versione: [0.2.7] 14-12-23
- [FIX] [Compare] Risolto il problema dovuto al fatto che non facesse l'ulteriore chiamata per il retrive delle categorie nel momento in cui venivano inviati i filtri, con rispettiva correzzione del problema (Back) legato al sanitize della stringa Brand per gli elementi che presentavano " - ".
- [FIX] [General] La Navbar e la Side Navbar generavano re-render inutili che portava al ricaricamento del componente senza un motivo valido, il che influiva sulle prestazioni generali dell'applicativo e dei vari componenti principali => Tali Re-render sono stati corretti portando ad un ottimizzazione generale del 30%. Inoltre il Tooltip di MUI è stato sostituito con react-tooltip ottimizzato in maniera piu efficiente di MUITooltip che generava ulteriori LAG di andamento del pannello stesso.
- [FIX] [UserManagement] Molto spesso succedeva che l'utente ricaricando la pagina non riuscisse a vedersi online all'interno dell'elenco utenti => ora il problema è stato FIX e l'ordine è stato settato su: Prima gli utenti Online e poi quelli Offline.
- [RESTRUCTURE] [UserManagement] è stato ristrutturato il pannello di gestione degli utenti, gestendo i vari elementi con react-virtuoso (virtualized) ora quindi sarà possibile avere un gran numero di elementi a schermata. Inserita la possibilità di creare utenti attraverso il medesimo pannello che genera un ulteriore form che bisogna compilare per poter creare con successo il nuovo account (con Check di controllo per la validità dei campi). Il ruolo ora viene cambiato attraverso una finestra di selezione in maniera veloce e piu ordinata rispetto a prima.

## Dev versione: [0.2.2] 10-12-23
- [ADD] [RichiestaFido] Inserita la logica funzionale che determina quale domande sono required e quale no, aggiunte molteplici logiche di controllo, tra cui controllo dei singoli tab per creare un effetto visivo di stato della tab (verde = sono state compillate tutte le domande required), e logica di controllo sulle domande nel complesso su tutte le domande per attivare e disattivare il button invia modulo
- [ADD] [GestioneFido] Introduzione del nuovo panello per determinati utenti (amministrativi), il pannello gestisce le richieste fido fatte con possibilità di vedere tutte le richieste e i dettagli di tale richieste(commerciali), inoltre sono suddivise per date in maniera esplicita in modo tale da dare una visione completa. Le richieste possono avere diversi stati: 'in attesa', 'in elaborazione', 'accettata', 'rifiutata'. l'utente puo prendere in carico solo le richiesta con lo stato di attesa. una volta che l'utente prende in elaborazione la richiesta solo lo stesso utente puo accettare e rifiutare la richiesta, gli altri utenti comunque possono vedere le richieste e i dettagli anche se sono assegnate ad altri utenti. 
- [FIX] [BUG] [Token] volte succedeve che l'utente poteva avere il token non corretto/invalido, questo portava il malfunzionamento di diverse tab. Per prevenire questo caso si è creata la necessità di creare una logica funzionale che gestisce il logout e la forzatura dello stesso log-out utente.

## Dev versione: [0.2.1] 27-11-23
- [FIX] [GestioneUtenti] il dato relativo all'ultimo Accesso presentava problemi di salvataggio della data stessa durante la fase di collegamento al servizio svc_admin, dovuta alla mancata presenza della proprietà lastAccess nel modello della collection di riferimento. 
- [FIX] [GestioneUtenti] [ControlloLogs] E' stato reimpostato l'ordinamento dei box calendario (con date sulla sinistra), ordinado gli elementi per data piu recente.
- [FIX] [ADD] [GestioneUtenti] [ControlloLogs] Aggiunto react-virtualized-list sulla lista dei tab (gli elementi data) in modo tale di ottimizzare il sistema generale, inoltre è stato fixato il problema relativo all 100% heigth che restringeva gli elementi diventando illeggibili e impossibile da cliccare, inoltre è stato aggiunto il mese per riferimento alla data precisa.
- [ADD] [Compare] Aggiunto un nuovo fornitore ('Cometa') alla lista delle colonne all'interno del comparatore.
- [ADD] [FIDO] [Richiesta_Fido] Modifica struttura attuale delle domande, inoltre è stato aggiunta la possibilità di avere nella risposta della domanda il select con menu a tendina + il box testo da poter inserire il tutto con possibilità di aggiungere piu rispsote.
- [ADD] [FIDO] [Richiesta_Fido] E' stato creato il componente logico funzionale che permette la generazione di un panello strutturato a modulo per l'inserimento e l'invio dei dati clienti al server, per la creazione della richiesta fido ed extrafido cliente.
- [RESTYLE] [FIDO] Applicate diverse modifiche stilistiche del profilo fido cliente, come valutazione creditsafe, i gradient della barra di posizione rating, cambio nome ADJ => IOT, ultimo Bilancio ora in base alla data cambia colore e background ecc.. 
- [FIX] [Compare] il numero totale nel comparatore non teneva effettivamente conto degli elementi esclusi il che portava confusione agli utenti che molto spesso si trovavano con esempio 40 di 56 elementi ma quei 16 elementi erano esclusi e quindi correttamente il table non faceva scrollare => inoltre ora l'admin puo vedere tutti gli elementi esclusi di tutti gli utenti e puo filtrare gli esclusi per utente.
- [FIX] [APP] utilizzando un'plug-in di traduzione o la traduzione automatica del browser faceva generare errori cancellando parti di codice necessari per la renderizzazione dinamica di alcune proprietà/elementi.
- [FIX] [STYLE] [Dashboard] è stato riadattato la card ComplexStatisticsv2 per permettere l'utilizzo di esso anche alla logica degli utenti Connessi, inoltre sono state apportate alcune modifiche di stile tra cui: i primi box attivi presentavano problemi di stile dovuto dal fatto che alcuni box fossero piu grandi rispetto ad altri => ora i box prendono l' height del box piu alto all'interno del tag madre.
- [ADD] [Fido] è stato creato lato backend il servizio e la gestione delle route del Fido, creata inoltre la pagina dedicata sul front per la ricerca del cliente (gestita a autocomplete virtualized ), e l'effettivo profilo con i dati. Gli elementi Box del profilo cliente vengono creati dinamicamente in base alle proprietà oggetto presenti nei dati in arrivo dal server, con lo skeleton come intermedio di caricamento dati tra un profilo cliente all'altro, i dati in output dal client al server sono stati sanificati, sistema di avoid piu chiamate consecutive dovute allo stato di request al click del bottone di ricerca.
- [FIX] [Comapre] [APP.js] Risolto il problema relativo all'apertura dei filtri del compare, molto spesso succedeva che alcuni utenti si imbattevano in questo bug dovuto dal fatto che il componente non riusciva a leggere l'url in tempo reale.

## Dev versione: [0.2.0] 07-11-23
- [FIX] [Compare] [Search] L'ean che presentava caratteri speciali all'interno venivano tolti in autimatico il che impediva la ricerca del prodotto stesso all'interno del db, ora la chiamata è stata modifica in POST per mantenere i caratteri speciali.
- [FIX] [Notification] Sono state fatte le seguenti modifiche al sistema di notifiche: Ora le notifiche vengono ordinate e inviate all'utente dal piu recente al meno recente, inoltre sono stati permessi i seguenti caratteri speciali: "<> / . ,". è stato fixato anche il continuo allert al caricamento della pagina di 'hai una nuova notifica', ora comparirà effettivamente dopo aver ricevuto una nuova notifica. Gli utenti Admin hanno la possibilità di inviare le Email come gli Account Dev attraverso l'apparizione del bottone ad icona dedicato. 
- [ADD] [Maintenance-Mode] Aggiunto il nuovo sistema di manutenzione che permette alla webapp di andare down e permettere l'accesso solo a richiesta se l'ip si trova nella whitelist del server. Sistema che si basa sullo scambio di dati in tempo reale con WebSocket, in modo tale da comunicare agli utenti Online che il sistema è in manutenzione. Creazione della pagina statica di manutenzione per la comunicazione ai vari utenti di tale stato. inoltre è stato rivisto in minima parte il GeneralSettings nella TAB degli amministratori per permettere lo switch di tale modalità in maniera facile e veloce tramite lo switch presente in Generali => Impostazioni Generali.
- [ADD] [Notification] Aggiunto il sistema logico delle notifiche in tempo reale, l'utente ora riceverà le notifiche inviate o meno dal Admin/Dev.
le notifche posso avere diverse tipologie e modalità, le tipologie fanno riferimento al tipo della notifica, che puo essere: 'Manutenzione', 'Info', 'Allert'. Invece la Modalità fa riferimento a chi inviare la notifica, puo essere di due tipi: 'Notifica Generale', 'Notifica Singola'. La notifica generale invia il testo scritto a tutti gli utenti, inviato la notifica in tempo reale solo quelli attualmente connessi. La notifica singola è una notifica mirata al singolo account. il pannello di invio notifiche sarà disponibile solo al Dev/Admin, la descrizione del testo che sta per essere inviato è sanificata in modo tale da permettere solo determinati caratteri speciali.
-[FIX] [tableVI] Fix della grandezza(Style) dell'immagine nessun prodotto o elemento trovato.

## Dev versione: [0.1.7] 25-10-23
- [ADD] [Community] Corretto il problema relativo allo style di lunghezza del titolo dove il titolo usciva fuori dai margini consentiti, aggiunte diverse tipologie di post, fix vari al community per il retrive della tipologia del post.
- [FIX] [ChangePassword] Risolto il problema del resetPassword relativo alla corretta distinzione se l'utente è nell'applicativo o meno, e questo generava errori relativi alla mancanza di informazioni utente.
- [ADD] [TableVI] [OrdiniFB] sono state inserite le grandezze e lo Style della colonna in maniera esplicita.
- [REMOVE] [TableVI] [OrdiniFB] la colonna Email è stata momentaneamente disabilitata.
- [FIX] [TableVI] [Ordini] Ora la grandezza dei Row viene generato dinamicamente in base agli elementi presenti in tabella. garantendo una grandezza standard in base alla grandezza del campo.
- [FIX] [TableVI] [Ordini] Risolto il problema riguardante il missMatch tra colonne modificate e cookie, succedeva che se il Dev modificava e toglieva la colonna manaulemente da columns agli utenti generava un errore di missMatch per via dell'assenza della colonna stessa e della label inserita nei cookie. ==> questo problema è stato risolto generando nuovo codice per evitare questo caso.
- [RESTRUCTURE] [Community] E' stato fixato l'errore relativo al caricamento della comunity dovuto alla modifica del sistema delle route, inoltre è stato ristrutturato tutto il sistema di sort del componente madre della comunity ==> ora presenta uno stile Sort simile a quello del compare a 3 Livelli, disattivato, crescente e decrescente, inoltre sono stati tolti alcuni filtri e il bottone di reload dei dati (Cached) è stato cambiato in un ButtonIcon con animazione di rotazione.
- [FIX] [Comapre] Risolto il problema realtivo al fatto che quando venvia aperto gli ordini FBCNR caricava l'header cookie sempre uguale al FB  => ora il nome del cookie vine passato in maniera dinamica dal componente che lo richiama.

## Dev version: [0.1.6] 19-10-23
- [ADD] [Compare] I prezzi dove i fornitori sono piu bassi rispetto al prezzo di focelda assumono uno stile di verso in modo tale da evidenziarli.
- [FIX] [APP.js] [Compare] Apertura del menu laterale filtri non si apriva, dovuto a un unmatch del url esempio ==> url: localhost/Compare == compare.
- [FIX] [Compare] Quando venivano selezionati i fornitori e filtri insieme, non venivano effettivamente inviati i fornitori selezionati il che generava una risposta sbagliata dal server.
- [FIX] [Ordini] [FB] [CNR] il filtro Giorni è stato eliminato, e sono stati apportati cambiamenti alle variabili interne dovute alle modifiche delle proprietà in input del back.
- [FIX] [Compare] I nuovi fornitori non venivano presi in considerazione e non veniva inviati in __dist in FetchData.
- [FIX] [Compare] [Filtri] Problema relativo all'apertura dei filtri.
- [ADD] [Dashboard] [OrdiniFB] Aggiunto la statistica inerendo agli FB con consegna non rispettata con modifica di stile annessa per la rifinitura della posizione.
- [ADD] [Ordini] [FB] [CNR]&[PIS] Sort e Multisort inserito sulla colonna Prezzo => Ora è possibile fare il sort per Prezzo, Quantità e Prezzo*Quantità.
- [ADD] [Ordini] [FB] E' stato inserito un loading quando viene premuto il tasto di ricerca per far capire lo stato attuale dell'azione.
- [ADD] [Style] [SideNavBar] Gli elementi Nested nonostante fossero aperti non venivano evidenziati in qualche modo e venivano confusi all'interno della sidenavbar sopratutto quando chiusa, ora gli elementi se 'Nested' e aperti vengano evidenziati con un colore differente.
- [ADD] [Ordini] [FB] [CNR] Aggiunta la tabella 'FB con consegna non rispettata' con la relativa route in ordini, con l'aggiunta del filtro sull' campo 'Canale' in modo da avere la lista di elementi rispettivi al canale selezionato.
- [ADD] [Compare] Aggiunto una nuova colonna Fornitore 'Nova', nella tabella del compare.
- [FIX] [Compare] alcuni fornitori presentavano le disponibilita ('pz') nascoste.
- [ADD] [Route] Aggiunto nuovo sistema di routing => ora il sistema capisce esattamente quali route appartengono all'utente loggato, per poi deviare e impedire che l'utente vada su componenti non assegnate in base al ruolo, ottimizzando inoltre diversi codici per evitare re-render inutili e rimetizione di linee di codice. Inoltre ora se l'utente ha piu ruoli le route/icone sulla sideNavBar vengono cambiate in maniera dinamica mostrando sempre e solo quelle assegnate.
- [ADD] [Ordini] [FB] Aggiunta di warehouseToT nel footer della tabella per il calcolo di Prezzo * Disponibilità.

## Dev version: [0.1.5] 17-10-23
- [ADD] [Route] Aggiunta della logica per mostrare le icone nella sidenav inerenti all'ruolo dell'account attuale.
- [ADD] [Ordini] [FB] Gli elementi mostrati variano in base al ruolo dell'account, se l'utente è un commerciale vedrà i risultati annessi, se l'account è un Admin o Dev vedrà tutti i risultati della query di ricerca.
- [ADD] [Dashboard] [Ordini] [FB] Ora vengono visualizzate le informazioni degli ordini FB in base all'account, se l'utente è un commerciale vedrà la statistica degli elementi d'interesse, se è admin vedrà il numero complessivo.
- [FIX] [Ordini] [FB] Modificata la lista dei commerciali(filtri) UTM62 con nome e congome dell'utente, aggiunto sistema logico per l'invio dell'email al commerciale/cliente.
- [ADD] [Dashboard] Aggiunta del box relativo alle informazioni degli ordiniFB con dati complessivi di ogni commerciale.
- [ADD] [Comapre] Sort su CodiceProduttore è stato aggiunto per permettere l'ordinamento di tale proprietà.
- [FIX] [Compare] [UploadCSV] Se inserivi un CSV gia elaborato rimaneva bloccato non riuscendo a capire attualmente la situazione del processo ==> ora gestisce l'errore in modo da avvertire l'utente che effettivamente è già stato elaborato il file CSV.
- [FIX] [GestioneUtenti] Ora gli stati degli utenti una volta applicati i filtri e fatte le dovute nuove richieste vengono mostrati correttamente.
- [FIX] [Dashboard] Fix di tutti gli Errori generali presenti nella console che facevano riferimento a diversi componenti, come il multiRole o ComplexStatisticsCardv1/v2.
- [FIX] [Dashboard] Corretto il problema delle chiamate FETCH che facevano riferimento ai pannelli come filter e quotation, che venivano fatte anche se non si trovavano nella pagina di interesse.
- [ADD] [Compare] il sistema strutturale di Virtualized basato su List non permetteva il supporto completo per una tabella piu a scorrimento orizzontale che verticale, questo impediva la sincronizzazione dei due componenti quali Header tabellare e il body stesso, avendo poca ottimizzazione con 20/30/40+ campi orizzontali, la struttura ora è basata sempre sul sistema react-virtualized ma Grid ottimizzato per tabella dai grandi numeri sia verticali che orizzontali, con il cambiando di tale struttura si è dovuto ricorrere al FIX e alla mini-ristrutturazione del header. inoltre il footer nelle impostazioni della colonna lo stile grafico è stato alterato in modo da avere gli elementi piu grandi e facili da clickare il tutto attraverso una grafica personalizzata. le note sono state spostate come prima colonna ed tale colonna è stata unita alla colonna dell'NoteAllert in modo tale da avere una solo colonna unificata, facile e semplice da raggiungere. sono stati corretti alcuni bug che presentavano i fornitori aventi prezzo €0.00.

## Dev version: [0.1.1] 11-10-23
- [ADD] [OrdiniFB] [Front/Back] logica di generazione di email aggiunta e collegata al click del pulsante sul front.
- [ADD] [Amministrazione] [user-management] Aggiunta dei filtri Ruolo, inoltre ora gli utenti disabilitati (bannati) sono separati rispetto a quelli attualmente attivi, in modo da avere una separazione netta degli utenti, accessibili dal button vicino al invio dei filtri.
- [ADD] [LogsLogic] i logs registrano ora anche gli elementi Collapse Nested per Admin && Dev.
- [FIX] [UploadCSV] [Compare] L'importazione da parte dell'utente del file CSV per gli utenti da firefox risultava non importare il file anche se CSV.

## Dev Version: [0.1.0] 10-10-23
- [ADD] [OrdiniFB] Aggiunta la possibilità di inviare Email di sollecito all'utente in questione => Logica situazionale aggiunta a TableVI (tabella generica Virtualized).
- [ADD] [OrdiniFB] [Filtri] Aggiunto il filtro giorni dal numero 1 a 31, sort dal piu piccolo al piu grande, per filtrare gli elementi in base alla colonna Giorni Ord., filtro disponibile solo per gli admin/dev, 
- [FIX] [Compare] [ReqCSV] Ora il csv dipende anche dai filtri inviati, in modo tale da dare risultati coerenti con l'inserimento dei filtri.
- [ADD] [Compare] [Filter] Ora è possibile filtrate gli elementi presenti sul compare tramite le Note > 0, trovando tutte le note dove l'array ha lunghezza diversa da 0.
- [ADD] [Compare] [Upload-CSV] E' Stato aggiunto una ruota di caricamento per far capire all'utento lo stato attuale del processo di upload e conversione del csv.
- [ADD] [Compare] [Upload-CSV] Ora gli utenti potranno inserire dei CSV customizzati in modo tale da ricevere indietro dei file CSV con all'interno in aggiunta i campi dei vari fornitori (Prezzo e Disponibilità).
- [ADD] [Compare] [LastRetrive]Ora è possibile vedere la data del'ultimo retrive dei dati di quel fornitore specifico, e se la data del ultimo retrive non combacia con la data attuale viene comunicato a schermo in rosso sotto il nome del fornitore in modo da comunicare che sono dati non aggiornati.
- [ADD] [MultiRole] Realizzato il sistema di multi ruoli per un singolo account, ora l'utente attraverso il pannello presente nella Top navbar ha la possibilità di cambiare ruolo a propria scelta, attraverso l'onHover apparirà un pannello in base ai ruoli "concessi" a quel utente.
- [FIX] [RefreshToken] Per gli utenti che utilizzavano FireFox come browser, è stato fixata la richiesta di Log-in & Log-out, e le richieste di refresh token e la scadenza di esso, tutto ciò mandava gli utenti in un loop di caricamento pre dashboard.
- [ADD] [OrdiniFB] Ora è presente una tabella dedicata agli ordiniFB con il filtro per Admin/Dev della selezione dei commerciali, per il momento visibile solo agli Admin & Dev.
- [FIX] [Compare] [Filter] Bug riguardante il reset degli elementi all'interno dei filtri di selezione brands/categorie, al cambiamento del elemento genitore non veniva effettivamente resettati gli elementi figlio, ritrovandosi con discrepanze di assegnazione => ora gli elementi madre e figlio nei filtri di selezione vengono resettati in maniera corretta.
- [FIX] [Compare] [Filter] La scritta Filtri per Admin è stata nascosta insieme al divider e viene mostrata solo quando si è un Admin o Dev.
- [ADD] [Compare] [Filter] Quando si seleziona il Buyer le categorie e i brand vengono deselezzionati in maniera automatica.
- [FIX] [Compare] Fix del searchHere che clickando sul'elemento in questione, l'elemento veniva inserito in tabella con valori 0.00€ => ora rispetta i valori corretti e viene importato in maniera corretta.
- [ADD] [Dashboard] Alla Stats. Articoli da modificare sono stati aggiunti due valori in piu per indicare, le esclusioni e il totale dei prodotti assegnati all'utente.
- [ADD] [Compare] [General] Ora è possibile salvare le impostazioni salvate dall'utente, il compare ora carica i salvataggi delle colonne attive.
- [ADD] [Compare] Ora l'allert delle note viene visualizzato/aggiornato subito dopo aver inserito/rimosso la nota, inoltre all'inserimento o alla cancellazione viene chiuso il pannello.
- [FIX] [Compare] Apertura del infoBox al cambiamento dei prodotti (realTimeChange).
- [FIX] [Compare] La tabella non teneva in cosiderazione le disp. di prezzoListino non mostrando effettivamente i pezzi disponibili.
- [FIX] [Compare] Risolto il problema riguardante il TOT wareHouse che impostando i filtri rimaneva sul totale della prima chiamata => ora è stato risolto e cambia il warehouse tot in base al totale dei prodotti filtrati.
- [ADD] [Compare] Virutalized Compare ristrutturato, ora gli elementi vengono creati in maniera dinamica, viene utilizzato il virtualized per evitare un sovraccarico di elementi generando un lag del applicativo stesso, le chiamate per il retrive dei dati inoltre ora vengono fatte suddivise per avere un tempo di risposta dal server in ms (ovvero minimo). Ora le colonne possono essere nascoste in modo da avere solo le colonne desiderate.

## Dev Version: [0.0.6] 28-09-2023
- [FIX] [Dashboard] Ottimizzazioni a livello di prestazioni sulla dashboard => evitando inutili re-renderizzazioni.
- [ADD] [Dashboard] Durante la fase di attesa della risposta da parte del server viene presentato sul client uno Skeleton per far capire all'utente che quel dato sta per essere caricato, una volta che il server invia la risposta lo skeleton scompare e appare il dato in FadeIn.
- [ADD] [Dashboard] Ora la dashboard presente due box funzionanti:
-- Articoli da Modificare (disponibile a tutti gli utenti) => con possibilità di click su numero in modo tale da reindirizzare l'utente con il filtro gia impostato.
-- Utenti connessi attualmente (disponibile agli Admin/Dev)
- [FIX] [Comparatore] La lista degli prodotti non mandava in esclusione gli elementi se veniva aggiunto un prodotto tramite la ricerca => questo comportamento era dovuto alla useCallBack utilizzata per evitare futili re-renderizzazioni, è stato aggiuntà la variabile che se cambiata innesta il reload della funzione in modo tale da lavorare con la lista aggiornata.
- [FIX] [STYLE] [Comparatore] la (i) all'interno di prezzo e disponibilità è stata spostata sulla sinistra in modo tale da avere i prezzi allineati correttamente.
- [FIX] [Comparatore] [SearchBox] Gli elementi presentavano alcuni problemi come l'assenza del EAN o la promo errata su ogni singolo elemento => ora è stato aggiunto il campo EAN e fixato il problema delle promo.
- [FIX] [STYLE] [Comparatore] Ripristinato il bottone del download csv
- [FIX] [STYLE] [Quotation] con la modifica della lunghezza (height) del componente madre componenti come quotation hanno subito un problema per quanto riguarda il centrare perfettamente un elemento singolo => questo problema è stato risolto aggiunengo un altro '<Stack>' genitore con la grandezza massima di tutta la pagina in modo tale da basare i tag figli sullo stack e tornare ad avere un altezza centrata.
- [ADD] [Comparatore] [Tasse-Incl.] Ora Facendo l'onHover su il Label di ogni 'Tasse Incl.' sarà presente la specifica del valore della Siae e della Raee che compone quel prezzo, riadattato in un formato uguale agli altri prezzi.
- [EDIT] [STYLE] [Comparatore] Ora i loghi sono allineati sulla sinistra per rispettare l'allineamento dei prezzi e disponibilità, il testo delle Tasse Incl. è stato variato, rimpicciolendolo per occupare meno spazio nella cella.
- [FIX] [Generale] [Navbar] l'header Navbar rimaneva fisso a 100vh e non in base alla lunghezza della pagina, quindi con lo scroll si bloccava => ora si basa sulla grandezza effettiva della pagina.
- [ADD] [Comparatore] [Filtri] Aggiunto il filtro relativo al selezionamento dei buyers => ora gli admin/dev possono vedere i prodotti e le marche assegnate al buyer selezionato. pannello prettamente disponibile ai ruoli Admin/Dev.
- [FIX] [Comparatore] [Filtri] La casella Gruppo veniva visualizzata non appena veniva inserito il brand => ora al inserimento del brand appare solo ed esclusivamente il campo prefissi correlato, e il campo gruppo viene aggiunto una volta che categorie viene compilato.

- [EDIT] [Amministrazione] [Users] [Controllo-Utenti] La section della data ora ha la logica di virtualized per permettere maggiore fluidità generale dall'applicativo.
- [ADD] [Amministrazione] [Users] Aggiunta del pannello di controllo delle azioni dell'utente => ora è possibile avere un elenco delle azioni svolte dall'utente in modo tale da tener traccia di tutto quello che fa l'utente, il pannello è suddiviso a giorni, in modo tale da avere una ricerca piu rapida, ogni singolo miniBox ha l'azione generica, la descrizione e l'ora in cui è avvenuta.
- [ADD] [Amministrazione] [Users] Aggiungta lastAccess nel retrive delle informazioni per la tabella utente in amministrazione => ultimo accesso di ogni utente sull'applicazione, e aggiunta formattazione della data presente in gestione Gestione Utenti.

- [EDIT] [STYLE] Colore onHover cambiato in base allo stile generale dell'applicazione '#6130ec29', aggiungendo l'animazioni per l'onHover sul colore e la grandezza.
- [ADD] [Comparatore] Aggiunta la struttura per i casi in cui nella stessa Header della colonna ci sono piu elementi.
- [EDIT] [Comparatore] 'Cerca qui' siccome prettamente legato a un utilizzo per il comparatore, è stato spostato all'interno di esso, è stato ristrutturato per permettere l'organizzazione delle variabili in un unico componente riguardante la ricerca, e ottimizzato per evitare eventuali re-renderizzazioni inutili appesantendo il componente madre.
- [FIX] [STYLE] [Comparatore] [Filtri] Riduzione della grandezza del testo per gli elementi troppo lunghi.
- [ADD] [Comparatore] Aggiunta del filtraggio per Prefissi sui brand, elemento che compare automaticamente quando viene selezionato il Brand.
- [RESTRUCTURE] [Comparatore] [FIX] i Gruppi anche se selezionati non venivano effettivamente considerati il che rendeva il select inutile => ora oltre ad aver migliorato il componente vengono effettivamente presi in considerazione e inviati al server.
- [RESTRUCTURE] [Comparatore-index.js] con il cambio della struttura dei filtri si è creata la necessità di migliorare il retrive degli elementi selezionati nei vari filtri il che ha comportato una notevole diminuizione delle righe utilizzate nello script.
- [RESTRUCTURE] [Comparatore-Filtri] Cambio totale della struttura dei filtri => ora vengono formati dinamicamente in base ad un oggetto dichiarato all'inizio del componente madre, in futuro potranno essere generati anche dall'inteligenza artificiale o dal db stesso. Ora i filtri sono strutturati ad AutoComplete invece che in stile classico Select, ovvero si puo digitare all'interno del autocomplete in modo tale da scremare i risultati per migliorare l'esperienza di ricerca, inoltre la lista degli elementi di ogni singolo AutoComplete è strutturata a Virtualized per migliorare le prestazioni dell'applicazione.

- [BackEnd][Svc_User] [ADD] [QueryProducts] [Dashboard] Ora se sei admin o dev vedi le esclusioni di tutti gli utenti invece gli altri ruoli vedono i propri elementi esclusi.
- [BackEnd][Svc_User] [ADD] [UserRoutes] creata la route per il cambio ruolo, attualizzando i dovuti controlli di sicurezza per il cambio della proprietà utente all'interno della collection Users.
- [BackEnd][Svc_User] [FIX] [Dashboard] con l'eliminazione del env il sistema non riusciva a convalidare il token tramite JWT, per assenza effettiva della variabile secret.
- [BackEnd][Svc_User] [ADD] [Dashboard] nuova route disponibile per il retrive dei dati necessari al funzionamento della dashboard.
in[BackEnd][Svc_User]  maniera piu dettagliata: => route Read dedicata alla lettura dei dati. => all'interno è presente la query per il retrive dei dati del comparatore, e i dati riguardanti gli utenti attualmente Online.
- [BackEnd][Svc_User] [ADD] [RESTRUCTURE] il servizio ora supporta la multiconessione con piu DB.
- [BackEnd][Svc_User] [ADD] [RESTRUCTURE] il servizio ora dispone di una strutura gerarchica piu ordinata

- [BackEnd][Svc_Logs] [FIX] Eseguito il fix dovuto al mal funzionamento del servizio, e al non inserimento degli elementi e la loro creazione sul db apposito =>
dovuto al cambio nome delle variabbili nel modello.

- [BackEnd][Svc_Admin] [FIX] [Comparatore] Fixato dei problemi relativi al filtro 'vedere i prodotti assegnati al buyer'. => 
problemi relativi al JWT, Exclution, mongoID, assegnazione del'email alla variabile in maniera corretta.
- [BackEnd][Svc_Admin] [ADD] [Comparatore] Aggiunto il filtro per customizzare la provenienza della richiesta => l'admin/dev puo selezionare i buyer in modo tale da vedere i prodotti assegnati a quel buyer.
- [BackEnd][Svc_Admin] [FIX] [Users] [Assegnazione-Marche] Risolto il problema dovuto al non inserimento corretto nel DB dei brand e delle categorie.
- [BackEnd][Svc_Admin] [FIX] [Comparatore] [Read] Corretto il retrive dei buyers e il controllo di validità del ruolo proveniente da chi fa la richiesta.
- [BackEnd][Svc_Admin] [ADD] [Comparatore] [Read] Gestisce la richiesta proveniente dal comparatore per quanto riguarda il retrive da parte dei buyer per i filtro annesso.
- [BackEnd][Svc_Admin] [ADD] [Users] [Find] Aggiunta dell'API per quanto riguarda il retrive delle informazioni sull'utente in questione.
- [BackEnd][Svc_Admin] [ADD] [Users] Aggiungta la logica e il campo lastAccess sul soket per il salvataggio dell'informazione on Log-in && Log-out => ultimo accesso di ogni utente sull'applicazione.

- [BackEnd][Svc_Compare] [EDIT] [Style] [Community] Aggiunta Opacity al testo "Nessun post trovato ecc..".
- [BackEnd][Svc_Compare] [EDIT] [Style] [Comparatore] Cambio stile del bottone Cerca =>     Purple Style.
- [BackEnd][Svc_Compare] [ADD] [Comparatore] Aggiunto l'EAN visibile all'interno della colonna COD.
- [BackEnd][Svc_Compare] [ADD] [Comparatore] Aggiunta Label Totale Magazzino => somma di tutti i prodotti => Prezzo * disponibilità, dando un valore generale a tutti i prodotti trovati.
- [BackEnd][Svc_Compare] [ADD] [Comparatore] Aggiunta icona (i) vicino al prezzo, con ToolTip in cui è presente il Prezzo Totale del singolo prodotto calcolato => Prezzo * Disponibilità.
- [BackEnd][Svc_Compare] [FIX] [Login-ResetPassword] Errore Schermata PreventDefault durante il reset della password per alcuni utenti
- [BackEnd][Svc_Compare] [FIX] [Comparatore] Aggiunta la possibilità di riinserire gli elementi exclusi nella lista del comparatore, attraverso l'aggiunta della modalità del pannello e la funzione dedicata alla rimozione dalla lista dei prodotti esclusi.
- [BackEnd][Svc_Compare] [FIX] [Comparatore] Aggiunto il Regex per la conversione dei spazi vuoti in % per la query di ricerca dei Brand, in modo tale che il server possa accettare con sucesso la stringa.
- [BackEnd][Svc_Compare] [FIX] [Correlazione-Categorie] Struttura migliorata per garantire una valida esperienza utente, semplificando e ristrutturando diversi processi logici con il Virtualized e VirtualizedNested, diminuendo e ottimizzando le re-renderizzazioni di diverse funzione/variabili/processi logici.
- [BackEnd][Svc_Compare] [FIX] [Comparatore] Prezzo Esprinet è stato fixato in modo tale da dare la somma delle tasse + il prezzo piu basso.
- [BackEnd][Svc_Compare] [FIX] [Comparatore] Bug che non permetteva la visualizzazione degli elementi Esclusi.
- [BackEnd][Svc_Compare] [ADD] [Correlazione-Categorie] Aggiunta del bottone con annesso Menu di selezione su ogni singolo elemento per permettere  l'aggiunta dei fornitori anche in maniera manuale.
- [BackEnd][Svc_Compare] [ADD] [Correlazione-Categorie] Aggiunta del pannello per la correlazione delle categorie con i vari fornitori.
- [BackEnd][Svc_Compare] [FIX] [Exclution/read] nella lettura inviava agli utenti anche valori nulli, eccezione applicata al file => fa una selezione degli elementi solo se != da null.
- [BackEnd][Svc_Compare] [ADD] [Compare] i fornitori vengono mandati dal front per capire quali elementi deve prendere in considerazione per filtrare i prodotti e i relativi dati.
- [BackEnd][Svc_Compare] [ADD] [UploadCSV] ora l'utente puo inserire dei csv customizzati e riceverà dei file csv con all'interno i prezzi e le disponibilità dei vari fornitori. 
- [BackEnd][Svc_Compare] [FIX] [products.js] è stato fixato il problema relativo a keepa, quando non trovava effettivamente il prodotto su keepa mandava in pending la richiesta del client e il server non inviava nessuna risposta => ora viene calcolata questa possibilità e il server rispondo comunque con il dato cercato.
- [BackEnd][Svc_Compare] [ADD] [table.js] Aggiunto e fixato il csv
- [BackEnd][Svc_Compare] [ADD] [tables.js] Ora gestisce la parte della ricerca dei prodotti mirata su un determinato utente inviato dal admin/dev dal front, in modo tale da avere tutti i brand/categorie/prodotti di quel utente specifico
- [BackEnd][Svc_Compare] [EDIT] [tables.js] Il Prefix quando faceva il sanitize si chiamava 'pre' => ora quando viene inviato si chiama 'prx'
- [BackEnd][Svc_Compare] [ADD] [tables.js] Aggiunta del Prefisso alla composizione dinamica dei brand/categorie in base agli elementi trovati dal aggregate per l'implementazione della possibilita di scelta del prefisso dinamico.
- [BackEnd][Svc_Compare] [ADD] [table.js] Aggiunta di warehouse Total => Costo totale del magazzino di tutti i prodotti, warehouse è presente nell'doppio aggreggate e nel invio dei dati al client.
- [BackEnd][Svc_Compare] [ADD] [exclude/delete] Aggiunta della route (index.js) per la rimozione degli elementi dalla lista dei prodotti esclusi. 
- [BackEnd][Svc_Compare] [FIX] [table.js] Regex Sanitizzazione dei brand composti da piu parole nella stessa stringa, in arrivo dal Client

## Current Version: [0.0.5] 28-08-2023
- [FIX] [Auth] Fix del Log-in/Log-out per gli utenti con browser firefox, relativo ad alcune funzioni deprecated e alla gestione e alla dichiarazione dei cookie in maniera piu sicura, inoltre c'era un problema relativo all'eleminazione del vecchio token, il tutto mandava in caricamento eterno gli utenti. 

## Current Version: [0.0.2] 11-12-2023