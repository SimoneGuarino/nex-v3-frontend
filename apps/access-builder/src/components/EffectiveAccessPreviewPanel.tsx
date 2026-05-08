import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FDBox, FDButton, FDInput, FDSelect, FDSkeleton, FDSwitch, FDTextArea } from "@nex/fd-ui";
import { MdAdd, MdEdit, MdRefresh, MdSave } from "react-icons/md";
import type { EffectiveAccessPreview, RoleOption, UserCreatePayload, UserProfile, UserProfilePatch, UserSummary } from "../model/types";

interface Props {
    users: UserSummary[];
    roles: RoleOption[];
    selectedUserId: string | null;
    selectedActorRole: number;
    selectedUserProfile: UserProfile | null;
    preview: EffectiveAccessPreview | null;
    isLoading: boolean;
    isUserProfileLoading: boolean;
    isUserProfileSaving: boolean;
    onSelectUser: (id: string) => void;
    onSelectActorRole: (role: number) => void;
    onSaveUserProfile: (patch: UserProfilePatch) => Promise<UserProfile | null>;
    onCreateUser: (payload: UserCreatePayload) => Promise<UserProfile>;
    onRefreshUserProfile: () => Promise<UserProfile | null>;
    selectedGroupName?: string | null;
    onAddSelectedUserToSelectedGroup: () => void;
}

type UserFormState = {
    username: string;
    nome: string;
    cognome: string;
    ruolo: number;
    multiRuolo: number[];
    isMEPA: boolean;
    disabilitato: boolean;
    agente: string;
    buyer: string;
    ulterioriAgente: string;
    magazzino: string;
    cellulare: string;
    interno: string;
    fissoSede: string;
    sede: string;
    divisione: string;
    bu: string;
    funzione: string;
    divGeo: string;
    biografia: string;
    avatar: string;
    cover: string;
};

type CreateUserFormState = UserFormState & { password: string };

const emptyUserForm: UserFormState = {
    username: "",
    nome: "",
    cognome: "",
    ruolo: -1,
    multiRuolo: [],
    isMEPA: false,
    disabilitato: false,
    agente: "",
    buyer: "",
    ulterioriAgente: "",
    magazzino: "",
    cellulare: "",
    interno: "",
    fissoSede: "",
    sede: "",
    divisione: "",
    bu: "",
    funzione: "",
    divGeo: "",
    biografia: "",
    avatar: "",
    cover: "",
};

function formFromProfile(profile: UserProfile | null, defaultRole: number): UserFormState {
    if (!profile) return { ...emptyUserForm, ruolo: defaultRole, multiRuolo: defaultRole >= 0 ? [defaultRole] : [] };

    return {
        username: profile.username ?? "",
        nome: profile.nome ?? "",
        cognome: profile.cognome ?? "",
        ruolo: Number(profile.ruolo ?? defaultRole),
        multiRuolo: Array.isArray(profile.multiRuolo) ? profile.multiRuolo.map(Number).filter(Number.isFinite) : [],
        isMEPA: Boolean(profile.isMEPA),
        disabilitato: Boolean(profile.disabilitato),
        agente: normalizeScalar(profile.codici?.agente),
        buyer: normalizeScalar(profile.codici?.buyer),
        ulterioriAgente: Array.isArray(profile.codici?.ulterioriAgente) ? profile.codici.ulterioriAgente.join(", ") : "",
        magazzino: profile.magazzino ?? "",
        cellulare: profile.details?.recapiti?.cellulare ?? "",
        interno: profile.details?.recapiti?.interno ?? "",
        fissoSede: profile.details?.recapiti?.fissoSede ?? "",
        sede: profile.details?.sede ?? "",
        divisione: profile.details?.divisione ?? "",
        bu: profile.details?.bu ?? "",
        funzione: profile.details?.funzione ?? "",
        divGeo: profile.details?.divGeo ?? "",
        biografia: profile.details?.biografia ?? "",
        avatar: profile.details?.immagini?.avatar ?? "",
        cover: profile.details?.immagini?.cover ?? "",
    };
}

function normalizeScalar(value: string | string[] | null | undefined): string {
    if (Array.isArray(value)) return value.join(", ");
    return value ?? "";
}

function splitList(value: string): string[] {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function patchFromForm(form: UserFormState): UserProfilePatch {
    return {
        username: form.username.trim().toLowerCase(),
        nome: form.nome.trim(),
        cognome: form.cognome.trim(),
        ruolo: Number(form.ruolo),
        multiRuolo: form.multiRuolo.map(Number).filter(Number.isFinite),
        isMEPA: form.isMEPA,
        disabilitato: form.disabilitato,
        codici: {
            agente: form.agente.trim() || null,
            buyer: form.buyer.trim() || null,
            ulterioriAgente: splitList(form.ulterioriAgente),
        },
        magazzino: form.magazzino.trim() || null,
        details: {
            recapiti: {
                cellulare: form.cellulare.trim() || null,
                interno: form.interno.trim() || null,
                fissoSede: form.fissoSede.trim() || null,
            },
            sede: form.sede.trim() || null,
            divisione: form.divisione.trim() || null,
            bu: form.bu.trim() || null,
            funzione: form.funzione.trim() || null,
            divGeo: form.divGeo.trim() || null,
            biografia: form.biografia.trim() || null,
            immagini: {
                avatar: form.avatar.trim() || null,
                cover: form.cover.trim() || null,
            },
        },
    };
}

export function EffectiveAccessPreviewPanel({
    users,
    roles,
    selectedUserId,
    selectedActorRole,
    selectedUserProfile,
    preview,
    isLoading,
    isUserProfileLoading,
    isUserProfileSaving,
    onSelectUser,
    onSelectActorRole,
    onSaveUserProfile,
    onCreateUser,
    onRefreshUserProfile,
    selectedGroupName,
    onAddSelectedUserToSelectedGroup,
}: Props) {
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [form, setForm] = useState<UserFormState>(() => formFromProfile(selectedUserProfile, selectedActorRole));
    const [createForm, setCreateForm] = useState<CreateUserFormState>(() => ({ ...emptyUserForm, ruolo: selectedActorRole, multiRuolo: [selectedActorRole], password: "" }));
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setForm(formFromProfile(selectedUserProfile, selectedActorRole));
    }, [selectedUserProfile, selectedActorRole]);

    const userOptions = users.map((user) => ({
        value: user._id,
        label: [user.nome, user.cognome].filter(Boolean).join(" ") || user.username,
    }));

    const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

    const selectedUserLabel = useMemo(() => {
        if (!selectedUserProfile) return "Utente non caricato";
        return [selectedUserProfile.nome, selectedUserProfile.cognome].filter(Boolean).join(" ") || selectedUserProfile.username;
    }, [selectedUserProfile]);

    const canSave = Boolean(form.username.trim()) && Number.isFinite(Number(form.ruolo));
    const canCreate = Boolean(createForm.username.trim() && createForm.nome.trim() && createForm.cognome.trim() && createForm.password.trim().length >= 8 && Number.isFinite(Number(createForm.ruolo)));

    const handleSave = async () => {
        if (!canSave) return;
        setLocalError(null);
        try {
            await onSaveUserProfile(patchFromForm(form));
        } catch (error) {
            setLocalError(String((error as Error)?.message ?? error));
        }
    };

    const handleCreate = async () => {
        if (!canCreate) return;
        setLocalError(null);
        try {
            const patch = patchFromForm(createForm);
            await onCreateUser({
                ...patch,
                username: createForm.username.trim().toLowerCase(),
                nome: createForm.nome.trim(),
                cognome: createForm.cognome.trim(),
                password: createForm.password,
                ruolo: Number(createForm.ruolo),
                multiRuolo: createForm.multiRuolo.map(Number).filter(Number.isFinite),
            });
            setIsCreatingUser(false);
            setCreateForm({ ...emptyUserForm, ruolo: selectedActorRole, multiRuolo: [selectedActorRole], password: "" });
        } catch (error) {
            setLocalError(String((error as Error)?.message ?? error));
        }
    };

    return (
        <div className="grid gap-4">
            <FDBox variant="gradient-simple" radius="2xl" pad="md" border>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-500">Nuovo utente</h3>
                        <p className="mt-1 text-xs font-semibold text-neutral-500">Crea l'utente e poi assegnalo ai team direttamente dal canvas.</p>
                    </div>
                    <FDButton size="small" radius="xl" color="light" variant="outline" icon={<MdAdd />} onClick={() => setIsCreatingUser((value) => !value)}>
                        {isCreatingUser ? "Chiudi" : "Crea"}
                    </FDButton>
                </div>

                {isCreatingUser ? (
                    <div className="mt-4 grid gap-4">
                        <UserProfileForm
                            form={createForm}
                            roles={roles}
                            onChange={setCreateForm}
                            includePassword
                        />
                        <FDButton color="primary" variant="solid" radius="xl" loading={isUserProfileSaving} disabled={!canCreate} onClick={handleCreate}>
                            Crea utente
                        </FDButton>
                    </div>
                ) : null}
            </FDBox>

            <UserHero
                profile={selectedUserProfile}
                title={selectedUserLabel}
                loading={isUserProfileLoading}
                selectedGroupName={selectedGroupName}
                onAddToSelectedGroup={onAddSelectedUserToSelectedGroup}
                onRefresh={() => void onRefreshUserProfile()}
            />

            <div className="grid gap-3">
                <FDSelect
                    label="Preview utente"
                    animatedLabel={false}
                    searchable
                    value={selectedUserId ?? undefined}
                    options={userOptions}
                    onChange={(value) => typeof value === "string" && onSelectUser(value)}
                    fullWidth
                />
                <FDSelect
                    label="actorRole"
                    animatedLabel={false}
                    value={selectedActorRole}
                    options={roleOptions}
                    onChange={(value) => typeof value === "number" && onSelectActorRole(value)}
                    fullWidth
                />
            </div>

            {localError ? (
                <FDBox radius="xl" pad="sm" border className="bg-red-50 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200">
                    {localError}
                </FDBox>
            ) : null}

            <FDBox variant="gradient-simple" radius="2xl" pad="md" border>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-500">Dettagli utente</h3>
                        <p className="mt-1 text-xs font-semibold text-neutral-500">Modifica dati identity + profilo esteso.</p>
                    </div>
                    <FDButton size="small" radius="xl" color="primary" variant="solid" icon={<MdSave />} loading={isUserProfileSaving} disabled={!canSave || isUserProfileLoading} onClick={handleSave}>
                        Salva
                    </FDButton>
                </div>

                {isUserProfileLoading ? <UserProfileSkeleton /> : (
                    <UserProfileForm
                        form={form}
                        roles={roles}
                        onChange={setForm}
                    />
                )}
            </FDBox>

            {isLoading ? (
                <FDBox variant="gradient-simple" radius="2xl" pad="md" border>
                    <div className="grid gap-2">
                        <FDSkeleton shape="text" className="h-4 w-4/5" />
                        <FDSkeleton shape="text" className="h-4 w-3/5" />
                        <FDSkeleton shape="text" className="h-4 w-full" />
                        <FDSkeleton shape="text" className="h-4 w-2/3" />
                    </div>
                </FDBox>
            ) : preview ? (
                <div className="grid gap-3">
                    <PreviewBucket title="Gruppi effettivi" count={preview.groups.length}>
                        {preview.groups.map((group) => (
                            <Chip key={group._id} tone="blue">{group.name}{group.inherited ? " · inherited" : ""}</Chip>
                        ))}
                    </PreviewBucket>

                    <PreviewBucket title="Pannelli visibili" count={preview.panels.length}>
                        {preview.panels.map((panel) => <Chip key={panel._id} tone="green">{panel.name}</Chip>)}
                    </PreviewBucket>

                    <PreviewBucket title="Caps" count={preview.caps.length}>
                        {preview.caps.map((cap) => <CodeItem key={cap}>{cap}</CodeItem>)}
                    </PreviewBucket>

                    <PreviewBucket title="DENY applicati" count={preview.denied.length}>
                        {preview.denied.length === 0 ? <p className="text-sm font-semibold text-neutral-500">Nessun deny applicato.</p> : preview.denied.map((deny) => <CodeItem danger key={deny.permission}>{deny.permission}</CodeItem>)}
                    </PreviewBucket>
                </div>
            ) : (
                <FDBox variant="gradient-simple" radius="2xl" pad="md" border className="text-sm font-semibold text-neutral-500">
                    Seleziona un utente per calcolare la preview.
                </FDBox>
            )}
        </div>
    );
}

function UserHero({ profile, title, loading, selectedGroupName, onAddToSelectedGroup, onRefresh }: { profile: UserProfile | null; title: string; loading: boolean; selectedGroupName?: string | null; onAddToSelectedGroup: () => void; onRefresh: () => void }) {
    const cover = import.meta.env.VITE_API_USERS + profile?.details?.immagini?.cover;
    const avatar = import.meta.env.VITE_API_USERS + profile?.details?.immagini?.avatar;
    const initials = title.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";

    return (
        <FDBox variant="gradient-simple" radius="2xl" shadow="xl" border className="overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-neutral-950">
                {cover ? <img src={cover} alt="Cover utente" className="h-full w-full object-cover" /> : null}
                <button type="button" onClick={onRefresh} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/50" aria-label="Ricarica profilo utente">
                    <MdRefresh />
                </button>
                <div className="absolute left-1/2 top-full grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border-4 border-white bg-white text-2xl font-black text-blue-700 shadow-xl dark:border-neutral-950 dark:bg-neutral-900 dark:text-blue-200">
                    {avatar ? <img src={avatar} alt={title} className="h-full w-full object-cover" /> : initials}
                </div>
            </div>
            <div className="px-4 pb-4 pt-14 text-center">
                <h2 className="text-xl font-black tracking-tight">{loading ? "Caricamento…" : title}</h2>
                <p className="mt-1 truncate text-xs font-bold text-neutral-500">{profile?.username ?? "Seleziona un utente"}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <StatusBadge danger={Boolean(profile?.disabilitato)}>{profile?.disabilitato ? "Disabilitato" : "Attivo"}</StatusBadge>
                    <StatusBadge>{String(profile?.stato?.codice ?? "Offline")}</StatusBadge>
                </div>
                {profile && selectedGroupName ? (
                    <FDButton size="small" radius="xl" color="primary" variant="outline" className="mt-4" onClick={onAddToSelectedGroup}>
                        Inserisci in {selectedGroupName}
                    </FDButton>
                ) : null}
            </div>
        </FDBox>
    );
}

function UserProfileSkeleton() {
    return (
        <div className="grid gap-3">
            <FDSkeleton shape="text" className="h-10 w-full" />
            <FDSkeleton shape="text" className="h-10 w-full" />
            <FDSkeleton shape="text" className="h-10 w-full" />
        </div>
    );
}

function UserProfileForm({ form, roles, onChange, includePassword }: { form: UserFormState | CreateUserFormState; roles: RoleOption[]; onChange: (next: any) => void; includePassword?: boolean }) {
    const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));
    const set = <K extends keyof CreateUserFormState>(key: K, value: CreateUserFormState[K]) => onChange({ ...form, [key]: value });

    return (
        <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <FDInput label="Nome" animatedLabel={false} value={form.nome} onChange={(e) => set("nome", e.target.value)} fullWidth />
                <FDInput label="Cognome" animatedLabel={false} value={form.cognome} onChange={(e) => set("cognome", e.target.value)} fullWidth />
                <FDInput label="Email / username" animatedLabel={false} type="email" value={form.username} onChange={(e) => set("username", e.target.value)} fullWidth />
                {includePassword ? <FDInput label="Password temporanea" animatedLabel={false} type="password" value={(form as CreateUserFormState).password} onChange={(e) => set("password", e.target.value)} helperText="Minimo 8 caratteri" fullWidth /> : null}
                <FDSelect label="Ruolo attivo default" animatedLabel={false} value={form.ruolo} options={roleOptions} onChange={(value) => typeof value === "number" && set("ruolo", value)} fullWidth />
                <FDSelect label="Multi ruolo" animatedLabel={false} multiple searchable value={form.multiRuolo} options={roleOptions} onChange={(value) => Array.isArray(value) && set("multiRuolo", value.map(Number).filter(Number.isFinite))} fullWidth />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <ToggleCard checked={form.disabilitato} label="Utente disabilitato" description="Blocca login e operatività utente." onChange={(checked) => set("disabilitato", checked)} />
                <ToggleCard checked={form.isMEPA} label="Abilitato MEPA" description="Flag operativo per processi MEPA." onChange={(checked) => set("isMEPA", checked)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <FDInput label="Codice agente" animatedLabel={false} value={form.agente} onChange={(e) => set("agente", e.target.value)} fullWidth />
                <FDInput label="Codice buyer" animatedLabel={false} value={form.buyer} onChange={(e) => set("buyer", e.target.value)} fullWidth />
                <FDInput label="Ulteriori agenti" animatedLabel={false} value={form.ulterioriAgente} onChange={(e) => set("ulterioriAgente", e.target.value)} helperText="Separati da virgola" fullWidth />
                <FDInput label="Magazzino" animatedLabel={false} value={form.magazzino} onChange={(e) => set("magazzino", e.target.value)} fullWidth />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <FDInput label="Cellulare" animatedLabel={false} value={form.cellulare} onChange={(e) => set("cellulare", e.target.value)} fullWidth />
                <FDInput label="Interno" animatedLabel={false} value={form.interno} onChange={(e) => set("interno", e.target.value)} fullWidth />
                <FDInput label="Fisso sede" animatedLabel={false} value={form.fissoSede} onChange={(e) => set("fissoSede", e.target.value)} fullWidth />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <FDInput label="Sede" animatedLabel={false} value={form.sede} onChange={(e) => set("sede", e.target.value)} fullWidth />
                <FDInput label="Divisione" animatedLabel={false} value={form.divisione} onChange={(e) => set("divisione", e.target.value)} fullWidth />
                <FDInput label="BU" animatedLabel={false} value={form.bu} onChange={(e) => set("bu", e.target.value)} fullWidth />
                <FDInput label="Funzione" animatedLabel={false} value={form.funzione} onChange={(e) => set("funzione", e.target.value)} fullWidth />
                <FDInput label="Divisione geografica" animatedLabel={false} value={form.divGeo} onChange={(e) => set("divGeo", e.target.value)} fullWidth />
            </div>

            <div className="grid gap-3">
                <FDInput label="Avatar URL" animatedLabel={false} value={form.avatar} onChange={(e) => set("avatar", e.target.value)} fullWidth />
                <FDInput label="Cover URL" animatedLabel={false} value={form.cover} onChange={(e) => set("cover", e.target.value)} fullWidth />
                <FDTextArea label="Biografia" value={form.biografia} rows={4} autoResize={false} onChange={(e) => set("biografia", e.target.value)} fullWidth />
            </div>
        </div>
    );
}

{/*<button
            type="button"
            onClick={() => onChange(!checked)}
            className={`rounded-2xl border p-3 text-left transition ${checked ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"}`}
            aria-pressed={checked}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-black">{label}</div>
                    <p className="mt-1 text-xs font-semibold opacity-70">{description}</p>
                </div>
                <span className={`mt-0.5 h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-700"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} />
                </span>
            </div>
        </button>*/}
function ToggleCard({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
    return (
        <FDBox pad="sm" radius="xl">
            <div>
                <div className="text-sm font-black">{label}</div>
                <p className="mt-1 text-xs font-semibold opacity-70">{description}</p>
            </div>
            <FDSwitch
                checked={checked}
                onClick={() => onChange(!checked)}
                aria-pressed={checked}
                className="mt-3"
            />
        </FDBox>

    );
}

function PreviewBucket({ title, count, children }: { title: string; count: number; children: ReactNode }) {
    return (
        <FDBox variant="gradient-simple" radius="2xl" pad="sm" border>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">{title}</h3>
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-black text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{count}</span>
            </div>
            <div className="max-h-44 overflow-auto">{children}</div>
        </FDBox>
    );
}

function Chip({ children, tone }: { children: ReactNode; tone: "blue" | "green" }) {
    return (
        <span className={`mb-2 mr-2 inline-flex rounded-full px-3 py-1.5 text-xs font-black ${tone === "blue" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"}`}>
            {children}
        </span>
    );
}

function StatusBadge({ children, danger }: { children: ReactNode; danger?: boolean }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-black ${danger ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200" : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"}`}>
            {children}
        </span>
    );
}

function CodeItem({ children, danger }: { children: ReactNode; danger?: boolean }) {
    return (
        <code className={`mb-2 block truncate rounded-xl px-3 py-2 text-xs font-bold ${danger ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200" : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"}`}>{children}</code>
    );
}
