import { clearSession, closeGlobalPanel, readSharedSessionSnapshot } from "@nex/shared-platform";

export default function ProfilePanel() {
    const session = readSharedSessionSnapshot();
    return (
        <div style={{ minHeight: 360, display: "grid", gridTemplateRows: "auto 1fr auto" }}>
            <div style={{ padding: 16, borderBottom: "1px solid rgba(148,163,184,.18)" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Profilo utente</div>
                <div style={{ fontSize: 12, opacity: .7 }}>Pannello globale shell-owned</div>
            </div>
            <div style={{ padding: 16, display: "grid", gap: 10 }}>
                <div><strong>Nome:</strong> {session?.details?.nome ?? "-"}</div>
                <div><strong>Cognome:</strong> {session?.details?.cognome ?? "-"}</div>
                <div><strong>Ruolo:</strong> {String(session?.details?.ruolo ?? "-")}</div>
                <div><strong>ID:</strong> {session?.details?._id ?? "-"}</div>
            </div>
            <div style={{ padding: 16, borderTop: "1px solid rgba(148,163,184,.18)", display: "flex", justifyContent: "space-between" }}>
                <button type="button" onClick={() => closeGlobalPanel("profile-close")}>Chiudi</button>
                <button type="button" onClick={() => { clearSession(); window.location.assign('/login'); }}>Logout</button>
            </div>
        </div>
    );
}
