import { FDBox, FDButton } from "@nex/fd-ui";
import type { PendingChange } from "../model/types";

interface Props {
    pendingChanges: PendingChange[];
    onPublish: () => Promise<{ ok: true; applied: number }>;
}

export function AccessBuilderHeader({ pendingChanges, onPublish }: Props) {
    return (
        <FDBox className="flex items-center justify-between gap-4 bg-white dark:bg-neutral-900" pad="sm" radius="2xl" shadow="lg" border>
            <div className="min-w-0">
                <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">NEX v3 · Access Control</div>
                <h1 className="truncate text-xl font-black tracking-tight">Access Builder</h1>
            </div>

            <FDButton disabled={pendingChanges.length === 0} onClick={onPublish} color="primary" variant="solid" radius="xl">
                Pubblica {pendingChanges.length > 0 ? `(${pendingChanges.length})` : ""}
            </FDButton>
        </FDBox>
    );
}
