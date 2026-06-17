// src/layouts/queryAS400/components/edit-query-dialog.tsx
/**
 * descrizione: modale per modificare una query salvata (titolo, SELECT, descrizione, tags) con validazione e conferma.
 * dipendenze:  FDDialog, FDButton, useSurfaceTokens, MUI TextField/Select.
 */
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    FormHelperText,
} from "@mui/material";
import { FDDialog, FDButton } from "@nex/fd-ui";
import { useSurfaceTokens } from "../hooks/use-surface-tokens";
import type { QueryAS400 } from "../types";
import { MdSave } from "react-icons/md";
import type { IconType } from "react-icons";

const RI: React.FC<{ as: IconType; size?: number | string; title?: string; className?: string }> = ({
    as: Icon,
    size = 18,
    ...rest
}) => React.createElement(Icon as React.ComponentType<any>, { size, ...rest });

const startsWithSelect = (v: string) => /^\s*select\b/i.test(v || "");
type RoleOption = { id: number; ruolo: string };

export default function EditQueryDialog({
    open,
    initial,
    rolesOptions,
    onClose,
    onSubmit,
}: {
    open: boolean;
    initial: Pick<QueryAS400, "id" | "titolo" | "query" | "descrizione" | "tags">;
    rolesOptions: RoleOption[];
    onClose: () => void;
    onSubmit: (patch: { titolo: string; query: string; descrizione: string | null; tags: string[] }) => void;
}) {
    const [titolo, setTitolo] = useState(initial.titolo);
    const [sql, setSql] = useState(initial.query);
    const [descrizione, setDescrizione] = useState(initial.descrizione ?? "");
    const [tags, setTags] = useState<string[]>(initial.tags ?? []);
    const [errors, setErrors] = useState<{ titolo?: string; query?: string }>({});
    const [askConfirm, setAskConfirm] = useState(false);

    const { paperBg, borderColor, mutedText, stickyHeaderBg, stickyHeaderText, codeBg } = useSurfaceTokens();

    useEffect(() => {
        if (open) {
            setTitolo(initial.titolo);
            setSql(initial.query);
            setDescrizione(initial.descrizione ?? "");
            setTags(Array.isArray(initial.tags) ? initial.tags : []);
            setErrors({});
            setAskConfirm(false);
        }
    }, [open, initial]);

    const validate = () => {
        const e: typeof errors = {};
        if (!titolo.trim()) e.titolo = "titolo obbligatorio";
        if (!sql.trim()) e.query = "query obbligatoria";
        else if (!startsWithSelect(sql)) e.query = "la query deve iniziare con SELECT";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = () => {
        if (!validate()) return;
        setAskConfirm(true);
    };

    const cleanTags = (raw: string[]) =>
        Array.from(new Set(raw.map((s) => s.trim()).filter(Boolean)));

    const confirm = () => {
        setAskConfirm(false);
        onSubmit({
            titolo: titolo.trim(),
            query: sql.trim(),
            descrizione: descrizione.trim() ? descrizione.trim() : null,
            tags: cleanTags(tags),
        });
    };

    const labelForTag = (val: string) =>
        rolesOptions.find((r) => String(r.id) === val)?.ruolo ?? val;

    const TagPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <span
            className="inline-block h-5 leading-5 text-[11px] uppercase tracking-[0.3px] px-2 rounded-full whitespace-nowrap"
            style={{ border: `1px solid ${String(borderColor)}`, color: String(mutedText) }}
        >
            {children}
        </span>
    );

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        bgcolor: paperBg,
                        border: "1px solid",
                        borderColor,
                        borderRadius: "1rem", // ≈ rounded-2xl
                        overflow: "hidden",
                        color: mutedText,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        pb: 1,
                        bgcolor: stickyHeaderBg,
                        color: stickyHeaderText,
                        borderBottom: "1px solid",
                        borderBottomColor: borderColor,
                        lineHeight: 1.2,
                        fontWeight: 600,
                        fontSize: 16,
                    }}
                >
                    Modifica la query
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        pt: 1,
                        bgcolor: paperBg,
                        color: mutedText,
                        "&.MuiDialogContent-dividers": {
                            borderTopColor: borderColor,
                            borderBottomColor: borderColor,
                        },
                    }}
                >
                    <div className="flex flex-col gap-3 pt-1">
                        <TextField
                            label="titolo *"
                            value={titolo}
                            onChange={(e) => setTitolo(e.target.value)}
                            error={!!errors.titolo}
                            helperText={errors.titolo || " "}
                            fullWidth
                        />

                        <TextField
                            label="query (SELECT) *"
                            value={sql}
                            onChange={(e) => setSql(e.target.value)}
                            error={!!errors.query}
                            helperText={errors.query || " "}
                            fullWidth
                            multiline
                            minRows={5}
                        />

                        <TextField
                            label="descrizione"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            fullWidth
                            placeholder="facoltativa"
                        />

                        <FormControl fullWidth>
                            <InputLabel id="edit-tags-roles-label">tags (ruoli) — lascia vuoto per tutti</InputLabel>
                            <Select
                                labelId="edit-tags-roles-label"
                                multiple
                                className="p-3"
                                value={tags}
                                input={<OutlinedInput label="tags (ruoli) — lascia vuoto per tutti" />}
                                renderValue={(selected) => (
                                    <div className="flex gap-1.5 flex-wrap py-1">
                                        {(selected as string[]).map((val) => (
                                            <TagPill key={val}>{labelForTag(val)}</TagPill>
                                        ))}
                                    </div>
                                )}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTags(
                                        typeof value === "string"
                                            ? value.split(",").filter(Boolean)
                                            : (value as string[])
                                    );
                                }}
                                MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
                            >
                                {rolesOptions.map((r) => {
                                    const value = String(r.id);
                                    return (
                                        <MenuItem key={value} value={value}>
                                            {r.ruolo} ({value})
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            <FormHelperText >se non selezioni ruoli, la query sarà visibile a tutti</FormHelperText>
                        </FormControl>
                    </div>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 2,
                        pb: 2,
                        gap: 1,
                        bgcolor: paperBg,
                        borderTop: "1px solid",
                        borderTopColor: borderColor,
                    }}
                >
                    <FDButton variant="outline" color="neutral" onClick={onClose}>
                        Annulla
                    </FDButton>
                    <FDButton
                        variant="solid"
                        color="primary"
                        icon={<RI as={MdSave} size={18} />}
                        onClick={submit}
                    >
                        Aggiorna
                    </FDButton>
                </DialogActions>
            </Dialog>

            {/* conferma finale */}
            <FDDialog
                open={askConfirm}
                onClose={() => setAskConfirm(false)}
                title="Confermi aggiornamento?"
                confirmText="Aggiorna"
                onConfirm={confirm}
                color="primary"
            >
                <div className="flex flex-col gap-2 text-sm">
                    <p>
                        <b>Titolo:</b> <span>{titolo}</span>
                    </p>
                    <p className="break-words whitespace-pre-wrap">
                        <b>Query:</b>{" "}
                        <code className="rounded px-1" style={{ background: String(codeBg) }}>
                            {sql}
                        </code>
                    </p>
                    <p>
                        <b>Descrizione:</b>{" "}
                        {descrizione.trim() ? <span>{descrizione}</span> : <i>—</i>}
                    </p>
                    <p>
                        <b>Visibilità:</b>{" "}
                        {cleanTags(tags).length === 0 ? (
                            <i>pubblica (tutti i ruoli)</i>
                        ) : (
                            <span>limitata ai ruoli selezionati</span>
                        )}
                    </p>
                    {cleanTags(tags).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {cleanTags(tags).map((t) => (
                                <TagPill key={t}>{`${labelForTag(t)} (${t})`}</TagPill>
                            ))}
                        </div>
                    )}
                </div>
            </FDDialog>
        </>
    );
}
