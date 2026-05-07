import { FDBox, FDButton } from "@nex/fd-ui";
import type { PendingChange } from "../model/types";

interface Props {
    changes: PendingChange[];
    isPublishing: boolean;
    onDiscard: () => void;
}

export function PendingChangesBar({ changes, isPublishing, onDiscard }: Props) {
    if (!changes.length) {
        return (
            <FDBox radius="2xl" pad="md" border className="bg-neutral-50 text-sm font-semibold text-neutral-500 dark:bg-neutral-900">
                Nessuna modifica in attesa. Le modifiche pubblicate invalidano la cache entitlements.
            </FDBox>
        );
    }

    return (
        <div className="grid gap-4">
            <FDBox radius="2xl" pad="md" border className="bg-neutral-950 text-white dark:bg-black">
                <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-white/50">Draft corrente</div>
                <div className="mt-1 text-2xl font-black tracking-tight">{changes.length} modifiche</div>
                <p className="mt-2 text-sm font-medium leading-6 text-white/65">Controlla il diff prima di pubblicare. Finché non pubblichi, il backend non aggiorna gli entitlements reali.</p>
                <FDButton className="mt-4" size="small" radius="xl" color="error" variant="solid" disabled={isPublishing} onClick={onDiscard}>
                    Scarta draft
                </FDButton>
            </FDBox>

            <div className="grid gap-2">
                {changes.slice().reverse().map((change) => (
                    <FDBox key={change.id} radius="2xl" pad="sm" border className="bg-white dark:bg-neutral-950">
                        <div className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-neutral-500">{change.type}</div>
                        <strong className="mt-1 block text-sm font-black">{change.label}</strong>
                        <small className="mt-2 block text-xs font-semibold text-neutral-500">{new Date(change.createdAt).toLocaleString()}</small>
                    </FDBox>
                ))}
            </div>
        </div>
    );
}
