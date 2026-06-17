import { Divider } from '@mui/material';
import { icon_chrono, icon_delete, icon_expandMore, icon_verified } from '../../../config/icons';
import React from 'react';
import MinLoader from '../../../minLoader';
import theme from 'assets/theme';
import { FDIconButton } from "@nex/fd-ui";
import { FDBox } from '@nex/fd-ui';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';


interface ChronoProps {
    chronoData: Array<ChronoBlockProps>;
    noChronoAvatar: any;
    DeleteRow: (item: object) => void;
    loadingChrono: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

interface ChronoBlockFuncProps {
    item: any;
    DeleteRow: (item: object) => void;
    key_prop?: number;
    ci: string;
}

interface ChronoBlockProps {
    ci: string;
    lunghezza: number;
    larghezza: number;
    altezza: number;
    peso: number;
    volume: number;
}

const prop = ["lunghezza", "larghezza", "altezza", "peso"];
const convert = [{ name: 'lunghezza', measure: 'cm' }, { name: 'larghezza', measure: 'cm' },
{ name: 'altezza', measure: 'cm' }, { name: 'peso', measure: 'kg' }, { name: 'volume', measure: 'mm3' }]

/**
 * Trova la misura della proprietà in base all'array convert.
 * @param name String | nome della proprietà
 * @returns misura della proprietà adeguata.
 */
const FindMeasureIndex = (name: string) => {
    const index = convert.findIndex(e => e.name == name);
    return convert[index].measure;
}

const ChronoBlock: React.FC<ChronoBlockFuncProps> = ({ DeleteRow, item, key_prop, ci }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";


    return (
        <div
            key={key_prop}
            id={`fido-status-card-${key_prop}`}
            className="p-2 flex flex-col min-w-[200px] gap-2 h-fit items-start max-w-[250px] rounded-xl border border-solid border-neutral-200 dark:border-neutral-800"
            style={{
                backgroundColor: darkMode ? theme.palette.grey[900] : theme.palette.grey[100],
                color: theme.palette.getContrastText(
                    darkMode ? theme.palette.grey[900] : theme.palette.grey[100]
                )
            }
            }
        >
            <div className='w-full flex justify-between items-center'>
                <div className='flex gap-2 items-center'>
                    {icon_verified()}
                    <span className='text-sm font-semibold'>{ci}</span>
                </div>
                <FDIconButton
                    icon={icon_delete({ color: theme.palette.error.dark, width: 20, height: 20 })}
                    onClick={() => DeleteRow(item)}
                />
            </div>
            <span className='text-xs'>
                {new Date(item.aggiornato).toLocaleString('it')}
            </span>
            <Divider sx={{ backgroundColor: '#ccc', width: '100%' }} className="!m-1" />
            {
                prop.map((data: string, index: number) => (
                    <div className=' w-full flex justify-between items-center' key={index}>
                        <span className='text-sm'>{data}:</span>
                        <span className='text-sm'>{(item as any)[data]} {FindMeasureIndex(data)}</span>
                    </div>
                ))
            }
            <Divider sx={{ backgroundColor: '#ccc', width: '100%' }} className="!m-1" />

            <div className=' w-full flex justify-between items-center'>
                <span className='text-sm'>volume:</span>
                <span className='text-sm'>{item.volume} {FindMeasureIndex("volume")}</span>
            </div>
        </div >
    )
}


interface ChronoListProps {
    data: Array<ChronoBlockProps>;
    DeleteRow: (item: object) => void;
    expanded: boolean;
    noChronoAvatar: any;
    loadingChrono: boolean;
}

const ChronoList: React.FC<ChronoListProps> = ({
    data,
    expanded,
    noChronoAvatar,
    DeleteRow,
    loadingChrono,
}) => {
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 4;
    return (
        <div data-tour="pesi-crono-2"
            className="flex flex-row gap-2 transition-[opacity,height] duration-300"
            style={{
                width: expanded ? '100%' : '0px',
                height: expanded ? '300px' : '0px',
                opacity: expanded ? 1 : 0,
                overflow: 'auto',
            }}
        >{lockInteractions && (
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
            {!loadingChrono ? (
                data.length > 0 ? (
                    data.map((dataItem: ChronoBlockProps, index: number) => (
                        <ChronoBlock
                            key={index}
                            key_prop={index}
                            item={dataItem}
                            ci={dataItem.ci}
                            DeleteRow={DeleteRow}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center w-full opacity-50 grayscale">
                        <img src={noChronoAvatar} style={{ height: 200 }} />
                        <p className="text-sm text-neutral-500 font-light text-center mt-2">
                            Attualmente non sono presenti elementi da far vedere all'interno della Cronologia
                        </p>
                    </div>
                )
            ) : (
                <MinLoader />
            )}
        </div>
    );
};


export const Chrono: React.FC<ChronoProps> = ({
    chronoData,
    noChronoAvatar,
    DeleteRow,
    loadingChrono,
    isOpen,
    onToggle,
}) => {
    //const [expand, setExpand] = React.useState<boolean>(false);

    const { isOpen: isTourOpen, index: tourIndex } = useTour();

    const handleChronoClick = React.useCallback(() => {
        // Step 3 del tour: il click serve solo per advanceOn, NON per togglare il pannello
        if (isTourOpen && tourIndex === 4) {
            return;
        }
        onToggle();
    }, [isTourOpen, tourIndex, onToggle]);

    return (
        <FDBox
            radius='xl'
        >
            <div className="p-2 md:p-3 flex flex-col gap-2">
                {/* Header */}
                <div className="w-full flex items-center gap-2">
                    {icon_chrono()}
                    <h3 className="text-base font-semibold">
                        Cronologia degli ultimi 10 elementi inseriti
                    </h3>

                    <div className="ml-auto">
                        <FDIconButton
                            dataTour="pesi-crono"
                            aria-label="espandi"
                            // onClick={() => setExpand(!expand)}
                            // icon={icon_expandMore({
                            //     // se vuoi ruotare la chevron quando è espanso:
                            //     className: expand ? 'transition-transform rotate-180' : 'transition-transform',
                            // })}
                            onClick={handleChronoClick}
                            icon={icon_expandMore({
                                className: isOpen
                                    ? 'transition-transform rotate-180'
                                    : 'transition-transform',
                            })}
                        />
                    </div>
                </div>

                <Divider sx={{ backgroundColor: '#ccc', width: '100%' }} className="!my-1 !mx-2" />
                <ChronoList
                    data={chronoData}
                    //expanded={expand}
                    expanded={isOpen}
                    noChronoAvatar={noChronoAvatar}
                    DeleteRow={DeleteRow}
                    loadingChrono={loadingChrono}
                />
            </div>
        </FDBox>
    );
};