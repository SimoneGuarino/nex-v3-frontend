// layouts/profile/components/ProfileDetailsCard.tsx
import React from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

import EditRounded from "@mui/icons-material/EditRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { m } from "framer-motion";
import { useUserContext } from "context/UserContext";
import { Tag } from "components/Tag/Tag";

import { FDBox, FDInput, FDIconButton } from "@nex/fd-ui";

import { ProfileDetailAPI } from "../fetchData/ProfileDetail";
import { enqueueSnackbar } from "components/MessageBox";

function formatDate(d?: string | Date | null) {
    if (!d) return "—";
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(+dt) ? "—" : dt.toLocaleString("it-IT");
}

export default function ProfileDetailsCard() {
    const [user, setUser] = useUserContext();
    const d = user?.details;
    const groupContexts = Array.isArray(d?.authz?.groupContexts)
        ? d.authz.groupContexts
        : [];

    const [editing, setEditing] = React.useState<Record<string, boolean>>({});
    const [local, setLocal] = React.useState({
        nome: d?.nome ?? "",
        cognome: d?.cognome ?? "",
        bio: d?.bio ?? "",
    });

    console.log("ProfileDetailsCard render", { d });

    const abortController = React.useRef<AbortController | null>(null);

    // debounce save
    const saveTimer = React.useRef<any>(null);
    function queueSave(patch: Partial<typeof local>) {
        setLocal((s) => ({ ...s, ...patch }));
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                // optimistic
                setUser((s: any) => ({ ...s, details: { ...s.details, ...patch } }));
                await ProfileDetailAPI({
                    abortController,
                    body: { data: JSON.stringify(patch) },
                });
            } catch {
                enqueueSnackbar("C'è stato un errore durante il salvataggio, riprova tra poco.", {
                    title: 'Errore nella richiesta',
                    type: 'error',
                });
            };
        }, 450);
    }

    const Field = React.useCallback(
        ({ label, name, value }: { label: string; name: keyof typeof local; value: string }) => {
            const isEd = !!editing[name];
            return (
                <FDBox variant="ghost" className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <div className="flex items-center gap-1.5">
                        {isEd ? (
                            <FDInput
                                autoFocus
                                size="sm"
                                className="flex-1"
                                value={local[name]}
                                onChange={(e: any) => queueSave({ [name]: e.target.value } as any)}
                            />
                        ) : (
                            <p className="text-sm">{value || "—"}</p>
                        )}
                        <FDIconButton
                            size="small"
                            variant="text"
                            icon={isEd ? <SaveRounded fontSize="small" /> : <EditRounded fontSize="small" className="opacity-50" />}
                            onClick={() => setEditing((s) => ({ ...s, [name]: !isEd }))}
                        />
                        {isEd && (
                            <FDIconButton
                                size="small"
                                variant="text"
                                icon={<CloseRounded fontSize="small" />}
                                onClick={() => {
                                    setEditing((s) => ({ ...s, [name]: false }));
                                    setLocal((s) => ({ ...s, [name]: (d as any)[name] ?? "" }));
                                }}
                            />
                        )}
                    </div>
                </FDBox>
            );
        },
        [editing, local, d]
    );

    return (
        <Card>
            <MDBox p={2}>
                <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Informazioni utente</p>
                </m.div>

                <FDBox variant="ghost">
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Field label="Nome" name="nome" value={local.nome} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Field label="Cognome" name="cognome" value={local.cognome} />
                        </Grid>
                        <Grid item xs={12}>
                            <Field label="Bio" name="bio" value={local.bio} />
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={12} md={6}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                            <p className="text-sm">{d?.username}</p>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Divisione</p>
                            <p className="text-sm">{d?.Divisione ?? "—"}</p>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Sede</p>
                            <p className="text-sm">{d?.Sede ?? "—"}</p>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={12} md={6}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Ruolo</p>
                            <div className="flex flex-wrap gap-6 items-center">
                                <MDTypography variant="button">
                                    {typeof d?.ruolo === "string" ? d?.ruolo : "—"}
                                    <span style={{ opacity: .6 }}>({d?.descrizioneRuolo ?? "—"})</span>
                                </MDTypography>
                                <div className="flex gap-1 flex-wrap">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Ruoli disponibili</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {groupContexts.map((group: { _id: string; name?: string; key?: string; description?: string }) => {
                                            return (
                                                <Tag key={group._id} text={`#${group.name || group.key || group._id}`} />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Codici</p>
                            <div className="flex gap-1 flex-wrap">
                                {d?.codici?.buyer && <Tag text={`Buyer: ${d.codici.buyer}`} />}
                                {d?.codici?.agente && <Tag text={`Agente: ${d.codici.agente}`} />}
                                {d?.CodiceInterno && <Tag text={`Interno: ${d.CodiceInterno}`} />}
                                {d?.magazzino && <Tag text={`Magazzino: ${d.magazzino}`} />}
                            </div>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={12} md={6}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Ultimo accesso</p>
                            <MDTypography variant="button">{formatDate((d as any)?.stato?.ultimoAccesso?.$date || d?.stato?.ultimoAccesso)}</MDTypography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Registrato</p>
                            <MDTypography variant="button">{formatDate((d as any)?.registrato?.$date || d?.registrato)}</MDTypography>
                        </Grid>
                    </Grid>
                </FDBox>
            </MDBox>
        </Card>
    );
}