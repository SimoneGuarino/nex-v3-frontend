import type { PendingChange } from "../model/types";

interface Props {
  changes: PendingChange[];
}

export function PendingChangesBar({ changes }: Props) {
  if (!changes.length) {
    return <footer className="ab-pending-bar empty">Nessuna modifica in attesa. Le modifiche pubblicate dovranno invalidare la cache entitlements.</footer>;
  }

  return (
    <footer className="ab-pending-bar">
      <strong>{changes.length} modifiche in draft</strong>
      <div>
        {changes.slice(-4).map((change) => <span key={change.id}>{change.label}</span>)}
      </div>
    </footer>
  );
}
