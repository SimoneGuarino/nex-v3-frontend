import { useState, useCallback, useRef, ChangeEvent } from 'react';
import { FDBox, FDButton, FDInput, FDSelect, type FDSelectOption } from '@nex/fd-ui';

import { useUserContext } from 'context/UserContext';
import { insertOrdineOFFB, type OrdineOFFB } from '../fetchdata';
// icons
import { IoAddOutline } from "react-icons/io5";

/** Struttura per la validazione di ogni campo */
interface FieldState<T> {
    value: T;
    error: boolean;
    message: string;
}

/** Stato completo del form */
interface FormState {
    tipo: FieldState<string>;
    numero: FieldState<string>;
    quantita: FieldState<string>;
    email: FieldState<string>;
    descrizione: FieldState<string>;
    note: FieldState<string>;
}

/** Opzioni per il select tipo ordine */
const tipoOptions: FDSelectOption<string>[] = [
    { value: 'OF', label: 'OF' },
    { value: 'FB', label: 'FB' },
];

/** Crea lo stato iniziale del form */
const createInitialState = (email: string): FormState => ({
    tipo: { value: 'OF', error: false, message: '' },
    numero: { value: '', error: false, message: '' },
    quantita: { value: '', error: false, message: '' },
    email: { value: email, error: false, message: '' },
    descrizione: { value: '', error: false, message: '' },
    note: { value: '', error: false, message: '' },
});

/** Funzioni di validazione per ogni campo */
const validators: Record<keyof FormState, (value: string) => { valid: boolean; message: string }> = {
    tipo: (value) => ({
        valid: ['OF', 'FB'].includes(value),
        message: 'Si può inserire solo un ordine FB o OF',
    }),
    email: (value) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return {
            valid: value.length > 5 && value.length < 254 && emailRegex.test(value),
            message: 'Deve essere un indirizzo mail valido',
        };
    },
    numero: (value) => ({
        valid: !isNaN(Number(value)) && Number(value) > 0,
        message: 'Deve essere maggiore di zero e in formato numerico',
    }),
    quantita: (value) => ({
        valid: !isNaN(Number(value)) && Number(value) > 0,
        message: 'Deve essere maggiore di zero e in formato numerico',
    }),
    descrizione: (value) => ({
        valid: value.length > 4,
        message: 'La richiesta deve contenere almeno 5 caratteri',
    }),
    note: () => ({ valid: true, message: '' }),
};

export function TesisForm() {
    const [userContext] = useUserContext();
    const userEmail = (userContext as any)?.details?.username ?? '';

    const [formState, setFormState] = useState<FormState>(() => createInitialState(userEmail));
    const [globalError, setGlobalError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const abortController = useRef<AbortController | null>(null);

    /** Gestisce il cambio di un campo */
    const handleChange = useCallback((field: keyof FormState, value: string) => {
        const validation = validators[field](value);
        setFormState(prev => ({
            ...prev,
            [field]: {
                value: field === 'email' ? value.toLowerCase() : value,
                error: !validation.valid,
                message: validation.valid ? '' : validation.message,
            },
        }));
        setGlobalError('');
    }, []);

    /** Gestisce l'invio del form */
    const handleSubmit = useCallback(async () => {
        // Valida tutti i campi
        let hasErrors = false;
        const newState = { ...formState };

        for (const key of Object.keys(formState) as (keyof FormState)[]) {
            const validation = validators[key](formState[key].value);
            if (!validation.valid && key !== 'note') {
                hasErrors = true;
                newState[key] = {
                    ...newState[key],
                    error: true,
                    message: validation.message,
                };
            }
        }

        if (hasErrors) {
            setFormState(newState);
            setGlobalError('Ci sono alcuni campi vuoti o non validi, ricontrolla per favore');
            return;
        }

        // Prepara i dati per l'invio
        const ordine: OrdineOFFB = {
            tipo: formState.tipo.value,
            numero: parseInt(formState.numero.value, 10),
            quantita: parseInt(formState.quantita.value, 10),
            email: formState.email.value,
            descrizione: formState.descrizione.value,
            note: formState.note.value,
        };

        setLoading(true);
        setGlobalError('');

        try {
            await insertOrdineOFFB(ordine, abortController);
            setSuccess(true);
            setFormState(createInitialState(userEmail));

            // Nascondi il messaggio di successo dopo 5 secondi
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: unknown) {
            setGlobalError("Si è verificato un errore durante l'inserimento, riprova fra poco o contatta il servizio tecnico");
        } finally {
            setLoading(false);
        }
    }, [formState, userEmail]);

    return (
        <FDBox fullWidth radius="lg" pad="sm">
            <div className="w-full h-full flex flex-col gap-4">
                {/* Griglia campi principali */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[360px] md:min-w-[500px] lg:min-w-[768px] max-w-[800px] mx-auto">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs ml-1.5">
                            Tipo di Ordine <span className="text-red-500">*</span>
                        </span>
                        <FDSelect
                            radius="md"
                            size="sm"
                            options={tipoOptions}
                            value={formState.tipo.value}
                            onChange={(v) => handleChange('tipo', v as string)}
                            error={formState.tipo.error}
                            helperText={formState.tipo.message}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs ml-1.5">
                            Numero Ordine <span className="text-red-500">*</span>
                        </span>
                        <FDInput
                            radius="md"
                            size="sm"
                            type="text"
                            value={formState.numero.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('numero', e.target.value)}
                            error={formState.numero.error}
                            helperText={formState.numero.message}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs ml-1.5">
                            Quantità <span className="text-red-500">*</span>
                        </span>
                        <FDInput
                            radius="md"
                            size="sm"
                            type="number"
                            value={formState.quantita.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('quantita', e.target.value)}
                            error={formState.quantita.error}
                            helperText={formState.quantita.message}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs ml-1.5">
                            Mail apertura ticket <span className="text-red-500">*</span>
                        </span>
                        <FDInput
                            radius="md"
                            size="sm"
                            type="email"
                            value={formState.email.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
                            error={formState.email.error}
                            helperText={formState.email.message}
                        />
                    </div>
                </div>

                {/* Textarea richiesta e note */}
                <div className="flex min-w-[360px] md:min-w-[500px] lg:min-w-[768px] max-w-[800px] mx-auto flex-col sm:flex-row gap-3 w-full">
                    <div className="w-full sm:w-[50%] flex flex-col gap-1">
                        <span className="text-xs ml-1.5">
                            Richiesta <span className="text-red-500">*</span>
                        </span>
                        <textarea
                            name="descrizione"
                            className={`border rounded-md w-full h-32 p-2 text-sm resize-none dark:bg-neutral-900 dark:border-neutral-700 ${formState.descrizione.error ? 'border-red-500' : 'border-neutral-300'
                                }`}
                            placeholder='Inserire il codice prodotto oppure richiesta lavorazione "assemblaggio", "installazione" ecc..'
                            value={formState.descrizione.value}
                            onChange={(e) => handleChange('descrizione', e.target.value)}
                        />
                        {formState.descrizione.error && (
                            <span className="text-xs text-red-500 ml-1.5">{formState.descrizione.message}</span>
                        )}
                    </div>
                    <div className="w-full sm:w-[50%] flex flex-col gap-1">
                        <span className="text-xs ml-1.5">Note</span>
                        <textarea
                            name="note"
                            className="border rounded-md w-full h-32 p-2 text-sm resize-none dark:bg-neutral-900 dark:border-neutral-700 border-neutral-300"
                            value={formState.note.value}
                            onChange={(e) => handleChange('note', e.target.value)}
                        />
                    </div>
                </div>

                {/* Messaggi di stato */}
                {success && (
                    <p className="text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-sm text-center">
                        ✓ Inserito con successo!
                    </p>
                )}
                {globalError && (
                    <p className="text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm text-center">
                        ✕ {globalError}
                    </p>
                )}

                <p className="text-xs text-neutral-500 text-center">
                    I campi contrassegnati con <span className="text-red-500">*</span> sono obbligatori.
                </p>

                {/* Bottone submit */}
                <FDButton
                    variant="solid"
                    radius="md"
                    color="primary"
                    className="w-full sm:w-min mx-auto"
                    rightIcon={IoAddOutline({})}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Inserimento...' : 'Inserisci'}
                </FDButton>
            </div>
        </FDBox>
    );
}

export default TesisForm;