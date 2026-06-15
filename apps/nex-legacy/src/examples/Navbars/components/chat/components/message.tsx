import React from "react";
import { MainTheme } from "assets/settingsTheme";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { Avatar, Card, Fade, IconButton, Stack } from "@mui/material";
import { StringAvatar } from "utils/stringToColor";
import MDTypography from "components/MDTypography";
import { icon_check, icon_doubleCheck, icon_download, icon_file, icon_moreSettings } from "config/icons";
import { Tag } from "components/Tag/Tag";
import { DwdFileFromLink } from "utils/dwdFile";
import { allEmojis } from "components/EmojiPicker";
import CircularWithValueLabel from "../CircularWithValueLabel";
import { LoadScreen } from "components/Load";
import InfoPoupUpMenu from "examples/infoPoupUpMenu";
import MDButton from "components/MDButton";
import { downloadPdfSingleAPI } from "layouts/documentiPDF/lib/downloadDocuments";
import FDIconButton from "components/UI/buttons/FDIconButton";
// icons
import { IoCloudDownloadOutline } from "react-icons/io5";
import { CiFileOn } from "react-icons/ci";
import { ImFilesEmpty } from "react-icons/im";
//components
import { FDBox } from "@nex/fd-ui";
import { useNexTheme } from "@nex/theme-system";

const IoCloudDownloadOutlineIcon = IoCloudDownloadOutline as React.FC<{ size?: number }>;
const CiFileOnIcon = CiFileOn as React.FC<{ size?: number }>;
const ImFilesEmptyIcon = ImFilesEmpty as React.FC<{ size?: number, className?: string }>;

const enableForPreview = ['png', 'jpg', 'jpeg', 'webp', 'jfif'];

interface AttachmentsProps {
    fileID: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    isUploaded?: boolean;

    kind: "resource" | "upload";
    company?: "FOCELDA" | "IOT"; // per ora solo pdf
    displayName?: string;   // nome visualizzato (opzionale)
}
interface MessageProp {
    user: {
        _id: string;
        nome: string;
        cognome: string;
    }
    variant?: string;
    msg: string;
    sended: boolean;
    viewed: boolean;
    date: Date;
    attachments: Array<AttachmentsProps>
}

interface MessageProps {
    message: MessageProp;
    i: number;
    fromMe: boolean;
}

export const Message: React.FC<MessageProps> = ({ message, i, fromMe }) => {
    const { overviewMessage } = useGeneralDataContext();

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const areDatesDifferent = (date1: Date, date2: Date) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        return (
            d1.getFullYear() !== d2.getFullYear() ||
            d1.getMonth() !== d2.getMonth() ||
            d1.getDate() !== d2.getDate()
        );
    };

    const Extension = React.useCallback((file: any) => {
        const splitName = file.fileName.split(".");
        let extention = 'undefined';
        if (splitName && Array.isArray(splitName) && splitName.length > 0) {
            return extention = splitName[splitName.length - 1];
        }
        return false
    }, [message]);

    // variabile di stato che definisce in fase di caricamento o meno del CSV inviato al server
    const [progressUpload, setProgressUpload] = React.useState<number>(0);

    const [openChat, setOpenChat] = React.useState<boolean>(false);
    const iconButtonRef = React.useRef(null);
    const handleOpenChat = () => setOpenChat(true);
    const handleCloseChat = () => {
        setOpenChat(false);
    };
    const css_btn_style = {
        justifyContent: 'flex-start',
        color: darkMode ? palette.grey[500] : palette.grey[700],
        "&:hover": {
            color: darkMode ? palette.grey[500] : palette.grey[700],
            backgroundColor: darkMode ? palette.grey[800] : palette.grey[200]
        }
    };
    const ChatMenu = React.useMemo(() => (
        openChat && <InfoPoupUpMenu
            anchorEl={iconButtonRef.current}
            sx={{ maxWidth: 250 }}
            right='87.8%'
            handleCloseMenu={handleCloseChat}
            contain={
                <Stack>
                    <MDButton variant="text" sx={css_btn_style}>
                        Rispondi
                    </MDButton>
                    <MDButton variant="text" sx={css_btn_style}>
                        Reagisci
                    </MDButton>
                    <MDButton variant="text" sx={css_btn_style}>
                        Fissa
                    </MDButton>
                    <MDButton variant="text" sx={css_btn_style}>
                        Importante
                    </MDButton>
                </Stack>
            }
        />
    ), [openChat]);

    // --- helper per le date del divisore ---
    const prevDateRaw = overviewMessage?.messages?.[i - 1]?.date as any;
    const msgDate = message?.date ? new Date(message.date as any) : null;
    const prevDate = prevDateRaw ? new Date(prevDateRaw as any) : null;

    const showDateTag =
        i === 0 || (msgDate && prevDate ? areDatesDifferent(msgDate, prevDate) : true);

    return (
        <Fade key={i} in={Boolean(message !== undefined)} timeout={500}>
            <Stack key={i}>
                {showDateTag && (
                    <Stack width="100%" alignItems="center">
                        <Tag
                            text={
                                msgDate && !areDatesDifferent(msgDate, new Date())
                                    ? "Oggi"
                                    : (msgDate ? new Date(msgDate).toLocaleDateString('it') : "")
                            }
                            fontSize='0.8rem'
                        />
                    </Stack>
                )}

                <Stack
                    direction='row'
                    key={i}
                    p={2}
                    width='85%'
                    sx={{
                        justifyContent: `${fromMe ? 'flex-end' : 'flex-start'}`,
                        alignSelf: `${fromMe ? 'flex-end' : 'flex-start'}`,
                        alignItems: 'flex-end'
                    }}
                >
                    {!fromMe && (
                        <Avatar
                            {...StringAvatar({ firstName: message.user.nome, lastName: message.user.cognome })}
                            style={{ cursor: 'pointer', width: '2.3em', height: '2.3em', fontSize: '1.4em' }}
                        />
                    )}
                    <Stack>
                        <Stack direction='row' gap={1} justifyContent='space-between'>
                            {!fromMe && (
                                <MDTypography variant="body2">
                                    {message.user.nome} {message.user.cognome}
                                </MDTypography>
                            )}
                            <MDTypography variant="body2">
                                {new Date(message.date).toLocaleTimeString('it', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}
                            </MDTypography>
                        </Stack>

                        <Stack
                            gap={1}
                            justifyContent='space-between'
                            alignItems='center'
                            sx={{
                                border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[300]}`,
                                borderRadius: `${!fromMe ? "0px 16px 16px 16px" : "8px"}`,
                                backgroundColor: `${darkMode ? '' : '#fbfbfb'}`,
                                width: 'fit-content'
                            }}
                        >
                            {(message.attachments && message.attachments.length > 0) && message.attachments.map((data: AttachmentsProps, y: number) => {
                                if (data.kind === "resource" && data.fileType === "pdf") {
                                    const fileNameParam = data.fileName;     // es: DOC-BOLLA-...-081025
                                    const company = data.company;
                                    const title = data.displayName || fileNameParam;

                                    return (
                                        <FDBox pad="xs" variant="outline" radius="md" key={y} className="flex align-center items-center space-x-2">
                                            <CiFileOnIcon />
                                            <MDTypography variant="body2" fontSize="0.8rem">{title}</MDTypography>
                                            <FDIconButton
                                                variant="text"
                                                className="ml-2"
                                                icon={<IoCloudDownloadOutlineIcon size={20} />}
                                                onClick={() => downloadPdfSingleAPI(fileNameParam, (company as any), { asAttachment: true })}
                                            />
                                        </FDBox>
                                    );
                                }

                                const baseUrl = import.meta.env.VITE_API_CHAT ?? '';
                                const canPreview =
                                    enableForPreview.includes(Extension(data) as string) &&
                                    (data.isUploaded === true || data.isUploaded === undefined);
                                const canBuildPath = Boolean(overviewMessage?.path && data?.fileID);


                                return (
                                    <Card key={y} sx={{ width: '100%', alignItems: 'center'}}>
                                        {canPreview ? (
                                            canBuildPath ? (
                                                <img
                                                    loading='lazy'
                                                    src={`${baseUrl}uploads/${overviewMessage!.path}/${data.fileID}`}
                                                    style={{ width: '100%', height: '100%', maxHeight: 250, borderRadius: "10px" }}
                                                />
                                            ) : (
                                                <Stack height={250} width={250}><LoadScreen /></Stack>
                                            )
                                        ) : (
                                            <div className="p-10">
                                                <ImFilesEmptyIcon size={30} className="text-gray-400 dark:text-gray-700" />
                                            </div>
                                        )}

                                        <Stack direction='row' alignItems='center' width='100%' p={1}>
                                            {icon_file({ width: 20, height: 20 })}
                                            <MDTypography variant="body2" fontSize="0.8rem">
                                                {(data.fileName && data.fileName.length > 20) ? data.fileName.slice(0, 20) + "..." : data.fileName}
                                            </MDTypography>
                                            {progressUpload === 0 && canBuildPath ? (
                                                <IconButton
                                                    sx={{ ml: 'auto' }}
                                                    onClick={() =>
                                                        DwdFileFromLink({
                                                            path: `uploads/${overviewMessage!.path}/${data.fileID}`,
                                                            fileName: data.fileName,
                                                            serverUrl: import.meta.env.VITE_API_CHAT,
                                                            setProgressUpload: setProgressUpload,
                                                        })
                                                    }
                                                >
                                                    {icon_download()}
                                                </IconButton>
                                            ) : progressUpload > 0 ? (
                                                <CircularWithValueLabel progress={progressUpload} />
                                            ) : null}
                                        </Stack>
                                    </Card>
                                );
                            })}
                            {message.msg && <MDTypography
                                variant={allEmojis.includes(message.msg) ? "h2" : "body2"}
                                sx={{ p: 2, width: '100%' }}
                            >
                                {message.msg}
                            </MDTypography>}
                        </Stack>
                    </Stack>
                    {fromMe &&
                        (message.viewed ?
                            <Fade in={true} timeout={1500}>{icon_doubleCheck({ width: 20, height: 20 })}</Fade>
                            : (message.sended == undefined || message.sended) && <Fade in={true} timeout={1500}>{icon_check({ width: 20, height: 20 })}</Fade>)
                    }
                    {!fromMe && (
                        <IconButton onClick={handleOpenChat} ref={iconButtonRef}
                            sx={{ alignSelf: 'flex-start', p: 0.4, ml: 1 }}>
                            {icon_moreSettings({ width: 20, height: 20 })}
                        </IconButton>
                    )}
                </Stack>
                {ChatMenu}
            </Stack>
        </Fade>
    );
};
