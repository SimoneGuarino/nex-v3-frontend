# FD Skeleton (Enterprise)

Componenti FD per gestire **loading skeleton** in modo **centralizzato, scalabile e consistente** in tutta l’app.

✅ Obiettivi:
- evitare duplicazione di `<div className="... animate-pulse" />` in giro per il progetto
- poter cambiare stile/animazione in **un solo punto**
- supportare sia **singoli blocchi** sia **mosaici complessi**
- pattern di utilizzo **pulito** e standard per `{loading ? ... : ...}`

---

## Componenti disponibili

### 1) `FDSkeleton`
Building block: un singolo skeleton (rettangolo, cerchio, linea testo).

### 2) `FDSkeletonLayout`
Renderer compositivo “data-driven”: costruisci skeleton complessi tramite una struttura (row/col/grid + block).

### 3) `FDSkeletonSwitch`
Wrapper ergonomico: sostituisce ovunque il pattern:

```tsx
{loading ? <Skeleton /> : <Content />}
```

Con una sintassi standard e riusabile.

### 4) `FDSkeletonPresets`
Preset pronti (factory): casi ricorrenti (field row, avatar+testo, lista card, ecc.).

---

## Import

> Esempio (adatta al tuo path reale):

```tsx
import {
  FDSkeleton,
  FDSkeletonLayout,
  FDSkeletonSwitch,
  FDSkeletonPresets,
} from "components/fd/skeleton/FDSkeleton";
```

---

## Caso 1 — Skeleton singolo (replacement del classico `<div ... animate-pulse />`)

✅ **Prima**:
```tsx
{loading ? (
  <div className="h-9 w-full bg-neutral-700 rounded animate-pulse" />
) : (
  <FDInput ... />
)}
```

✅ **Dopo**:
```tsx
{loading ? (
  <FDSkeleton className="h-9 w-full" />
) : (
  <FDInput ... />
)}
```

Oppure in modo ancora più standard (consigliato):

```tsx
<FDSkeletonSwitch
  loading={loading}
  skeleton={<FDSkeleton className="h-9 w-full" />}
>
  <FDInput ... />
</FDSkeletonSwitch>
```

---

## Caso 2 — Preset (consigliato per uniformare UI)

### Field row (input/select/button)
```tsx
<FDSkeletonSwitch
  loading={loading}
  skeleton={FDSkeletonPresets.fieldRow()}
>
  <FDSelect ... />
</FDSkeletonSwitch>
```

Vantaggio: se un giorno cambi altezza/rounding/effetto del field skeleton,
lo fai nel preset e si aggiorna ovunque.

---

## Caso 3 — Mosaico custom (layout complesso con `FDSkeletonLayout`)

Esempio: titolo + due campi in riga.

```tsx
const layout = {
  type: "col",
  gap: 0.75,
  children: [
    { type: "block", className: "h-6 w-48" }, // titolo
    {
      type: "row",
      gap: 0.5,
      children: [
        { type: "block", className: "h-9 w-40" }, // select
        { type: "block", className: "h-9 w-64" }, // input
      ],
    },
  ],
} as const;

<FDSkeletonSwitch
  loading={loading}
  skeleton={<FDSkeletonLayout layout={layout} />}
/>
```

---

## Caso 4 — Avatar + testo (list item skeleton)

```tsx
const layout = FDSkeletonPresets.avatarWithText();

<FDSkeletonLayout layout={layout} />
```

---

## Caso 5 — Liste / card ripetute

```tsx
const layout = FDSkeletonPresets.cardList(4);

<FDSkeletonSwitch
  loading={loading}
  skeleton={<FDSkeletonLayout layout={layout} />}
>
  <CardsList />
</FDSkeletonSwitch>
```

---

## Caso 6 — Tabelle / griglie (`grid`)

Esempio: grid 3 colonne con 6 celle.

```tsx
const gridLayout = {
  type: "grid",
  columns: 3,
  gap: 0.5,
  children: Array.from({ length: 6 }).map((_, i) => ({
    type: "block",
    key: `cell-${i}`,
    className: "h-24 w-full",
  })),
} as const;

<FDSkeletonLayout layout={gridLayout} />
```

---

## Caso 7 — `keepMounted` (quando NON vuoi smontare il contenuto)

### Quando usarlo
Usalo se il contenuto:
- è “pesante” (tabelle grandi, grafici, componenti complessi)
- ha stato interno che non vuoi resettare al cambio loading

```tsx
<FDSkeletonSwitch
  loading={loading}
  keepMounted
  skeleton={<FDSkeletonLayout layout={FDSkeletonPresets.cardList(3)} />}
>
  <HeavyComponent />
</FDSkeletonSwitch>
```

Comportamento:
- in loading mostra lo skeleton
- il contenuto resta montato ma viene nascosto

---

## Caso 8 — Cambiare forma: `circle` / `text` / `rect`

```tsx
<FDSkeleton shape="circle" className="h-10 w-10" />
<FDSkeleton shape="text" className="h-3 w-1/2" />
<FDSkeleton shape="rect" className="h-24 w-full" />
```

---

## Caso 9 — Disabilitare effetto (no pulse)

```tsx
<FDSkeleton effect="none" className="h-9 w-full" />
```

---

## Caso 10 — Spaziature senza classi dinamiche (gap in rem)

Nel layout puoi usare `gap` (numero) per evitare classi Tailwind dinamiche tipo `gap-3` quando il gap è calcolato.

```tsx
const layout = {
  type: "row",
  gap: 0.75, // 0.75rem
  children: [
    { type: "block", className: "h-9 w-32" },
    { type: "block", className: "h-9 w-64" },
  ],
} as const;

<FDSkeletonLayout layout={layout} />
```

---

## Best practices (molto importanti)

1) **Centralizza tutto lo stile**  
   Se vuoi cambiare colori, rounding o animazione, fallo in `FDSkeleton.tsx`:
   - `BASE_CLASS`
   - `SHAPE_CLASS`
   - `EFFECT_CLASS`

2) **Evita classi Tailwind generate dinamicamente**  
   Non usare pattern tipo:
   - `bg-${color}-700`
   - `rounded-${x}`
   - `grid-cols-${n}`  
   Nel renderer usiamo mapping statici o `style` inline per evitare purge.

3) **Preferisci preset per i pattern ripetuti**  
   Se noti che lo stesso skeleton viene copiato 10 volte, crea un preset in `FDSkeletonPresets`.

4) **Usa `keepMounted` con criterio**  
   È utile per componenti pesanti o con stato, ma non abusarne su tutto (mantiene più roba montata).

---

## FAQ

### Posso mixare JSX custom dentro `FDSkeletonSwitch`?
Sì. `skeleton` accetta qualunque `ReactNode`:
```tsx
<FDSkeletonSwitch
  loading={loading}
  skeleton={
    <div className="space-y-2">
      <FDSkeleton className="h-6 w-40" />
      <FDSkeleton className="h-9 w-full" />
    </div>
  }
>
  <RealContent />
</FDSkeletonSwitch>
```

### Come faccio uno skeleton “per riga” con larghezze diverse?
Usa `FDSkeletonLayout` e crea più `block` con `w-...` diversi (o `style.width`).