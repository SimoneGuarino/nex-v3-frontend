import React from 'react';
import { IconButton, Slider, Stack, TextField } from '@mui/material';

import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { NumberToEuro } from 'utils/numberToEuro';
import { NumericFormat } from 'react-number-format';
import { icon_reset, icon_save } from 'config/icons';
import { useNexTheme } from '@nex/theme-system';


const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(
    props,
    ref,
) {
    const { onChange, ...other } = (props as any);

    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: (props as any).name,
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


interface TitlesProps { 
    subject: any;
    subjectBalance: "Linea" | "Marca";
    disableSave: boolean;
    Save: () => void;
    Reset: () => void;
}
export const Titles: React.FC<TitlesProps> = ({ subject, subjectBalance, disableSave, Save, Reset }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Stack alignItems='flex-start' maxWidth={300} ml={1.5} mr={3}>
        <MDTypography variant='body1' fontSize='1.5rem' sx={{color: `${darkMode ? palette.grey[400] : ''}`}}>
            Bilanciamento {subjectBalance}
        </MDTypography>
        <MDTypography variant='body2' fontSize='0.8rem' sx={{color: `${darkMode ? palette.grey[500] : ''}`}}>
            Bilancia la {subjectBalance} {subject}, modificano i vari parametri per ogni trimestri.
        </MDTypography>

        <Stack direction='row' gap={1} sx={{mt: 'auto', ml: 'auto'}}>
            {!disableSave && <IconButton onClick={() => Reset()} disabled={disableSave}
            sx={{ backgroundColor: `${darkMode ? palette.primary.dark : palette.secondary.main}`,
                "&:hover": {backgroundColor: `${darkMode ? palette.primary.main : palette.secondary.light}`},
                "&.Mui-disabled": {backgroundColor: `${disableSave ? darkMode ? palette.grey[900] : palette.grey[200] : ''}`
            }}}
            data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
            data-tooltip-content='Salva il bilanciamento modificato.'>
                {icon_reset({color: disableSave ? 
                    `${darkMode ? palette.grey[700] : palette.grey[400]}` : "#fff"})}
            </IconButton>}

            <IconButton onClick={() => Save()} disabled={disableSave}
            sx={{ backgroundColor: `${darkMode ? palette.primary.dark : palette.secondary.main}`,
                "&:hover": {backgroundColor: `${darkMode ? palette.primary.main : palette.secondary.light}`},
                "&.Mui-disabled": {backgroundColor: `${disableSave ? darkMode ? palette.grey[900] : palette.grey[200] : ''}`
            }}}
            data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
            data-tooltip-content='Salva il bilanciamento modificato.'>
                {icon_save({color: disableSave ? 
                    `${darkMode ? palette.grey[700] : palette.grey[400]}` : "#fff"})}
            </IconButton>
        </Stack>

    </Stack>
};


interface BoxProps {
    trimestri: any;
    quarter: any;
    mainTrimestri: any;
    onChangeBalance: (prev: any) => void;
};
export const SlideBox_: React.FC<BoxProps> = ({  quarter, trimestri, mainTrimestri, onChangeBalance }) => {
    const [position, setPosition] = React.useState((trimestri[quarter] * 100) / mainTrimestri[quarter]);
    const handleSliderChange = (event: Event, newValue: number | number[], from: "q1" | "q2" | "q3" | "q4") => {
        setPosition(newValue as number);
        onChangeBalance({ from, value: (mainTrimestri[quarter] * (newValue as number)) / 100 })
    };


    
    return <React.Fragment>
        <Slider
            value={(trimestri[quarter] * 100) / mainTrimestri[quarter]}
            onChange={((_: any, newValue: number | number[]) => handleSliderChange(_, newValue, quarter))}
            valueLabelDisplay="auto"
        />
        
        <Stack direction='row' alignItems='center' gap={1}>
            <MDTypography variant='body2' fontSize='0.8rem'>{NumberToEuro({ convert: (mainTrimestri[quarter] * (trimestri[quarter] * 100) / mainTrimestri[quarter]) / 100 })}</MDTypography>
            <MDTypography variant='body1' fontSize='1.2rem'>/</MDTypography>
            <MDTypography variant='body2' fontSize='0.8rem'>{NumberToEuro({ convert: mainTrimestri[quarter] })}</MDTypography>
        </Stack>
    </React.Fragment>
};



interface TextFieldBoxProps {
    trimestri: any;
    quarter: any;
    onChangeBalance: (prev: any) => void;
};
export const TextFieldBox_: React.FC<TextFieldBoxProps> = ({ quarter, trimestri, onChangeBalance }) => {
    return <TextField
        value={trimestri ? trimestri[quarter] : 0}
        onChange={(e) => onChangeBalance({ from: quarter, value: parseFloat(e.target.value) })}
        name="numberformat"
        id="formatted-numberformat-input"
        InputProps={{
            inputComponent: (NumericFormatCustom as any),
        }}
        variant="standard"
    />

};



interface BalanceQuartersProps {
    trimestri: any;
    mainTrimestri?: any;
    subject: string;
    subjectBalance: "Linea" | "Marca";
    Save: ({ trimestriUpdated }: { trimestriUpdated: any }) => void;
    slide: boolean
    quartersList: string[]
};
export const BalanceQuarters: React.FC<BalanceQuartersProps> = ({ trimestri, mainTrimestri, subject, subjectBalance, Save, slide, quartersList }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    //stato che forma una copia dei trimestri in modo da usarli poi in 
    const [trimestriUpdated, setTrimestriUpdated] = React.useState(trimestri);

    //se il soggetto (Marca) cambia allora aggiornami lo stato dei bilanciamenti prendendo quelli dell'attuale marca
    React.useEffect(() => {ResetSettedBalance()},[subject]);

    const changeBalances = React.useCallback(({ from, value }: { from: string, value: number }) => {
        if(from && value !== null){
            setTrimestriUpdated((prev: any) => {
                return {...prev, [from]: value}
            });
        };
    },[trimestriUpdated]);

    const SaveBrdige = () => {
        Save({trimestriUpdated});
    };

    //reset dello stato interno del bilanciamento.
    const ResetSettedBalance = () => {
        setTrimestriUpdated(trimestri);
    };




    return <Stack direction='row' sx={{ p: 2, width: '100%' }}>
        <Titles subject={subject} subjectBalance={subjectBalance}
        Save={SaveBrdige} Reset={ResetSettedBalance} disableSave={JSON.stringify(trimestri) === JSON.stringify(trimestriUpdated)}/>
        <Stack direction='row' gap={1}>
            {quartersList.map((quarter: string, index: number) => (
                <Stack key={index} minWidth={200} p={2} alignItems='center'
                    sx={{ backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[200]}`, borderRadius: 3 }}>
                    <MDTypography sx={{ mb: 1 }}>{quarter.toUpperCase()}</MDTypography>
                    {(slide || slide == undefined) ? <SlideBox_ key={index}
                        quarter={quarter} trimestri={trimestriUpdated} mainTrimestri={mainTrimestri}
                        onChangeBalance={changeBalances} />
                        : <TextFieldBox_ quarter={quarter} trimestri={trimestriUpdated} onChangeBalance={changeBalances} />}
                </Stack>
            ))}
        </Stack>
    </Stack>
};