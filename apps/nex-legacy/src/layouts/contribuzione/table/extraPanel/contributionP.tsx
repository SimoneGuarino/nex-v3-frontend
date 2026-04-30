import React from 'react';
import {
    Backdrop, IconButton, Stack,
    FormControl, MenuItem, InputLabel, Divider, Typography,
    Card, Collapse
} from '@mui/material';

import Select from '@mui/material/Select';
import { icon_close, icon_creditCard, icon_delete, icon_exchangeMoney, icon_people, icon_save, icon_saveMoney, icon_send } from '../../../../config/icons';

import company from 'assets/images/company/company_singole_img_vectorized_illustration.webp';
import personal from 'assets/images/person/person_searching_documents.webp';

import { NumberToEuro } from 'utils/numberToEuro';
import { TransitionGroup } from 'react-transition-group';
import { enqueueSnackbar } from 'components/MessageBox';




const NoProduct: React.FC<{ text: string, img: any; width?: number | null }> = (({ text, img, width }) => {
    return <Stack p={2} alignItems='center' sx={{ opacity: '0.5', height: '100%' }} flex='100%' justifyContent='center'>
        <img src={img} loading='lazy'
            style={{
                borderRadius: 2, maxWidth: `${width ? width + "px" : "250px"}`, marginBottom: '1.5rem',
                width: 'fit-content', height: 'fit-content', filter: 'grayscale(1)'
            }} />
        <Typography variant='subtitle2' color='#000' style={{ textAlign: 'center' }}>{text}</Typography>
    </Stack>
});




interface CompanyCardProps {
    data: any;
    index: number;
    RemoveElementFromList: any;
};
const CompanysCard_: React.FC<CompanyCardProps> = ({ data, index, RemoveElementFromList }) => {
    const iconColor: string = '#3787a7';

    const Header = () => (
        <Stack direction='row' gap={1}>

            <Stack>
                <Stack direction='row' gap={1}>
                    {icon_people({ color: iconColor })}
                    <Typography variant='subtitle2' color='#e5e5e5'>
                        Nome
                    </Typography>
                </Stack>

                <Typography variant='body1' color='inherit'>
                    {data?.codRaggruppamento?.toLowerCase()}
                </Typography>
            </Stack>
            <IconButton onClick={() => RemoveElementFromList(index, false)}
                sx={{ marginLeft: 'auto', background: '#9bbfd5', height: 'fit-content' }}>
                {icon_delete({ color: '#efefef' })}
            </IconButton>
        </Stack>
    );


    const Body = () => (
        <Stack>
            <Stack direction='row' gap={1}>
                {icon_creditCard({ color: iconColor })}
                <Typography variant='subtitle2' color='#e5e5e5'>
                    Disponibilità
                </Typography>
            </Stack>

            <Stack direction='row' alignItems='flex-end' gap={2} flex='100%'>
                <Typography variant='h1' color='inherit'>
                    {NumberToEuro({ toSum: [(data.importoBudget - data.importoConsolidato)] })}
                </Typography>
                <Typography variant='h6' color='inherit'>
                    di {NumberToEuro({ convert: data.importoBudget })}
                </Typography>
            </Stack>
        </Stack>
    );

    const Footer = () => (
        <Stack mt='auto' direction='row' alignItems='flex-end'>
            <Stack>
                <Typography variant='subtitle2' color='#e5e5e5'>
                    Codice
                </Typography>
                <Typography variant='body2'>
                    {data.idBudget}
                </Typography>
            </Stack>

            <Stack ml='auto'>
                <Typography variant='subtitle2' color='#e5e5e5'>
                    Data
                </Typography>
                <Typography variant='body2'>
                    {data.annoBudget}
                </Typography>
            </Stack>
        </Stack>
    );

    return <Card key={index} sx={{
        minHeight: 260,
        background: 'linear-gradient(161deg, #8dc6c9e8, #1e8ed9)',
        display: 'flex', padding: 3, color: '#fff', gap: 1
    }}>
        {Header()}
        <Divider sx={{ margin: 0, backgroundColor: '#057534' }} />
        {Body()}
        <Divider sx={{ margin: 0, backgroundColor: '#057534' }} />
        {Footer()}
    </Card>
}



interface PersonalCardProps {
    data: any;
    index?: number;
    RemoveElementFromList: any;
};
const PersonalCard: React.FC<PersonalCardProps> = ({ data, index, RemoveElementFromList }) => {
    const Header = () => (
        <Stack direction='row' width='100%' gap={1}>
            <Stack flex='33%'>
                <Typography variant='subtitle2' color='#e5e5e5'>
                    Nome
                </Typography>
                <Typography variant='subtitle2' color='inherit'>
                    {data?.codRaggruppamento?.toLowerCase()}
                </Typography>
                <IconButton onClick={() => RemoveElementFromList(null, true)}
                    sx={{ mr: 'auto', mt: 1, background: '#767676', height: 'fit-content' }}>
                    {icon_delete({ color: '#efefef' })}
                </IconButton>
            </Stack>

            <Stack flex='33%' alignItems='center'>
                <Typography variant='subtitle2' color='#e5e5e5'>
                    Codice
                </Typography>
                <Typography variant='body2'>
                    {data.idBudget}
                </Typography>
            </Stack>

            <Stack ml='auto' flex='33%' alignItems='center'>
                <Typography variant='subtitle2' color='#e5e5e5'>
                    Data
                </Typography>
                <Typography variant='body2'>
                    {data.annoBudget}
                </Typography>
            </Stack>
        </Stack>
    );

    const Body = () => (
        <Stack ml='auto'>
            <Typography variant='subtitle2' color='#e5e5e5'>
                Disponibilità
            </Typography>
            <Stack>
                <Typography variant='h3' color='inherit'>
                    {NumberToEuro({ toSum: [(data.importoBudget - data.importoConsolidato)] })}
                </Typography>
                <Typography variant='body2' color='inherit'>
                    di {NumberToEuro({ convert: data.importoBudget })}
                </Typography>
            </Stack>
        </Stack>
    );

    return <Card key={index} sx={{
        minHeight: 100, background: 'linear-gradient(161deg, #646464e8, #3c3c3c)',
        display: 'flex', padding: 3, color: '#fff', gap: 1, flexDirection: 'row'
    }}>
        {Header()}
        {Body()}
    </Card>
}



interface ContributionBlockProps {
    listToShowInSelect: Array<object>;
    elementToRender: any;
    AddElementToList: (index: any,) => void;
    RemoveElementFromList?: (index: number, type: boolean) => void;
    type: boolean;

    iconNoElements: any;
    iconNoElements_Width?: number;
    setListToShowInSelect: (prev: any) => void;
};
/**
 * Tag di generazione dei blocchi sia per PersonalContribution che per CompanysContributions.
 * @param listToShowInSelect Array<object> | Lista degli elementi da poter selezionare nella select
 * @param AddElementToList Func(index) | Funzione di richiamo per l'inserimento degli elementi nella lista del Render
 * @param RemoveElementFromList Func(index) | Funzione di richiamo per il delete degli elementi nella lista del Render
 * @param elementToRender Array<object> | Lista degli elementi da renderizzare inseriti in precedenza dalla select
 * @param type Boolean | True => PersonalCard && False => CompanysCard_
 * @returns 
 */
const ContributionBlock: React.FC<ContributionBlockProps> = ({ listToShowInSelect, AddElementToList, RemoveElementFromList, elementToRender,
    type, iconNoElements, iconNoElements_Width, setListToShowInSelect }) => {
    const [selectValue, setSelectValue] = React.useState<number | string>("");

    return <React.Fragment>
        <Stack direction='row' gap={1} alignItems='center'>
            <FormControl fullWidth sx={{ marginBottom: 1 }}>
                <InputLabel id="demo-multiple-checkbox-label">{type ? "Lista Contribuzioni Focelda" : "Lista Contribuzioni Aziendali"}</InputLabel>
                <Select
                    id="data-select-typology"
                    sx={{ height: 40 }}
                    value={selectValue}
                    onChange={(e) => setSelectValue(e.target.value)}
                    autoWidth
                    label={type ? "Lista Contribuzioni Personali" : "Lista Contribuzioni Aziendali"}
                >
                    {listToShowInSelect.map((data: any, index: number) => (
                        <MenuItem value={index} key={index}>{data.codRaggruppamento}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <IconButton sx={{ backgroundColor: '#ededed' }}
                onClick={() => { AddElementToList(selectValue); !type && setSelectValue(""); }}>
                {icon_send()}
            </IconButton>
        </Stack>

        <Stack gap={2} overflow='auto' pr={1} sx={{ minHeight: `${elementToRender?.length === 0 ? '210px' : type ? '150px' : '280px'}` }}>
            {Object.values(elementToRender)?.length > 0 ? <TransitionGroup style={{ display: 'flex', flexDirection: 'column', gap: "10px" }}>
                {!type ? elementToRender.map((data: any, index: any) => (
                    <Collapse key={index}>
                        <CompanysCard_ data={data} index={index}
                            RemoveElementFromList={RemoveElementFromList} />
                    </Collapse>
                )) : <Collapse><PersonalCard data={elementToRender}
                    RemoveElementFromList={RemoveElementFromList} /></Collapse>
                }
            </TransitionGroup>
                : <NoProduct width={iconNoElements_Width} text={`Seleziona una 
                ${type ? 'contribuzione Focelda' : 'o piu contribuzioni Aziendali'} in modo da contribuire gli elementi in negativo`} img={iconNoElements} />}
        </Stack>
    </React.Fragment>
}



interface ContributionPProps {
    status: boolean;
    ChangeStatusContributionP: () => void;
    contribution_selected: string[];
    setcontribution_selected: (prev: any) => void;
    noDataWEBP: any;
    warehousesFilterType: number;
    HandleFlipWarehouseType: () => void;

    avabileContributionsList: Array<object>;
    setAvaibleContributionsList: (prev: any) => void;

    companyList: Array<object>;
    setCompanyList: (prev: any) => void;
    company_selected: Array<object>;
    setCompany_selected: (prev: any) => void;

    loadState: boolean;
    SortWholeData: (index: number | null, indexPromo: number | null, contributionChanged: boolean, contributionNewSelected: any) => void;
}
export const ContributionP: React.FC<ContributionPProps> = ({ status, ChangeStatusContributionP,
    contribution_selected, setcontribution_selected, avabileContributionsList, setAvaibleContributionsList,
    company_selected, setCompany_selected, companyList, setCompanyList, loadState, SortWholeData }) => {

    const AddElementToList = (index: any) => {
        const object: any = avabileContributionsList[index];
        setCompany_selected((prev: string[]) => {
            const copy = [...prev];
            return [...copy, object];
        });

        //elimina l'elmento inserito dalla lista dei disponibili
        setCompanyList((prev: any) => {
            const copy = [...prev];
            const findIndex = copy.findIndex(e => e.idBudget === object.idBudget);
            copy.splice(findIndex, 1);
            return copy;
        });
    };

    const SwitchElement = (index: any) => {
        if (loadState) { 
            return enqueueSnackbar('Perfavore, aspetta che i dati vengano caricati prima di selezionare una contribuzione.', {
                title: 'Errore nella selezione',
                type: 'warning',
            });
        };
        const object: any = avabileContributionsList[index];
        if (Object.keys(contribution_selected).length > 0) {
            if (object.idBudget !== (contribution_selected as any).idBudget) {
                setcontribution_selected(object);
            } else {
                return enqueueSnackbar('La contribuzione selezionata è già stata applicata, perfavore scegline un altra se disponibile.', {
                    title: 'Contribuzione selezionata',
                    type: 'info',
                });
            };
        } else {
            setcontribution_selected(object);
        };

        SortWholeData(null, null, true, object);
    };

    /**
     * Rimuove gli elementi dalla lista in base alla proprietà type
     * @param index number | indice del'elemento che si vuole cancellare
     * @param type Boolean | True => PersonalCard && False => CompanysCard_
     */
    const RemoveElementFromList = (index: any, type: boolean) => {
        const object: any = contribution_selected[index];

        if (!type) {
            setCompany_selected((prev: string[]) => {
                const copy = [...prev];
                copy.splice(index, 1);
                return copy;
            });

            //elimina l'elmento inserito dalla lista dei disponibili
            setCompanyList((prev: any) => {
                const copy = [...prev];
                return [...copy, object];
            });
        } else {
            setcontribution_selected({});
        }
    };


    return <Backdrop open={status} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Stack sx={{
            maxWidth: 600,
            width: '35%', height: '100%', borderRadius: 3, transition: 'all 200ms ease-in', p: 2,
            backgroundColor: '#fff', position: 'inherit', right: 0, top: 0
        }}>
            <Stack direction='row' alignItems='center' mb={2} gap={1.5}>
                <Stack direction='row' alignItems='center'>
                    {icon_saveMoney({ color: '#000', width: 30, height: 30 })}
                    {icon_exchangeMoney({ color: '#000', width: 25, height: 25 })}
                </Stack>

                <Typography color='#000' sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Aggiungi Contribuzione</Typography>
                <IconButton sx={{ ml: 'auto' }} onClick={() => ChangeStatusContributionP()}>
                    {icon_close()}
                </IconButton>
            </Stack>

            <ContributionBlock listToShowInSelect={avabileContributionsList} AddElementToList={SwitchElement}
                elementToRender={contribution_selected} type={true} iconNoElements={personal} iconNoElements_Width={130}
                setListToShowInSelect={setCompanyList} RemoveElementFromList={RemoveElementFromList} />

            {/*<Divider sx={{ backgroundColor: '#ccc' }} />

            <ContributionBlock listToShowInSelect={avabileContributionsList} setListToShowInSelect={setCompanyList}
                AddElementToList={AddElementToList} RemoveElementFromList={RemoveElementFromList}
                elementToRender={company_selected} type={false} iconNoElements={company} /> */}

        </Stack></Backdrop>
}