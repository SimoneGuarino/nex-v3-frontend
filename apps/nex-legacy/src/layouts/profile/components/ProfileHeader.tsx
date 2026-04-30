// layouts/profile/components/ProfileHeader.tsx
import React from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import PhotoCameraRounded from "@mui/icons-material/PhotoCameraRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { m, LazyMotion, domAnimation } from "framer-motion";
import { useUserContext } from "context/UserContext";
import FDIconButton from "components/UI/buttons/FDIconButton";

import defaultAvatar from "assets/images/blank-profile-picture-973460_960_720.webp";

import { UploadFilesAPI } from "../fetchData/UploadFiles";
import { UserDetails } from "types/UserContext";
import { enqueueSnackbar } from "components/MessageBox";


const ease = [0.2, 0.8, 0.2, 1];

export default function ProfileHeader() {
    const [user, setUser] = useUserContext();

    const [bgUploading, setBgUploading] = React.useState(false);
    const [avatarUploading, setAvatarUploading] = React.useState(false);

    const abortController = React.useRef<AbortController | null>(null);

    const bgInput = React.useRef<HTMLInputElement | null>(null);
    const avInput = React.useRef<HTMLInputElement | null>(null);

    // --- helpers upload (presigned o endpoint diretto) ---
    async function uploadFile(file: File, kind: "cover" | "avatar") {
        const form = new FormData();
        form.append("file", file);
        const ep = kind === "cover" ? "users/me/cover" : "users/me/avatar";
        const res = await UploadFilesAPI({
            abortController,
            url: ep,
            form,
        });

        if (!res.url) throw new Error("upload failed");
        const { url } = await res;
        return url as string;
    };

    const pickBg = () => bgInput.current?.click();
    const pickAvatar = () => avInput.current?.click();

    const onBgSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        // Controlla il file caricato e assicurati che non sia un file malevolo
        if (!file.type.startsWith("image/")) {
            console.error("Invalid file type");
            enqueueSnackbar("Tipo di file non valido. Carica un'immagine.", { title: 'File non valido.', type: "error" });
            return;
        }
        setBgUploading(true);
        const prev = coverUrl;
        try {
            const url = await uploadFile(file, "cover");
            setUser((s: any) => ({ ...s, details: { ...s.details, immagini: { ...s.details.immagini, cover: url } } }));
        } catch (error: any) {
            console.error("upload cover error", error);
            setUser((s: any) => ({ ...s, details: { ...s.details, immagini: { ...s.details.immagini, cover: prev } } }));
        } finally {
            setBgUploading(false);
            e.target.value = "";
        };
    };

    const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        // Controlla il file caricato e assicurati che non sia un file malevolo
        if (!file.type.startsWith("image/")) {
            console.error("Invalid file type");
            enqueueSnackbar("Tipo di file non valido. Carica un'immagine.", { title: 'File non valido.', type: "error" });
            return;
        }
        // Imposta lo stato di caricamento dell'avatar su true
        setAvatarUploading(true);
        const prev = avatarUrl;
        try {
            const url = await uploadFile(file, "avatar");
            console.log("url avatar: ", url);

            setUser((s: any) => ({ ...s, details: { ...s.details, immagini: { ...s.details.immagini, avatar: url } } }));
        } catch (error: any) {
            console.error("upload avatar error", error);
            setUser((s: any) => ({ ...s, details: { ...s.details, immagini: { ...s.details.immagini, avatar: prev } } }));
        } finally {
            setAvatarUploading(false);
            e.target.value = "";
        };
    };

    const clearBg = async () => {
        // opzionale: chiama API per rimuovere cover
        setUser((s: any) => ({ ...s, details: { ...s.details, immagini: { avatar: "", cover: "" } } }));
    };


    if (!user?.details) return null;
    const details: UserDetails = user.details;

    const coverUrl = (details?.immagini?.cover && `${import.meta.env.VITE_API_USERS}${details.immagini.cover}`) || "";
    const avatarUrl = (details?.immagini?.avatar && `${import.meta.env.VITE_API_USERS}${details.immagini.avatar}`) || "";


    return (
        <LazyMotion features={domAnimation}>
            <MDBox position="relative" mb={5}>
                {/* HERO background */}
                <m.div
                    initial={{ opacity: 0, y: -10, scale: .995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: .45, ease: (ease as any) }}
                >
                    <MDBox
                        position="relative"
                        minHeight="19rem"
                        borderRadius="xl"
                        sx={{
                            overflow: "hidden",
                            background: coverUrl
                                ? `url(${coverUrl}) center/cover no-repeat`
                                : !bgUploading && "radial-gradient(1000px 400px at -10% -20%, rgba(169, 85, 247, 0.52), transparent 60%), radial-gradient(1000px 450px at 110% -15%, rgba(59, 131, 246, 0.59), transparent 60%), #0d0e124d",
                        }}
                    >
                        {bgUploading ? (
                            <div className="absolute h-full w-full bg-black/5 dark:bg-white/5 animate-pulse " />
                        ) : <MDBox
                            sx={{
                                position: "absolute", inset: 0,
                                background: "linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.35))",
                            }}
                        />}

                        {/* pulsanti cover */}
                        <MDBox position="absolute" right={12} top={12} display="flex" gap={1}>
                            <input ref={bgInput} type="file" accept="image/*" hidden onChange={onBgSelected} />
                            <FDIconButton
                                variant={bgUploading ? "primary" : "general"}
                                disabled={bgUploading}
                                size="small"
                                onClick={pickBg}
                                ariaLabel="cambia avatar"
                                icon={bgUploading ? <CircularProgress size={18} /> : <PhotoCameraRounded fontSize="small" />}
                                dataTooltipId="general-profile-tooltip"
                                dataTooltipContent="Cambia copertina"
                            />
                            {coverUrl && (
                                <FDIconButton
                                    variant="general"
                                    size="small"
                                    onClick={clearBg}
                                    ariaLabel="cambia avatar"
                                    icon={<DeleteOutlineRounded fontSize="small" />}
                                    dataTooltipId="general-profile-tooltip"
                                    dataTooltipContent="Rimuovi copertina"
                                />
                            )}
                        </MDBox>
                    </MDBox>
                </m.div>

                {/* CARD header */}
                <Card sx={{ position: "relative", mt: -8, mx: 3, py: 2, px: 2 }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item>
                            <div style={{ position: "relative" }}>
                                <div className="rounded-full w-24 h-24 overflow-hidden">
                                    {avatarUploading ? (
                                        <div className="h-full w-full bg-black/5 dark:bg-white/5 animate-pulse" />
                                    ) : <img src={avatarUrl || defaultAvatar} />}
                                </div>
                                <input ref={avInput} type="file" accept="image/*" hidden onChange={onAvatarSelected} />
                                <FDIconButton
                                    variant={avatarUploading ? "primary" : "general"}
                                    disabled={avatarUploading}
                                    size="small"
                                    onClick={pickAvatar}
                                    className="-right-0 -bottom-0 absolute"
                                    ariaLabel="cambia avatar"
                                    icon={avatarUploading ? <CircularProgress size={16} /> : <PhotoCameraRounded fontSize="small" />}
                                />
                            </div>
                        </Grid>

                        <Grid item>
                            <MDBox height="100%" mt={0.5} lineHeight={1}>
                                <MDTypography variant="h5" fontWeight="medium">
                                    {`${details?.nome ?? ""} ${details?.cognome ?? ""}`}
                                </MDTypography>
                                <MDTypography variant="button" color="text" fontWeight="regular">
                                    {details?.descrizioneRuolo || details?.divisione || "—"}
                                </MDTypography>
                            </MDBox>
                        </Grid>
                    </Grid>
                </Card>
            </MDBox>
        </LazyMotion>
    );
}