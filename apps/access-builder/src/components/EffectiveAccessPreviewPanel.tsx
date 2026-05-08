import type { ReactNode } from "react";
import { FDBox, FDSelect, FDSkeleton } from "@nex/fd-ui";
import type { EffectiveAccessPreview, RoleOption, UserSummary } from "../model/types";

interface Props {
    users: UserSummary[];
    roles: RoleOption[];
    selectedUserId: string | null;
    selectedActorRole: number;
    preview: EffectiveAccessPreview | null;
    isLoading: boolean;
    onSelectUser: (id: string) => void;
    onSelectActorRole: (role: number) => void;
}

export function EffectiveAccessPreviewPanel({ users, roles, selectedUserId, selectedActorRole, preview, isLoading, onSelectUser, onSelectActorRole }: Props) {
    const userOptions = users.map((user) => ({
        value: user._id,
        label: [user.nome, user.cognome].filter(Boolean).join(" ") || user.username,
    }));

    const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

    return (
        <div className="grid gap-4">
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

function CodeItem({ children, danger }: { children: ReactNode; danger?: boolean }) {
    return (
        <code className={`mb-2 block truncate rounded-xl px-3 py-2 text-xs font-bold ${danger ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200" : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"}`}>{children}</code>
    );
}
