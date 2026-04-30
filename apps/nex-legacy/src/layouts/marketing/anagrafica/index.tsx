import React from "react";
import { isArray, isKeyInObject } from "vdck";

import { UserContext } from "context/UserContext";

import { Card, Divider, IconButton, Stack, TextField } from '@mui/material';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { GeneralError } from "components/NoData/generalError";
import { Tooltip } from "react-tooltip";

import ErrorIMG from "assets/images/emptyBox-removebg.png";

import { icon_filter, icon_search } from 'config/icons';

import "./style/index.css";

import { getData } from "./crud/getData";
import { useNexTheme } from "@nex/theme-system";

// Types and refs
interface TextFieldUIProps {
    title: string;
    value: string | number;
    onChange: ({ from, event }: { from: string, event: any }) => void;
    nameFromParams: string;
    sx?: any
};

const TextFieldUI: React.FC<TextFieldUIProps> = ({ title, value, nameFromParams, onChange, sx }) => (
    <TextField sx={sx} label={title} variant="outlined" value={value}
        onChange={(e: any) => onChange({ from: nameFromParams, event: e })} />
);

function Filters({ params, setParams, SendRequestAPI }: {
    params: { [key: string]: any; },
    setParams: React.Dispatch<React.SetStateAction<{ [key: string]: any; }>>,
    SendRequestAPI: (firstCall: boolean) => void
}) {
    const HandleParamsData = ({ from, event }: { from: string, event: any }) => {
        const value = event.target.value;

        console.log(from, event, value)
        setParams((prev: any) => {
            return { ...prev, [from]: value };
        });
    };

    return <Card>
        <Stack p={1} sx={{ borderRadius: 4 }} direction='row'
            alignItems="center" translate="no" height='100%'>
            {icon_filter({ mr: 1.5, })}
            <Stack direction='row' gap={2} height='100%'>
                <TextFieldUI
                    title='Codice'
                    value={params.cd}
                    nameFromParams='cd'
                    onChange={HandleParamsData}
                />
                <Divider orientation='vertical' sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
                <TextFieldUI
                    title='E-mail'
                    value={params.em}
                    nameFromParams='em'
                    onChange={HandleParamsData}
                />
            </Stack>
            <Stack direction='row' ml='auto' height='100%'>
                <Divider orientation='vertical'
                    sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
                <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => SendRequestAPI(true)}
                    data-tooltip-content='Cerca i prodotti'>
                    {icon_search()}</IconButton>
            </Stack>
        </Stack>
    </Card>
};

// Funzione helper per determinare il tipo di input da rendere
const GetInputField = (field: { [key: string]: any }, name: string, handleChange: (element: { [key: string]: any }, type: string) => void): JSX.Element | null => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    // const palette = MainTheme().palette;

    // Extract key/value
    const fieldName: string = field.nome;
    const fieldValue: any = field.val;

    if (!("val" in field)) return null;

    let type: string;
    switch ((typeof fieldValue).substring(0, 1)) {
        case "s":
            type = "text";
            break;
        case "n":
            type = "number";
            break;
        case "b":
            return (
                <>
                    <p className={darkMode ? `${name}-container-title-dark` : `${name}-container-title`}>{fieldName}</p>
                    <input className={darkMode ? `${name}-input-dark` : `${name}-input`} name={fieldName} type="checkbox" value={fieldValue} onChange={(e) => handleChange(e, type)} checked={fieldValue} disabled />
                </>
            );
            break;
        default:
            return null;
    }

    return (
        <>
            <p className={darkMode ? `${name}-container-title-dark` : `${name}-container-title`}>{fieldName}</p>
            <input className={darkMode ? `${name}-input-dark` : `${name}-input`} name={fieldName} type={type} value={fieldValue} onChange={(e) => handleChange(e, type)} disabled />
        </>
    );
};

/** Form
 * 
 * @param {{ [key: string]: any }[]} data Data to visualize
 * @param {string} name Class name
 * 
 * @returns {JSX.Element}
 */
function FormSection({ data, name, handleChange }: { data: { [key: string]: any }[], name: string, handleChange: (element: { [key: string]: any }, type: string) => void }): JSX.Element {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    // const palette = MainTheme().palette;

    return (
        <div className={darkMode ? "main-container-dark" : "main-container"} style={{ paddingTop: "0.5rem" }}>
            {data.map((section: { [key: string]: any }, index: number) => (
                isKeyInObject(section, "nome", "s", { minLength: 1 }) ? (
                    <>
                        <h6 className={darkMode ? `${name}-section-title-dark` : `${name}-section-title`} style={index == 0 ? { paddingTop: "1rem" } : undefined}>
                            {section.nome}
                        </h6>
                        {section.data.map((field: { [key: string]: any }, fieldIndex: number) => (
                            <div key={fieldIndex} className={`${name}-container`}>
                                {GetInputField(field, name, handleChange)}
                            </div>
                        ))}
                    </>
                ) : null
            ))}
        </div>
    );
}

/** Main component
 * 
 * @returns {React.FC<{}>}
 */
export const AnagraficaClienti: React.FC<{}> = () => {
    // STATES | General and globals states
    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [params, setParams] = React.useState<{ [key: string]: any }>({
        cd: "",
        em: "",
        tt: true
    });
    const [data, setData] = React.useState<any>([]);

    // Handle initial errors and loading
    const [err, setErr] = React.useState(false);
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    // Constants and variables
    // const palette = MainTheme().palette;

    // Initial function
    const SendRequestAPI = async (firstCall: boolean) => {
        cancelRequest();
        getData({
            userContext,
            abortController,
            params,
            setData,
            setErr
        });
    };

    // First call
    React.useEffect(() => {
        if (!isKeyInObject(userContext, "details", "o")) return;
        return () => cancelRequest();
    }, [userContext.details]);

    /** Update field values state
     * 
     * @param fieldName 
     * @param newValue 
     */
    const handleChange = (element: { [key: string]: any }, type: string): void => {
        if (!isKeyInObject(element, "target", "o") || !isKeyInObject(element.target, "name", "s")) {
            return;
        }

        setData((prevData: any) => ({
            ...prevData,
            [element.target.name]: element.target.value,
        }));
    };

    // Render
    return <DashboardLayout>
        <Stack gap={2} height="100%">
            <Filters params={params} setParams={setParams} SendRequestAPI={SendRequestAPI} />
            {!err ?
                isArray(data, 1) ?
                    <FormSection data={data} name="registry" handleChange={handleChange} />
                    :
                    null
                :
                <GeneralError text="Si è verificato un errore, controlla l'infobox" img={ErrorIMG} />
            }
        </Stack>
        <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: "0.87rem", zIndex: 9999,
            textAlign: "center"
        }} />
    </DashboardLayout>
}