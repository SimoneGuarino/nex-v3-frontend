import { FDBox, FDButton, FDSelect } from "@nex/fd-ui";
import type { AccessGroup, GroupMembership, PermissionGrant, UserSummary } from "../model/types";

interface Props {
    group: AccessGroup | null;
    memberships: GroupMembership[];
    grants: PermissionGrant[];
    users: UserSummary[];
    selectedUserId: string | null;
    onSelectUser: (id: string) => void;
    onAddSelectedUser: () => void;
    onRemoveMembership: (membershipId: string) => void;
    onRemoveGrant: (grantId: string) => void;
}

export function GroupInspectorPanel({ group, memberships, grants, users, selectedUserId, onSelectUser, onAddSelectedUser, onRemoveMembership, onRemoveGrant }: Props) {
    if (!group) {
        return (
            <FDBox radius="2xl" pad="md" border className="bg-neutral-50 text-sm font-semibold text-neutral-500 dark:bg-neutral-900">
                Seleziona un blocco nel canvas per vedere dettagli, membri e grants.
            </FDBox>
        );
    }

    const userOptions = users.map((user) => ({
        value: user._id,
        label: [user.nome, user.cognome].filter(Boolean).join(" ") || user.username,
    }));

    return (
        <div className="grid gap-4">
            <FDBox radius="2xl" pad="md" border className="bg-white dark:bg-neutral-950">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">{group.kind}</div>
                        <h2 className="mt-1 truncate text-xl font-black tracking-tight">{group.name}</h2>
                        <code className="mt-2 block truncate rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{group.key}</code>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${group.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`}>{group.status}</span>
                </div>
                <p className="mt-4 text-sm font-medium leading-6 text-neutral-600 dark:text-neutral-300">{group.description || "Nessuna descrizione configurata per questo gruppo."}</p>
            </FDBox>

            <div className="grid grid-cols-3 gap-2">
                <Metric label="Membri" value={memberships.length} />
                <Metric label="Grant" value={grants.length} />
                <Metric label="Ereditati" value={group.inheritedGrantsCount ?? 0} />
            </div>

            <FDBox radius="2xl" pad="md" border className="bg-white dark:bg-neutral-950">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-500">Membri diretti</h3>
                        <p className="mt-1 text-xs font-semibold text-neutral-500">Aggiungi o rimuovi utenti dal gruppo selezionato.</p>
                    </div>
                </div>
                <div className="mb-4 grid gap-2">
                    <FDSelect
                        label="Utente"
                        animatedLabel={false}
                        searchable
                        value={selectedUserId ?? undefined}
                        options={userOptions}
                        onChange={(value) => typeof value === "string" && onSelectUser(value)}
                        fullWidth
                    />
                    <FDButton radius="xl" color="primary" variant="solid" disabled={!selectedUserId} onClick={onAddSelectedUser}>
                        Aggiungi utente al gruppo
                    </FDButton>
                </div>

                <div className="grid gap-2">
                    {memberships.length === 0 ? (
                        <p className="text-sm font-semibold text-neutral-500">Nessun membro diretto.</p>
                    ) : memberships.map((membership) => (
                        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900" key={membership._id}>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">{membership.user?.nome?.[0] ?? "U"}</span>
                            <div className="min-w-0 flex-1">
                                <strong className="block truncate text-sm">{[membership.user?.nome, membership.user?.cognome].filter(Boolean).join(" ") || membership.userId}</strong>
                                <small className="block truncate text-xs font-semibold text-neutral-500">{membership.user?.username}</small>
                            </div>
                            <FDButton size="small" radius="xl" color="error" variant="soft" onClick={() => onRemoveMembership(membership._id)}>
                                Rimuovi
                            </FDButton>
                        </div>
                    ))}
                </div>
            </FDBox>

            <FDBox radius="2xl" pad="md" border className="bg-white dark:bg-neutral-950">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-500">Grants diretti</h3>
                <div className="mt-3 grid gap-2">
                    {grants.length === 0 ? (
                        <p className="text-sm font-semibold text-neutral-500">Nessun grant diretto.</p>
                    ) : grants.map((grant) => (
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900" key={grant._id}>
                            <div className="flex items-center justify-between gap-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${grant.effect === "ALLOW" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200" : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-200"}`}>{grant.effect}</span>
                                <FDButton size="small" radius="xl" color="error" variant="ghost" onClick={() => onRemoveGrant(grant._id)}>
                                    Rimuovi
                                </FDButton>
                            </div>
                            <code className="mt-3 block truncate rounded-xl bg-white px-3 py-2 text-xs font-bold text-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">{grant.permission}</code>
                            <small className="mt-2 block text-xs font-semibold text-neutral-500">{grant.context?.actorRoles?.length ? `actorRole: ${grant.context.actorRoles.join(", ")}` : "role-agnostic"}</small>
                        </div>
                    ))}
                </div>
            </FDBox>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <FDBox radius="2xl" pad="sm" border className="bg-white text-center dark:bg-neutral-950">
            <strong className="block text-xl font-black tracking-tight">{value}</strong>
            <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-neutral-500">{label}</span>
        </FDBox>
    );
}
