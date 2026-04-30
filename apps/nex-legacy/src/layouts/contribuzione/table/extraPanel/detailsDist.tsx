import { icon_close, icon_info } from '../../../../config/icons';
import React from 'react';

import { PickLowest } from '../../../../utils';

import ConvertModule from '../../../../classes/convert';
import { FDBackdrop } from 'components/UI/box/FDBackdrop';
import FDBox from 'components/UI/box/FDBox';
import FDIconButton from 'components/UI/buttons/FDIconButton';
const Convert = new ConvertModule();



interface Distributor {
    Prezzo: number;
    PrezzoListino: number;
    Disponibili: number;
}



interface DistBlockProps {
    element: Distributor;
    name: string;
};
const Block: React.FC<DistBlockProps> = ({ element, name }) => {
    return <div className="py-4 px-2">
        <h3 className="text-[1.3rem] mb-2 font-semibold text-slate-800 dark:text-slate-100">
            {name}
        </h3>
        <div className="flex flex-row items-center">
            <p className="m-0 text-base font-light text-[#344767] dark:text-slate-300">
                Prezzo
            </p>
            <p className="m-0 text-base font-light ml-auto text-slate-700 dark:text-slate-200">
                {Convert.euro(PickLowest(element.Prezzo, element.PrezzoListino)).Data}
            </p>
        </div>
        <div className="flex flex-row items-center mt-1 mb-0">
            <p className="m-0 text-base font-light text-[#344767] dark:text-slate-300">
                Disponibilità
            </p>
            <p className="m-0 text-base font-light ml-auto text-slate-700 dark:text-slate-200">
                {element.Disponibili}
            </p>
        </div>
    </div>
};
interface DistInterfaceProps {
    dist: any;
};
const DistInterface: React.FC<DistInterfaceProps> = ({ dist }) => {
    const Blocks = React.useCallback(() => {
        let blocks = [];
        for (const key in dist) {
            const e = dist[key];
            if (e.Disponibili > 0 && (e.Prezzo > 0 || e.PrezzoListino > 0)) {
                blocks.push(<React.Fragment key={key}>
                    <Block element={e} name={key} />
                    <span className="block w-full h-px bg-slate-200 dark:bg-neutral-600 m-0" />
                </React.Fragment>)
            }
        }
        return blocks;
    }, [dist])

    return <div className="flex flex-col gap-4">
        {Blocks()}
    </div>
};



interface GenBlockProps {
    element: any;
    propName: string;
};
const GenBlock: React.FC<GenBlockProps> = ({ element, propName }) => {
    return <div className="flex flex-row items-center">
        <p className="text-sm font-medium leading-[1.57] tracking-[0.007em] text-slate-500">
            {propName}
        </p>
        <p className="text-sm font-medium leading-[1.57] tracking-[0.007em] ml-auto text-slate-700">
            {element ? element : 'Non Specifico/a'}
        </p>
    </div>
};
interface ContributionProps {
    arr: any;
    fieldToIgnore: String[];
};
const Contribution: React.FC<ContributionProps> = ({ arr, fieldToIgnore }) => {
    const Blocks = React.useCallback(() => {
        let blocks = [];
        for (let i = 0; i < arr.length; i++) {
            const e = arr[i];
            const preBlock = [];
            for (const key in e) {
                const x = e[key];
                if (!fieldToIgnore.includes(key)) {
                    preBlock.push(<GenBlock element={x} propName={key} />)
                }
            }
            blocks.push(<div key={i} className="flex flex-col gap-2">
                <h3 className="text-[1.3rem] mb-2 font-semibold text-slate-800">{e.da}</h3>
                {preBlock}
                <span className="block w-full h-px bg-slate-200 m-0" aria-hidden="true" />
            </div>)
        }
        return blocks;
    }, [arr]);

    return <div className="flex flex-col gap-4">{Blocks()}</div>
};



const CheckEmptyData = (dist: any) => {
    const found = [];
    for (const key in dist) {
        const e = dist[key];

        if (e.Disponibili > 0 && (e.Prezzo > 0 || e.PrezzoListino > 0)) {
            found.push(key);
        }
    }
    return found.length > 0;
}
/**
 * Funzione che ha lo scopo di riodinare gli elementi in base al piu piccolo
 * @param dist object | lista dei fornitori sotto forma di oggetto
 */
const SortDataByLowest = (dist: any) => {
    const pickLowest_ = (val: any) => {
        return PickLowest(val[1].Prezzo, val[1].PrezzoListino);
    }
    const sortedDistributori = Object.entries(dist)
        .sort((a: any, b: any) => pickLowest_(a) - pickLowest_(b));
    const dist__ = {};
    for (let i = 0; i < sortedDistributori.length; i++) {
        const e = sortedDistributori[i];
        (dist__ as any)[e[0]] = e[1];
    }
    return dist__;
}

interface DetailsDistProps {
    detailsDistPanelVisibility: boolean;
    ChangeDetailsDistPanelVisibility: () => void;
    dist: object;
    noDataWEBP: any;
    settingsProductExpanded: { distributors: boolean };
};
export const DetailsDist: React.FC<DetailsDistProps> = ({
    detailsDistPanelVisibility,
    ChangeDetailsDistPanelVisibility,
    dist,
    noDataWEBP,
    settingsProductExpanded
}) => {
    if (!detailsDistPanelVisibility) return null;

    return (
        <>
            <FDBackdrop onClick={ChangeDetailsDistPanelVisibility} />

            <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
                <FDBox
                    radius="2xl"
                    shadow="2xl"
                    variant="solid"
                    color="light"
                    className="pointer-events-auto w-[75%] sm:w-[40%]"
                >
                    <div className="flex items-center gap-2 px-6 pt-6 pb-0">
                        <span className="text-slate-500">{icon_info()}</span>
                        <h4 className="text-2xl font-semibold mb-0">
                            Dettagli Fornitori
                        </h4>

                        <FDIconButton
                            onClick={ChangeDetailsDistPanelVisibility}
                            icon={icon_close()}
                            variant="text"
                            size="medium"

                            className="ml-auto text-slate-400 hover:text-slate-600"
                        />

                    </div>




                    <div className="flex flex-col px-6 py-4 max-h-[70vh] overflow-auto">
                        <span className="block h-px w-full bg-slate-200 dark:bg-neutral-600 mb-4" />
                        {settingsProductExpanded.distributors ? (
                            CheckEmptyData(SortDataByLowest(dist)) ? (
                                <DistInterface dist={SortDataByLowest(dist)} />
                            ) : (
                                <>
                                    <img
                                        src={noDataWEBP}
                                        className="avoid-drag self-center w-[300px] grayscale opacity-40"
                                        loading="lazy"
                                    />
                                    <p className="text-[0.94rem] text-slate-400 font-bold self-center">
                                        Nessun Fornitore Correlato trovato.
                                    </p>
                                </>
                            )
                        ) : (
                            <Contribution arr={dist} fieldToIgnore={['aggiornato', 'inizio', 'fine']} />
                        )}
                    </div>
                </FDBox>
            </div>
        </>
    );
};

