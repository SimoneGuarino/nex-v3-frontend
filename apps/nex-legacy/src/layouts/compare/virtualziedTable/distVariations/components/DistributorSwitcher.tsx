import React from 'react';
import { Autocomplete, TextField, Avatar, Popper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import MDTypography from 'components/MDTypography';
import { getDistributorAvatar } from 'config/dist_avatars';

interface DistributorSelectProps {
    distList: string[];
    active: string;
    onChange: (dist: string) => void;
}

export const DistributorSelect: React.FC<DistributorSelectProps> = ({
    distList, active, onChange,
}) => {
    return (
        <Autocomplete
            value={active}
            onChange={(_, v) => v && onChange(v)}
            options={distList}
            PopperComponent={(props) => (
                // animazione di fade-in/fade-out
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Popper {...props} />
                </motion.div>
            )}
            renderOption={(props, option) => {
                const avatarUrl = getDistributorAvatar(option)?.avatarUrl || '';
                return (
                    <li {...props} className="flex items-center !space-x-2 !py-2 hover:bg-gray-100 dark:hover:bg-neutral-800">
                        <Avatar src={avatarUrl} className="w-8 h-8" />
                        <MDTypography variant="body2">{option}</MDTypography>
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Seleziona distributore…"
                    className="w-64"
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <Avatar
                                src={getDistributorAvatar(active)?.avatarUrl || ''}
                                className="w-8 h-8 mr-2"
                            />
                        )
                    }}
                />
            )}
            sx={{
                '& .MuiAutocomplete-paper': {
                    maxHeight: 300,
                    overflowY: 'auto',
                },
            }}
            className='w-64'
        />
    );
};
