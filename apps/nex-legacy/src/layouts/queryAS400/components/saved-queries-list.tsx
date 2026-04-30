// src/layouts/queryAS400/components/saved-queries-list.tsx
/**
 * descrizione: tabella compatta delle query salvate con tre colonne:
 *              - titolo (su mobile mostra anche i tag)
 *              - tags (solo da sm in su)
 *              - descrizione + azioni (esegui, modifica, elimina)
 *
 * dipendenze:
 * - MUI: Table, TableContainer, Skeleton
 * - componenti interni: FDBox, FDIconButton
 * - react-icons per le icone azione (MdPlayArrow, MdEdit, MdDelete)
 *
 * prestazioni:
 * - il componente è memoizzato con `React.memo`
 * - ottimale per liste medio-piccole; per migliaia di righe valutare virtualizzazione
 *
 * props:
 * - queries: QueryAS400[]                         // righe da mostrare
 * - loading: boolean                              // stato caricamento lista
 * - onExec: (id: string) => void                  // callback esecuzione query
 * - onEdit: (q: QueryAS400) => void               // callback modifica
 * - onDelete: (q: QueryAS400) => void             // callback eliminazione
 * - execLoadingId: string | null                  // id riga in esecuzione per mostrare loading sul pulsante
 * - canManage?: boolean                           // abilita i pulsanti di gestione (default: false)
 * - rolesMap?: Record<string, string>             // mappa role_id -> etichetta leggibile per i tag
 *
 * note:
 * - il backend può già filtrare per ruolo; `rolesMap` serve solo a mostrare etichette leggibili
 * - i tag vuoti equivalgono a "tutti"
 */

import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Skeleton } from "@mui/material";
import FDBox from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { MdPlayArrow, MdEdit, MdDelete } from "react-icons/md";
import type { IconType } from "react-icons";
import { useSurfaceTokens } from "../hooks/use-surface-tokens";
import type { QueryAS400 } from "../types";


/** wrapper typesafe per icone react-icons */
const RI: React.FC<{ as: IconType; size?: number | string; title?: string; className?: string }> = ({
    as: Icon, size = 18, ...rest
}) => React.createElement(Icon as React.ComponentType<any>, { size, ...rest });

type Props = {
    queries: QueryAS400[];
    loading: boolean;
    onExec: (id: string) => void;
    onEdit: (q: QueryAS400) => void;
    onDelete: (q: QueryAS400) => void;
    execLoadingId: string | null;
    canManage?: boolean;
    rolesMap?: Record<string, string>;
};

function SavedQueriesListBase({
    queries, loading, onExec, onEdit, onDelete, execLoadingId, canManage = false, rolesMap,
}: Props) {
    const {
        paperBg, mutedText, stripeBg, stickyHeaderBg, stickyHeaderText, tableBorderColor, borderColor,
    } = useSurfaceTokens();

    const iconBtnClasses =
        "min-w-[36px] w-9 h-9 p-0 inline-flex items-center justify-center";

    const TagPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <span
            className="inline-block h-5 leading-5 text-[11px] uppercase tracking-[0.3px] px-2 rounded-full whitespace-nowrap"
            style={{ border: `1px solid ${String(borderColor)}`, color: String(mutedText) }}
        >
            {children}
        </span>
    );

    const renderTags = (tags?: string[]) => {
        const t = Array.isArray(tags) ? tags.filter(Boolean) : [];
        if (t.length === 0) return <TagPill>tutti</TagPill>;
        return (
            <div className="flex gap-1.5 flex-wrap">
                {t.map((val) => {
                    const label = rolesMap?.[val] ?? val;
                    return <TagPill key={val}>{label}</TagPill>;
                })}
            </div>
        );
    };

    return (
        <FDBox radius="2xl" shadow="sm" className="h-full">
            {/* header */}
            <FDBox variant="ghost" className="p-3">
                <h3 className="m-0 text-base font-semibold">Queries salvate</h3>
                <p className="text-sm mt-1" style={{ color: String(mutedText) }}>
                    {loading ? "caricamento…" : `${queries.length} elementi`}
                </p>
            </FDBox>

            {loading ? (
                <FDBox variant="ghost" className="p-3">
                    <div className="grid gap-2">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} variant="rectangular" height={40} />
                        ))}
                    </div>
                </FDBox>
            ) : queries.length === 0 ? (
                <FDBox variant="ghost" className="p-3">
                    <p className="text-sm" style={{ color: String(mutedText) }}>nessuna query salvata</p>
                </FDBox>
            ) : (
                <>
                    <div className="border-t" style={{ borderColor: String(borderColor) }} />

                    <TableContainer
                        className="max-h-[55vh] w-full relative z-0"
                        sx={{
                            bgcolor: paperBg, overflowY: "auto", overflowX: "hidden",
                        }}
                    >
                        <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%", zIndex: "0 !important" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            fontWeight: 700, textTransform: "uppercase", fontSize: 12,
                                            width: { xs: "55%", sm: "30%" },
                                            bgcolor: stickyHeaderBg, color: stickyHeaderText, borderBottomColor: tableBorderColor,
                                        }}
                                    >
                                        titolo
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            display: { xs: "none", sm: "table-cell" },
                                            fontWeight: 700, textTransform: "uppercase", fontSize: 12, width: "22%",
                                            bgcolor: stickyHeaderBg, color: stickyHeaderText, borderBottomColor: tableBorderColor,
                                        }}
                                    >
                                        tags
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: 700, textTransform: "uppercase", fontSize: 12,
                                            width: { xs: "45%", sm: "48%" },
                                            bgcolor: stickyHeaderBg, color: stickyHeaderText, borderBottomColor: tableBorderColor,
                                        }}
                                    >
                                        descrizione
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {queries.map((q) => {
                                    const isRowLoading = execLoadingId === q.id;
                                    return (
                                        <TableRow
                                            key={q.id}
                                            hover
                                            sx={{ "&:nth-of-type(odd)": { backgroundColor: stripeBg } }}
                                        >
                                            {/* titolo (+ tags su XS) */}
                                            <TableCell
                                                sx={{
                                                    color: mutedText, fontWeight: 600,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    borderBottomColor: tableBorderColor, verticalAlign: "top",
                                                }}
                                            >
                                                <span
                                                    data-tt="btn"
                                                    data-tooltip-content={q.titolo}
                                                    className="self-start"
                                                    style={{ display: "inline-flex" }}
                                                >
                                                    <div className="font-semibold text-[14px] truncate">{q.titolo}</div>
                                                </span>
                                                <FDBox variant="ghost" className="block sm:hidden mt-1">
                                                    {renderTags(q.tags)}
                                                </FDBox>
                                            </TableCell>

                                            {/* tags (solo SM+) */}
                                            <TableCell
                                                sx={{ display: { xs: "none", sm: "table-cell" }, color: mutedText, borderBottomColor: tableBorderColor, verticalAlign: "top" }}
                                            >
                                                {renderTags(q.tags)}
                                            </TableCell>

                                            {/* descrizione + azioni */}
                                            <TableCell sx={{ p: 1, borderBottomColor: tableBorderColor, verticalAlign: "top" }}>
                                                <div className="flex flex-col gap-2">
                                                    <span
                                                        data-tt="btn"
                                                        data-tooltip-content={q.descrizione}
                                                        className="self-start"
                                                        style={{ display: "inline-flex" }}
                                                    >
                                                        <div
                                                            className="text-[13px] truncate"
                                                            style={{ color: String(mutedText) }}
                                                        >
                                                            {q.descrizione ?? ""}
                                                        </div>
                                                    </span>

                                                    <div className="flex gap-2 pt-1 shrink-0">
                                                        <span
                                                            data-tt="btn"
                                                            data-tooltip-content="Esegui la Query"
                                                            className="self-start"
                                                            style={{ display: "inline-flex" }}
                                                        >
                                                            <FDIconButton
                                                                size="small"
                                                                className={iconBtnClasses}
                                                                icon={<RI as={MdPlayArrow} size={18} />}
                                                                onClick={() => onExec(q.id)}
                                                                disabled={!!execLoadingId}
                                                                loading={isRowLoading}
                                                                aria-label="esegui"
                                                            />
                                                        </span>

                                                        {canManage && (
                                                            <>
                                                                <FDIconButton
                                                                    size="small"
                                                                    className={iconBtnClasses}
                                                                    icon={<RI as={MdEdit} size={18} />}
                                                                    onClick={() => onEdit(q)}
                                                                    aria-label="modifica"
                                                                />
                                                                <FDIconButton
                                                                    size="small"
                                                                    variant="danger"
                                                                    className={iconBtnClasses}
                                                                    icon={<RI as={MdDelete} size={18} />}
                                                                    onClick={() => onDelete(q)}
                                                                    aria-label="elimina"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </FDBox>
    );
}

const SavedQueriesList = React.memo(SavedQueriesListBase);
export default SavedQueriesList;
