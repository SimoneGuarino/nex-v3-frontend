import type { PendingChange } from "../model/types";
import { FDBox, FDButton } from "@nex/fd-ui";

interface Props {
    pendingChanges: PendingChange[];
    onPublish: () => Promise<{ ok: true; applied: number }>;
}

export function AccessBuilderHeader({ pendingChanges, onPublish }: Props) {
    return (
        <FDBox className="flex justify-between" pad="sm" radius="md">
            <div>
                <div className="ab-eyebrow">NEX v3 · Access Control</div>
                <h1>Access Builder</h1>
            </div>

            <FDButton disabled={pendingChanges.length === 0} onClick={onPublish}>
                Pubblica {pendingChanges.length > 0 ? `(${pendingChanges.length})` : ""}
            </FDButton>
        </FDBox>
    );
}
