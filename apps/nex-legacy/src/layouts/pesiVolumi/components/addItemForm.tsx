import { icon_send } from 'config/icons';
import React from 'react';
import { SearchItemAPI } from '../fetchData/SearchItem';
import { enqueueSnackbar } from 'components/MessageBox';
import FDInput from 'components/UI/input/FDInput';
import FDBox from 'components/UI/box/FDBox';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import FDButton from 'components/UI/buttons/FDButton';
import { useTour } from "tour/TourProvider";

interface InsertDataProps {
    [key: string]: any;
    ci?: string;
    lunghezza?: number;
    larghezza?: number;
    altezza?: number;
    peso?: number;
    volume?: number;
};

const convert = [
    { name: 'lunghezza', measure: 'cm' },
    { name: 'larghezza', measure: 'cm' },
    { name: 'altezza', measure: 'cm' },
    { name: 'peso', measure: 'kg' },
    { name: 'volume', measure: 'mm3' },
];

interface GenerateTextFiledProps {
    dataState: object;
    arr: string[];
    HandleChange: (name: string, e: string, type: typeof String | typeof Number) => void;
};

const GenerateTextFiled: React.FC<GenerateTextFiledProps> = ({ arr, HandleChange, dataState }) => {
    return (
        <>
            {arr.map((name: string) => {
                const type = name === 'ci' ? String : Number;
                const measureIndex = convert.findIndex((x: any) => x.name === name);
                const measure = measureIndex !== -1 ? convert[measureIndex].measure : null;

                const rawValue = (dataState as any)[name];
                const value = rawValue !== undefined && rawValue !== null
                    ? rawValue.toString()
                    : '';

                return (
                    <FDInput
                        key={name}
                        label={name === 'ci' ? 'Codice Articolo' : `${name}${measure ? ` ( ${measure} )` : ''}`}
                        value={value.replace('.', ',')}
                        variant="outline"
                        onChange={e => HandleChange(name, e.target.value, type)}
                        fullWidth
                        size='sm'
                        radius='md'
                    />
                );
            })}
        </>
    );
};

interface ParmBarProps {
    InsertRow: (item: InsertDataProps) => void;
    abortController: any;
    userContext: { token: string, details?: { [key: string]: string | number } } | null;
};

export const ParmBar: React.FC<ParmBarProps> = ({ InsertRow, abortController }) => {
    const [insertData, setInsertData] = React.useState<InsertDataProps>({});
    const mandatoryList = ['ci', 'lunghezza', 'larghezza', 'altezza', 'peso'];

    // Definisci le regole per ogni campo
    const fieldRules: { [key: string]: { integerLength: number, decimalLength: number } } = {
        ci: { integerLength: 6, decimalLength: 0 },        // Codice articolo
        altezza: { integerLength: 6, decimalLength: 2 },   // Altezza
        lunghezza: { integerLength: 6, decimalLength: 2 }, // Lunghezza
        larghezza: { integerLength: 6, decimalLength: 2 }, // Profondità
        peso: { integerLength: 7, decimalLength: 3 },      // Peso
        volume: { integerLength: 7, decimalLength: 3 },    // Volume
    };

    // Verifica se ci sono campi vuoti o nulli
    const BrakeAnyRules = React.useCallback(() => {
        if (Object.keys(insertData).length === 0 || Object.keys(insertData).length < Object.keys(fieldRules).length) {
            return true;
        }

        for (const key in insertData) {
            if (insertData[key] === 0 || insertData[key] === null || insertData[key] === undefined) {
                return true;
            }
        }
        return false;
    }, [insertData]);

    function HandleData(name: string, value: string, type: typeof String | typeof Number) {
        let value__: any = value;

        if (type === Number) {
            // Sostituisci la virgola con il punto per mantenere compatibilità con il formato decimale
            value__ = value.replace(',', '.');

            // Recupera le regole del campo in base a "name"
            const rules = fieldRules[name];
            if (rules) {
                const { integerLength, decimalLength } = rules;
                const isVolume = name === 'volume';

                // Verifica se l'input è un numero valido e positivo
                const isValidInput = /^\d*([.]\d*)?$/.test(value__);
                if (!isValidInput) return; // Interrompi se il numero è negativo o contiene più punti

                // Limita il numero intero e i decimali a quanto specificato
                const [integerPart = '', decimalPart = ''] = value__.split('.');

                // Verifica se la parte intera supera il limite
                if ((integerPart?.length || 0) > integerLength) {
                    return; // Interrompi se la parte intera supera il limite
                }

                if (decimalPart && decimalPart.length > decimalLength && !isVolume) {
                    return; // Interrompi se la parte decimale supera il limite
                }

                // Se il valore è finale (non parziale), tronca i decimali e convertilo in float
                const isFinalNumber = !value__.endsWith('.') && !isNaN(parseFloat(value__));

                if (isFinalNumber) {
                    // Tronca la parte decimale se necessario
                    let truncatedValue = integerPart;
                    if (decimalPart) {
                        truncatedValue += '.' + decimalPart.slice(0, decimalLength);
                    }

                    if (value__[value__.length - 1] > 0) {
                        value__ = parseFloat(truncatedValue);
                    }

                    // Regola per Volume: controlla la lunghezza massima totale e tronca il valore
                    if (name === 'volume') {
                        const totalLength = integerPart.length + (decimalPart ? decimalPart.length : 0);
                        if (totalLength > integerLength + decimalLength) {
                            value__ = parseFloat((value__).toFixed(decimalLength)); // Tronca ai decimali consentiti
                        }
                    }
                }
            }
        };

        // Aggiorna lo stato solo se il valore è cambiato
        if ((insertData as any)[name] !== value__) {
            setInsertData((prev: InsertDataProps) => {
                return { ...prev, [name]: value__ };
            });
        }
    };

    function SendRow() {
        setInsertData((prev: InsertDataProps) => {
            const convertedPrev = { ...prev };
            // controlla se tutti i campi obbligatori sono stati compilati
            for (let i = 0; i < mandatoryList.length; i++) {
                const key = mandatoryList[i];
                if (insertData[key] == undefined) {
                    let name;
                    switch (key) {
                        case 'ci':
                            name = 'Codice Articolo';
                            break;
                        default:
                            name = key;
                            break;
                    }
                    enqueueSnackbar(
                        `Perfavore compila tutti i campi, sembra che tu non abbia inserito '${name}'`,
                        {
                            title: 'Campi mancanti',
                            type: 'warning',
                        }
                    );
                    return prev;
                } else {
                    if (key !== 'ci') {
                        convertedPrev[key] = parseFloat(insertData[key] as any);
                    }
                    continue;
                }
            }
            InsertRow(convertedPrev);
            return {};
        });
    };

    // Calcolo automatico del volume in base alle dimensioni
    React.useEffect(() => {
        if (insertData.lunghezza && insertData.altezza && insertData.larghezza) {
            let volume_: any = ((insertData.lunghezza * insertData.altezza) * insertData.larghezza) / 1000000;

            if (volume_ < 0.001) {
                volume_ = 0.001;
            } else {
                volume_ = Number(volume_.toFixed(fieldRules.volume.decimalLength));
            }

            HandleData('volume', volume_.toString(), Number);
        } else if ((insertData.lunghezza || insertData.altezza || insertData.larghezza) && insertData.volume) {
            setInsertData((prev: InsertDataProps) => {
                const { volume: omitted, ...rest } = prev; // Escludi la proprietà 'volume' dall'oggetto di stato
                return rest;
            });
        }
    }, [insertData]);

    // Autocomplete descrizione / dati articolo solo dal 6° carattere del CI
    React.useEffect(() => {
        const ci = insertData.ci?.toString() ?? '';

        // se non c'è nulla, resetta
        if (!ci) {
            setInsertData({});
            return;
        }

        // non cercare fino a quando non hai almeno 6 caratteri
        if (ci.length < 6) {
            return;
        }

        // Abort Controller per il fetch
        abortController.current = new AbortController();

        const delayDebounceFn = setTimeout(() => {
            // rimuovi eventuale descrizione precedente prima della nuova ricerca
            setInsertData((prev: any) => {
                const copy = { ...prev };
                delete copy.descrizione;
                return copy;
            });

            const params = new URLSearchParams();
            params.set("cda", ci);

            SearchItemAPI({
                abortController: abortController,
                params,
                setInsertData: setInsertData,
            });
        }, 800);

        return () => {
            clearTimeout(delayDebounceFn);
        };
    }, [insertData.ci]);

    // ------- DERIVATE PER IL RENDER --------
    const hasDims =
        insertData.lunghezza != null &&
        insertData.altezza != null &&
        insertData.larghezza != null;

    const computedVolume = hasDims
        ? ((Number(insertData.lunghezza) * Number(insertData.altezza) * Number(insertData.larghezza)) / 1_000_000)
        : null;

    const volumePrecision = fieldRules.volume.decimalLength;

    const showVolumeMismatch =
        computedVolume != null &&
        insertData.volume != null &&
        Number(insertData.volume).toFixed(volumePrecision) !== (computedVolume as number).toFixed(volumePrecision);

    const showVolume = insertData.volume != null;

    // ---------------------------------------

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 1;

    return (
        <FDBox pad="md" radius="xl" >
            <div className='flex items-center justify-between w-full gap-2 flex-col md:flex-row'>
                <div className="flex gap-2 items-center flex-col md:flex-row w-full" data-tour="pesi-filters">
                    {lockInteractions && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: 'auto',
                            }}
                            onClickCapture={(e) => e.stopPropagation()}
                        />
                    )}
                    <GenerateTextFiled arr={mandatoryList} HandleChange={HandleData} dataState={insertData} />
                </div>
                <div className='flex items-center' data-tour="pesi-filters-register">
                    <FDButton
                        variant='solid'
                        color='primary'
                        disabled={BrakeAnyRules()}
                        onClick={() => SendRow()}
                        dataTooltipId='general-logistic-tooltip'
                        dataTooltipContent='Registra peso e volume'
                        className='block md:hidden'
                    >
                        Registra peso e volume
                    </FDButton>
                    <FDIconButton
                        disabled={BrakeAnyRules()}
                        icon={icon_send({ width: 20, height: 20, color: BrakeAnyRules() ? 'disabled' : 'primary' })}
                        onClick={() => SendRow()}
                        dataTooltipId='general-logistic-tooltip'
                        dataTooltipContent='Registra peso e volume'
                        className='hidden md:block'
                    />
                </div>
            </div>
            {(showVolume || showVolumeMismatch || insertData.descrizione) && (
                <div className='flex flex-col mt-4 px-1 text-xs gap-y-2'>
                    {(showVolume || showVolumeMismatch) && (
                        <div className='flex items-start md:items-center w-full flex-col md:flex-row justify-between'>
                            {showVolume && (
                                <div className='flex items-center gap-1'>
                                    <h2>Volume:</h2>
                                    <span className='text-gray-500 text-md font-bold'>
                                        {Number(insertData.volume).toFixed(volumePrecision)} mm³
                                    </span>
                                </div>
                            )}
                            {showVolumeMismatch && (
                                <div
                                    className='flex items-center gap-1'
                                    data-tooltip-id='general-logistic-tooltip'
                                    data-tooltip-content='Volume Reale calcolato in base alle dimensioni inserite, senza limitazioni a 4 decimali per AS400'
                                >
                                    <h2>Volume Reale: </h2>
                                    <span className='text-red-500 text-md font-bold'>
                                        {(((insertData as any)?.lunghezza * (insertData as any)?.altezza) * (insertData as any)?.larghezza) / 1000000} mm³
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {insertData.descrizione && (
                        <div className='flex items-start md:items-center w-full flex-col md:flex-row justify-between'>
                            <div className='flex items-center gap-1'>
                                <h2>Codice Produttore:</h2>
                                <span className='text-gray-500 text-md font-bold'>
                                    {(insertData && insertData?.codiceProduttore)
                                        ? insertData.codiceProduttore
                                        : 'Codice Produttore Non Presente.'}
                                </span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <h2>Descrizione Articolo:</h2>
                                <span className='text-gray-500 text-md font-bold'>
                                    {(insertData && insertData?.descrizione)
                                        ? insertData.descrizione
                                        : 'Descrizione Non Presente.'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </FDBox>
    );
};
