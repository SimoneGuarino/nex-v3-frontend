// src/layouts/queryAS400/components/save-adhoc-dialog.tsx
/**
 * descrizione: dialog di conferma salvataggio per query diretta, mostra riepilogo di titolo/sql/descrizione e visibilità tramite tags (ruoli).
 * dipendenze:  FDDialog, useSurfaceTokens per i token (pill e code).
 */
import React from "react";
import { FDDialog } from "@nex/fd-ui";
import { useSurfaceTokens } from "../hooks/use-surface-tokens";

type RoleOption = { id: number; ruolo: string };

export default function SaveAdhocDialog({
    open,
    onClose,
    onConfirm,
    loading,
    titolo,
    sql,
    descrizione,
    tags,
    rolesOptions,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    titolo: string;
    sql: string;
    descrizione: string;
    tags: string[];
    rolesOptions?: RoleOption[];
}) {
    const { borderColor, mutedText, codeBg } = useSurfaceTokens();

    const labelForTag = (val: string) =>
        rolesOptions?.find((r) => String(r.id) === val)?.ruolo ?? val;

    const TagPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <span
            className="inline-block h-5 leading-5 text-[11px] uppercase tracking-[0.3px] px-2 rounded-full whitespace-nowrap"
            style={{ border: `1px solid ${String(borderColor)}`, color: String(mutedText) }}
        >
            {children}
        </span>
    );

    return (
        <FDDialog
            open={open}
            onClose={onClose}
            title="Confermi il salvataggio?"
            confirmText="Salva"
            loading={loading}
            onConfirm={onConfirm}
            color="primary"
        >
            <div className="flex flex-col gap-2 text-sm">
                <p className="mt-2">
                    <b>Titolo:</b>{" "}
                    {titolo ? <span>{titolo}</span> : <i>(vuoto)</i>}
                </p>

                <p className="break-words whitespace-pre-wrap">
                    <b>Query:</b>{" "}
                    <code
                        className="rounded px-1"
                        style={{ background: String(codeBg) }}
                    >
                        {sql || "(vuota)"}
                    </code>
                </p>

                <p>
                    <b>Descrizione:</b>{" "}
                    {descrizione.trim() ? <span>{descrizione}</span> : <i>—</i>}
                </p>

                <p>
                    <b>Visibilità:</b>{" "}
                    {tags.length === 0 ? (
                        <i>pubblica (tutti i ruoli)</i>
                    ) : (
                        <span>limitata ai ruoli selezionati</span>
                    )}
                </p>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                            <TagPill key={t}>{`${labelForTag(t)} (${t})`}</TagPill>
                        ))}
                    </div>
                )}
            </div>
        </FDDialog>
    );
}
