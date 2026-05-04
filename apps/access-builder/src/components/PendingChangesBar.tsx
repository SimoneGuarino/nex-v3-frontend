import type { PendingChange } from "../model/types";

interface Props {
  changes: PendingChange[];
  isPublishing: boolean;
  onDiscard: () => void;
}

export function PendingChangesBar({ changes, isPublishing, onDiscard }: Props) {
  if (!changes.length) {
    return <footer className="ab-pending-bar empty">Nessuna modifica in attesa. Le modifiche pubblicate invalidano la cache entitlements.</footer>;
  }

  return (
    <footer className="ab-pending-bar">
      <strong>{changes.length} modifiche in draft</strong>
      <div>
        {changes.slice(-4).map((change) => <span key={change.id}>{change.label}</span>)}
      </div>
      <button type="button" className="ab-pending-discard" disabled={isPublishing} onClick={onDiscard}>Scarta draft</button>
    </footer>
  );
}
