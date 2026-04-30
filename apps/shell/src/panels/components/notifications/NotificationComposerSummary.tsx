import React from "react";
import { FDBox } from "@nex/fd-ui";
import type { NotificationDraft, SenderOption } from "./shared";

export default function NotificationComposerSummary({
  draft,
  selectedSender,
}: {
  draft: NotificationDraft;
  selectedSender: SenderOption;
}) {
  return (
    <div className="space-y-5">
      <FDBox variant="soft" color="neutral" radius="2xl" pad="md" className="border border-neutral-200 dark:border-neutral-800">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Riepilogo invio</h4>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500 dark:text-neutral-400">Mittente</dt>
            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{selectedSender.label}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500 dark:text-neutral-400">Tipologia</dt>
            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{draft.type}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500 dark:text-neutral-400">Modalità</dt>
            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{draft.modality}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500 dark:text-neutral-400">Stato utenti</dt>
            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{draft.usersTargetStatus}</dd>
          </div>
          {draft.modality === "Singola" ? (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Destinatari</dt>
              <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{draft.user_target.length}</dd>
            </div>
          ) : null}
          {draft.modality === "Ruolo" ? (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Ruolo</dt>
              <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{draft.targetRole || "—"}</dd>
            </div>
          ) : null}
          {draft.timerMode ? (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Timer</dt>
              <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{draft.timer || "—"}</dd>
            </div>
          ) : null}
        </dl>
      </FDBox>

      <FDBox variant="soft" color="neutral" radius="2xl" pad="md" className="border border-neutral-200 dark:border-neutral-800">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Validazioni</h4>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
          <li>Il messaggio è obbligatorio.</li>
          <li>In modalità <strong>Singola</strong> serve almeno una email target.</li>
          <li>In modalità <strong>Ruolo</strong> serve un ruolo selezionato.</li>
          <li>Se il timer è attivo, data e ora devono essere valorizzate.</li>
        </ul>
      </FDBox>
    </div>
  );
}
