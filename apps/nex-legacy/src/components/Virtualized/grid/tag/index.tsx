import React from 'react';
import { IconButton, Stack } from '@mui/material';
import MDTypography from 'components/MDTypography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

type Severity = 'error' | 'success' | 'info' | 'warning';

type UserChoose = Record<string, string | number | boolean | null | undefined>;

type TagFilterProps = {
    userChoose: UserChoose;
    setUserChoose: React.Dispatch<React.SetStateAction<UserChoose>>;
    descr?: boolean;
    descrArr?: Record<string, string>;
    CallFunctionWhenClick: (nextState: UserChoose) => void;
    conditionForFuncCall?: boolean;
    openErrorSB: (type: Severity, message: string) => void;
    deleteMode?: boolean;
};

/**
 * Tag filter: estrae le info dai filtri e le mostra come TAG.
 */
export function TagFilter({
    userChoose,
    setUserChoose,
    descr,
    descrArr,
    CallFunctionWhenClick,
    conditionForFuncCall,
    openErrorSB,
    deleteMode,
}: TagFilterProps): JSX.Element {
    const handleClick = React.useCallback((key: string) => {
        setUserChoose((prev) => {
            const newState = { ...prev, [key]: null };
            CallFunctionWhenClick(newState);
            return newState;
        });
    }, [userChoose]); // fedeltà all'originale

    const style: React.CSSProperties = { color: '#000' };

    const elaborateTag = () => {
        const tags: React.ReactNode[] = [];
        for (const key in userChoose) {
            const e = userChoose[key];
            if (e != null && typeof e !== 'boolean' && e !== '') {
                tags.push(
                    <Stack
                        key={key}
                        direction="row"
                        alignItems="center"
                        gap={1}
                        sx={{ backgroundColor: '#ffc107', borderRadius: 2, padding: '0 10px', height: 'fit-content' }}
                    >
                        <Stack alignItems="center">
                            {descr && (
                                <MDTypography
                                    component="span"
                                    sx={{ ...style, fontSize: '0.55rem', fontWeight: 400 }}
                                >
                                    {descrArr?.[key]}
                                </MDTypography>
                            )}
                            <MDTypography
                                component="span"
                                sx={{ ...style, fontSize: '0.7rem', fontWeight: 700 }}
                            >
                                {userChoose[key] as React.ReactNode}
                            </MDTypography>
                        </Stack>
                        {(deleteMode === undefined || deleteMode) && (
                            <IconButton
                                sx={{ width: '10px', fontSize: '15px' }}
                                onClick={() => {
                                    if (conditionForFuncCall !== undefined) {
                                        if (conditionForFuncCall) {
                                            handleClick(key);
                                        } else {
                                            openErrorSB(
                                                'error',
                                                'Perfavore aspetta che i dati vengano caricati prima di modificare i filtri.'
                                            );
                                        }
                                    } else {
                                        handleClick(key);
                                    }
                                }}
                            >
                                <CloseRoundedIcon />
                            </IconButton>
                        )}
                    </Stack>
                );
            }
        }
        return tags;
    };

    return (
        <Stack direction="row" gap={1} sx={{ marginRight: 2 }} alignItems="center" justifyContent="center">
            {elaborateTag()}
        </Stack>
    );
}
