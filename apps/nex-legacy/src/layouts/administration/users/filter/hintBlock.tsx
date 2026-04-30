import { Button, Stack, Typography } from '@mui/material';
import React from 'react';
//  base styles
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import { useNexTheme } from '@nex/theme-system';


type StatusType = "Online" | "Offline";

interface BlockProps {
    keyx: number;
    indexInArray: number;
    nome: string;
    cognome: string;
    username: string;
    stato: {codice: StatusType};
    role: Array<string>;
    BoxClick: (index: number) => void;
}

export const HintBlock: React.FC<BlockProps> = ({keyx, indexInArray, nome, 
cognome, username, stato, role, BoxClick}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    const style: Object = {
        padding: 0.67, borderRadius: 2, color: '#fff !important', fontWeight: '600 !important', fontSize: '0.8rem',
    };

    if(stato?.codice == undefined){
        console.log(nome, stato);
    }

    return <Button key={keyx} onClick={() => BoxClick(indexInArray)} style={{minHeight: '4.5rem'}}>
        <Stack direction='row' width='100%' alignItems='flex-start'  p={1}>
            <Stack>
                <MDTypography variant='body1' sx={{fontWeight: 800, fontSize: '1.2em'}}>{nome + " " + cognome}</MDTypography>
                <MDTypography variant='body2' sx={{fontSize: '1em', color: palette.grey[500]}}>{username}</MDTypography>
            </Stack>
        
            <Stack alignSelf='center' ml='auto' gap={1} direction='row'>
                <MDTypography sx={{...style, backgroundColor: 
                `${stato.codice == 'Online' ? '#55ae59' : '#8f9091'}`}}>{stato.codice}</MDTypography>
                {(role && role.length > 0) && <Tag text={role[0]} color={darkMode ? palette.grey[800] : palette.grey[300]}/>}
            </Stack>
        </Stack>
    </Button>
}