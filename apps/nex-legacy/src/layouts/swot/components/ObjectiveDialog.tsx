import {
    Backdrop,
    TextField,
} from "@mui/material";
import PropTypes from 'prop-types';
import { forwardRef, useEffect, useMemo, useState } from "react";
import VirtualizedList from "./virtualizedCategory";
import { NumericFormat } from "react-number-format";
import { motion } from "framer-motion";
import { MainTheme } from "assets/settingsTheme";
import FDButton from "components/UI/buttons/FDButton";

const NumericFormatCustom = forwardRef(function NumericFormatCustom(
    props: any,
    ref,
) {
    const { onChange, ...other } = props;

    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: props.name,
                        value: values.value,
                    },
                });
            }}
            thousandSeparator="."
            decimalSeparator=","
            valueIsNumericString
            prefix="€"
        />
    );
});

NumericFormatCustom.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

type FormValues = {
    brand: any;
    linea: any;
    gruppo: any;
    famiglia: any;
    target: any;
    quarter: number;
};

type Errors = Partial<Record<keyof FormValues, string>>;


type ObjectiveDialogProps = {
    defaultStyles: {
        bg: { [key: number]: string };
        [key: number]: string;
    };
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues) => Promise<boolean>;
    loadStatus: { [key: string]: any };
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    categoryData: Array<object>;
    defaultValues?: Partial<FormValues>;
    setDefaultObjectiveValues: (values: FormValues) => void;
};
const stepsHowItWorks = [{
    title: "Step 1",
    desc: "Seleziona i filtri desiderati per il tuo obiettivo.",
    icon: (
        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
        </svg>
    )
}, {
    title: "Step 2",
    desc: "Inserisci il valore dell'obiettivo che vuoi raggiungere.",
    icon: (
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 12h6" />
        </svg>
    )
}, {
    title: "Step 3",
    desc: "Salva per aggiungere il nuovo obiettivo.",
    icon: (
        <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
        </svg>
    )
}];


const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
};

const fadeInDown = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0 },
};

const ObjectiveDialog = ({ open, onClose, onSubmit, loadStatus, categoryData, ChangeLoadStatus, defaultValues, setDefaultObjectiveValues }: ObjectiveDialogProps) => {
    const palette = MainTheme().palette;

    //statehook per i dati inseriti dall'utente.
    const [dataToInsert, setDataToInsert] = useState<FormValues>({
        brand: null,
        linea: null,
        gruppo: null,
        famiglia: null,
        target: '',
        quarter: 0,
    });
    const [errors, setErrors] = useState<Errors>({});

    // Reinizializza i dati quando il dialog si apre
    useEffect(() => {
        if (open && defaultValues) {
            setDataToInsert({
                brand: defaultValues.brand ?? null,
                linea: defaultValues.linea ?? null,
                gruppo: defaultValues.gruppo ?? null,
                famiglia: defaultValues.famiglia ?? null,
                target: defaultValues.target ?? '',
                quarter: defaultValues.quarter ?? 0,
            });
            setErrors({});
        }
    }, [open, defaultValues]);


    const handleChange = (field: keyof FormValues, value: string | number) => {
        setDataToInsert((prev: FormValues) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleClose = () => {
        const defaultValues_: FormValues = {
            brand: null,
            linea: null,
            gruppo: null,
            famiglia: null,
            target: '',
            quarter: 0,
        };
        setDataToInsert(defaultValues_);
        setDefaultObjectiveValues(defaultValues_);
        setErrors({});
        onClose();
    };

    //dati che permetto la creazione dei select a filtraggio.
    const dataSelects = [
        {
            label: "Marca",
            ref: "Marca",
            stateRef: dataToInsert.brand,
            noneOnClick: () => {
                HandleDataToInsert('brand', null);
                HandleDataToInsert('linea', null);
                HandleDataToInsert('gruppo', null);
                HandleDataToInsert('famiglia', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("brand", item);
                HandleDataToInsert('linea', null);
                HandleDataToInsert('gruppo', null);
            },
            dataArray: categoryData
        },
        {
            label: "Linea",
            ref: "DescrizioneLinea",
            stateRef: dataToInsert.linea,
            noneOnClick: () => {
                HandleDataToInsert('linea', null);
                HandleDataToInsert('gruppo', null);
                HandleDataToInsert('famiglia', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("linea", item);
                HandleDataToInsert('gruppo', null);
                HandleDataToInsert('famiglia', null);
            },
            dataArray: dataToInsert.brand?.Categories
        },
        {
            label: "Gruppo",
            ref: "DescrizioneGruppo",
            stateRef: dataToInsert.gruppo,
            noneOnClick: () => {
                HandleDataToInsert('gruppo', null);
                HandleDataToInsert('famiglia', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("gruppo", item);
                HandleDataToInsert('famiglia', null);
            },
            dataArray: dataToInsert.linea?.SubCategory
        },
        {
            label: "famgilia",
            ref: "descrizioneFamiglia",
            stateRef: dataToInsert.famiglia,
            noneOnClick: () => {
                HandleDataToInsert('famiglia', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("famiglia", item);
            },
            dataArray: dataToInsert.gruppo?.famiglie
        },
    ];

    const HandleDataToInsert = (props: string, value: any) => {
        setDataToInsert((prev: any) => {
            const copy = { ...prev };
            copy[props] = value;
            return copy;
        })
    };

    const filterRender = useMemo(() => (
        <div className="flex gap-4 flex-wrap">
            {dataSelects.map((elements, index) => {
                return <div key={index} className="flex flex-col gap-2 w-1/3">
                    <p className="text-sm font-semibold mb-2 text-gray-300 dark:text-gray-600">{elements.label}</p>
                    <VirtualizedList data={elements} HandleDataToInsert={HandleDataToInsert}
                        dataToInsert={dataToInsert}
                        brand={"brand"} linea={"linea"} />
                </div>
            })}
        </div>
    ), [dataToInsert, categoryData])

    const handleSubmit = () => {
        const newErrors: Errors = {};
        if (!dataToInsert.target || dataToInsert.target.trim() === '') {
            newErrors.target = 'L\'obiettivo è richiesto';
        };
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        };

        ChangeLoadStatus({ from: 'objective', bool: true });

        const payload = {
            brand: dataToInsert.brand?.Marca,
            linea: dataToInsert.linea?.Linea,
            gruppo: dataToInsert.gruppo?.Gruppo,
            famiglia: dataToInsert.famiglia?.famiglia,
            target: parseFloat(dataToInsert.target),
            quarter: dataToInsert.quarter,
        };

        onSubmit(payload).finally(() => {
            handleClose();
        });
    };


    return (
        <Backdrop open={open} sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
            <div className="flex flex-col gap-4 !p-8 bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto">
                <p className="flex flex-col gap-2 text-gray-800 dark:text-gray-200">
                    <span className="text-lg font-semibold">Configura Obiettivo</span>
                    <span className="text-sm text-gray-500 ml-2">Seleziona i filtri per l'obiettivo</span>
                </p>

                {(!loadStatus.categoires && open) ? <>
                    <div className="flex flex-col items-center !mb-6">
                        <motion.h2
                            className="text-xl font-bold !mb-4 text-gray-800 dark:text-gray-200"
                            variants={fadeInDown}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            How it Works
                        </motion.h2>

                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl"
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                        >
                            {stepsHowItWorks.map((step, _) => (
                                <motion.div
                                    key={step.title}
                                    className="flex flex-col items-center bg-gray-100 dark:bg-neutral-800 rounded-xl !p-6 shadow-md transition duration-500 ease-in-out hover:scale-105"
                                    variants={fadeInUp}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                >
                                    <div className="mb-3 text-3xl">{step.icon}</div>
                                    <span className="font-semibold text-lg !mb-2 text-gray-700 dark:text-gray-100 text-center">
                                        {step.title}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-300 text-center">
                                        {step.desc}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    <motion.h2
                        className="text-xl font-bold text-gray-800 dark:text-gray-200"
                        variants={fadeInDown}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        Filtri
                    </motion.h2>
                    {filterRender}
                    <div className="flex flex-col gap-2 !mt-6">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Obiettivo</p>
                        <TextField
                            label="Inserisci l'obiettivo"
                            value={dataToInsert.target || ''}
                            onChange={(e) => handleChange('target', e.target.value)}
                            name="numberformat"
                            id="formatted-numberformat-input"
                            InputProps={{
                                inputComponent: NumericFormatCustom,
                            }}
                            variant="standard"
                        />
                        {errors.target && <span className="text-red-500 text-sm">{errors.target}</span>}
                    </div>

                    {/* Selezione del trimestre */}
                    <div className="flex flex-col gap-2 !mt-6">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Seleziona il Trimestre
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {['Q1', 'Q2', 'Q3', 'Q4'].map((label: string, index: number) => (
                                <motion.label
                                    key={label}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer transition 
                                    ${dataToInsert.quarter === index
                                            ? `bg-blue-500 dark:bg-[${palette.primary.main}] text-white shadow-lg`
                                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={dataToInsert.quarter === index}
                                        onChange={(_) => handleChange('quarter', index)}
                                        className="hidden"
                                    />
                                    {label}
                                </motion.label>
                            ))}
                        </div>
                    </div>

                    {/* Pulsanti di azione */}
                    <div className="!mt-4 flex justify-end gap-2">
                        <FDButton variant="soft" color='secondary' onClick={handleClose} loading={loadStatus.createObjective}>
                            Annulla
                        </FDButton>
                        <FDButton 
                        variant="solid"
                        color='primary'
                        onClick={handleSubmit} 
                        loading={loadStatus.createObjective}>
                            Salva
                        </FDButton>
                    </div>
                </>
                    :
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto !p-6 animate-pulse">
                        <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1" />
                        <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1" />
                        <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1" />
                        <div className="col-span-3 grid gap-4">
                            <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                            <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                        </div>
                        <div className="col-span-3 h-20 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                        <div className="col-span-3 flex justify-end gap-4">
                            <div className="h-15 w-32 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                            <div className="h-15 w-32 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                        </div>
                    </div>}
            </div>
        </Backdrop>
    );
};

export default ObjectiveDialog;
