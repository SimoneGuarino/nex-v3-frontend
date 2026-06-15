// src/layouts/queryAS400/components/adhoc-editor.tsx
/**
 * descrizione: editor per query ad-hoc con campi titolo/descrizione/SELECT, selezione multipla dei tags (ruoli) e azioni salva/esegui.
 * note:        lasciare i tags vuoti significa "pubblica" (tutti i ruoli).
 * dipendenze:  useSurfaceTokens, FDButton/FDBox, MUI TextField/Select.
 */
import React from "react";
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    FormHelperText,
} from "@mui/material";
import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import { useSurfaceTokens } from "../hooks/use-surface-tokens";
import { MdPlayArrow, MdSave } from "react-icons/md";
import type { IconType } from "react-icons";

type RoleOption = { id: number; ruolo: string };

// wrapper typesafe per icone react-icons
const RI: React.FC<{ as: IconType; size?: number | string; title?: string; className?: string }> = ({
    as: Icon,
    size = 18,
    ...rest
}) => React.createElement(Icon as React.ComponentType<any>, { size, ...rest });

export default function AdhocEditor({
    titolo,
    descrizione,
    sql,
    selectedTags,
    rolesOptions,
    onChangeTitolo,
    onChangeDescrizione,
    onChangeSql,
    onChangeTags,
    onExec,
    onAskSave,
    execLoading,
    saveLoading,
    titoloError,
    sqlError,
    tagsError
}: {
    titolo: string;
    descrizione: string;
    sql: string;
    selectedTags: string[];
    rolesOptions: RoleOption[];
    onChangeTitolo: (v: string) => void;
    onChangeDescrizione: (v: string) => void;
    onChangeSql: (v: string) => void;
    onChangeTags: (tags: string[]) => void;
    onExec: () => void;
    onAskSave: () => void;
    execLoading: boolean;
    saveLoading: boolean;
    titoloError?: string | null;
    sqlError?: string | null;
    tagsError?: string | null;
}) {
    const { borderColor, mutedText } = useSurfaceTokens();

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
        <FDBox radius="2xl" shadow="sm" className="h-full">
            {/* header */}
            <FDBox variant="ghost" className="p-3">
                <h3 className="m-0 text-base font-semibold">Query diretta</h3>
                <p className="text-sm mt-1" style={{ color: String(mutedText) }}>
                    compila i campi per salvare o eseguire una SELECT
                </p>
            </FDBox>

            {/* contenuto */}
            <FDBox variant="ghost" className="p-4 pt-0">
                <div className="flex flex-col gap-3">
                    <TextField
                        label="titolo *"
                        placeholder="es. giacenze per articolo"
                        value={titolo}
                        onChange={(e) => onChangeTitolo(e.target.value)}
                        error={!!titoloError}
                        helperText={titoloError || " "}
                        fullWidth
                    />

                    <TextField
                        label="descrizione"
                        placeholder="facoltativa"
                        value={descrizione}
                        onChange={(e) => onChangeDescrizione(e.target.value)}
                        fullWidth
                    />

                    {/* selezione multipla ruoli/tags: vuoto = pubblica */}
                    <FormControl fullWidth error={!!tagsError}>
                        <InputLabel id="tags-roles-label">tags (ruoli) — lascia vuoto per tutti</InputLabel>
                        <Select
                            labelId="tags-roles-label"
                            multiple
                            value={selectedTags}
                            className="p-3"
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
                                onChangeTags(
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
                        <FormHelperText>
                            {tagsError || "se non selezioni ruoli, la query sarà visibile a tutti"}
                        </FormHelperText>
                    </FormControl>

                    <TextField
                        label="query (SELECT) *"
                        placeholder="scrivi qui la SELECT…"
                        value={sql}
                        onChange={(e) => onChangeSql(e.target.value)}
                        error={!!sqlError}
                        helperText={sqlError || " "}
                        fullWidth
                        multiline
                        minRows={10}
                    />

                    {/* azioni */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <FDButton
                            variant="outline"
                            color="neutral"
                            onClick={() => {
                                onChangeTitolo("");
                                onChangeDescrizione("");
                                onChangeSql("");
                                onChangeTags([]);
                            }}
                        >
                            Pulisci campi
                        </FDButton>

                        <div className="flex items-center gap-2">
                            <FDButton
                                variant="outline"
                                color="primary"
                                icon={<RI as={MdSave} size={18} />}
                                onClick={onAskSave}
                                disabled={execLoading || saveLoading}
                                loading={saveLoading}
                            >
                                Salva
                            </FDButton>

                            <FDButton
                                variant="solid"
                                color="success"
                                icon={<RI as={MdPlayArrow} size={18} />}
                                onClick={onExec}
                                disabled={execLoading}
                                loading={execLoading}
                            >
                                Esegui
                            </FDButton>
                        </div>
                    </div>
                </div>
            </FDBox>
        </FDBox>
    );
}
