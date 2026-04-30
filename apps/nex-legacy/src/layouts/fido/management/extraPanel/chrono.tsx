import { Backdrop, Card, Divider, IconButton, Stack } from "@mui/material";
import { useNexTheme } from "@nex/theme-system";
import { MainTheme } from "assets/settingsTheme";
import MDTypography from "components/MDTypography";
import { Tag } from "components/Tag/Tag";
import { icon_ArrowRight, icon_close, icon_info } from "config/icons";
import { useMaterialUIController } from "context/index";
import { GenStatusColor } from "layouts/fido/status";
import { ConvertToItalianDate } from "utils/italianDate";
import { NumberToEuro } from "utils/numberToEuro";
import { StringToHTML } from "utils/stringToHTML";

interface ChronoElementProps {
    stato: number;
    statoPrecedente: number;
    data: any;
    amministrativo: {
        username: string;
    };
    fido?: {
        valore: number;
        variazione: number;
    };
    commento?: string;
};

interface ItemProps {
    index: number
    details: ChronoElementProps;
    status: string;
    status_prev: string;
}
const Item: React.FC<ItemProps> = ({ details, index, status, status_prev }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const statusIsChanged = details?.statoPrecedente !== undefined
        ? details.stato != details.statoPrecedente : false;


    return <Card key={index} sx={{ backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}` }}>
        <Stack p={2}>
            {statusIsChanged ? <>
                <MDTypography fontWeight="light" fontSize="0.8rem" sx={{ mb: 1 }}>Lo stato della richiesta è cambiata</MDTypography>
                <Stack direction='row' alignItems='center'>
                    <Tag text={status_prev} fontSize={'1rem'} textColor={GenStatusColor(status_prev).color} color={GenStatusColor(status_prev).backgroundColor} />
                    {icon_ArrowRight({ m: '0px 20px' })}
                    <Tag text={status} fontSize={'1rem'} textColor={GenStatusColor(status).color} color={GenStatusColor(status).backgroundColor} />
                </Stack></>
                : <Tag text={status} fontSize={'1rem'} />}

            {details?.fido && <><Divider sx={{ backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}` }} />
                <MDTypography fontWeight="light" fontSize="0.8rem" sx={{ mb: 1 }}>Fido richiesto variato</MDTypography>
                <Stack direction='row' alignItems='center'>
                    <Tag text={NumberToEuro({ convert: details.fido?.valore })} fontSize={'1rem'} color={`${darkMode ? palette.grey[600] : palette.grey[200]}`} />
                    {icon_ArrowRight({ m: '0px 20px' })}
                    <Tag text={NumberToEuro({ convert: details.fido?.variazione })} fontSize={'1rem'} color={`${darkMode ? palette.grey[600] : palette.grey[200]}`} />
                </Stack></>}
            <Divider sx={{ backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}` }} />
            <Stack mt={2} gap={2}>
                <Stack>
                    <MDTypography variant="body2" fontWeight="light" fontSize="0.8rem">Cambiamento fatto da:</MDTypography>
                    <MDTypography variant="body1">{details.amministrativo.username}</MDTypography>
                </Stack>

                {details.commento && <Stack>
                    <MDTypography variant="body2" fontWeight="light" fontSize="0.8rem">Commento lasciato dall'utente:</MDTypography>
                    <p style={{ fontSize: "0.9rem", fontWeight: "300", maxHeight: 200, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: StringToHTML({ string: details.commento }) }}></p>
                </Stack>}

                <MDTypography variant="body2" fontSize="0.8rem" sx={{ ml: 'auto' }}>{new Date(details.data).toLocaleString('it-IT')}</MDTypography>
            </Stack>
        </Stack>

    </Card>
}




interface ChronoPanelProps {
    dataList: Array<ChronoElementProps> | null;
    creationDate: string;
    status: boolean;
    ChangeVisibility: () => void;
    statusNumberToString: string[];
    isActive?: boolean;
};
export const ChronoPanel: React.FC<ChronoPanelProps> = ({ dataList, creationDate, status, ChangeVisibility, statusNumberToString, isActive = true }) => {
    const disabled = !isActive;
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    return (
        <Backdrop open={status} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
            {status && (<Card sx={{
                width: '40%', maxHeight: 800, minHeight: 300, minWidth: 450,
                borderRadius: 5, transition: 'all 200ms ease-in', p: 2, display: 'flex', flexDirection: 'column', pointerEvents: disabled ? 'none' : 'auto',
                userSelect: disabled ? 'none' : 'auto',
                opacity: disabled ? 0.98 : 1
            }} data-tour="crono-change-status-2" aria-disabled={disabled}
            >
                <Stack direction='row' pl={1}>
                    <Stack direction='row' alignItems='center' gap={1}>
                        {icon_info()}
                        <MDTypography variant='h4'>
                            Cronolgia Stati Precedenti
                        </MDTypography>
                    </Stack>

                    <IconButton sx={{
                        ml: 'auto', backgroundColor: palette.error.light,
                        "&:hover": { backgroundColor: palette.error.dark }
                    }} onClick={disabled ? undefined : () => ChangeVisibility()} tabIndex={disabled ? -1 : 0} aria-disabled={disabled}
                    >
                        {icon_close({ color: '#fff' })}
                    </IconButton>
                </Stack>
                <MDTypography sx={{ pl: 1.5 }} variant="body2">La richiesta è stata creata: {ConvertToItalianDate(creationDate, { time: true })}</MDTypography>

                {/*<MDTypography sx={{pl: 1.5}} variant="body2">La richiesta è stata creata: {ConvertToItalianDate(creationDate, { time: true })}</MDTypography>*/}

                <Divider sx={{ width: '100%', backgroundColor: '#ccc' }} />
                <Stack gap={2} sx={{ height: '100%', p: 1, overflow: 'auto', maxHeight: 800 }}>
                    {dataList ?
                        dataList.length > 0 ?
                            dataList.map((item: ChronoElementProps, index: number) => (
                                <Item details={item} status={statusNumberToString[item.stato]} index={index}
                                    status_prev={statusNumberToString[item.statoPrecedente]} />
                            )) : <MDTypography sx={{ textAlign: 'center' }} variant="body2">
                                Sembra che questa richiesta non abbia cambiamenti di stato precedenti</MDTypography>
                        : <MDTypography sx={{ textAlign: 'center' }} variant="body2">
                            Sembra che questa richiesta non abbia cambiamenti di stato precedenti</MDTypography>
                    }
                </Stack>
            </Card>
            )}
        </Backdrop>
    );
};