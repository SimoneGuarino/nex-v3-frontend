import { FormControl, InputLabel, MenuItem, Select, Skeleton } from "@mui/material";
import MDTypography from "components/MDTypography";

interface GenSelectProps {
    label: string;
    value: string | number;
    onChange: (value: string | number) => void;
    items: Array<string | object>;
    width?: string;
    propToTakeFromData?: any;
    minHeight?: number;
};

export const Select_: React.FC<GenSelectProps> = ({ label, propToTakeFromData, value, onChange, items, width, minHeight = 45 }) => {
    return items.length > 0 ? <FormControl sx={{ minHeight: minHeight, height: '100%' }}>
        <InputLabel>{label}</InputLabel>
        <Select
            id="data-select-typology"
            sx={{ height: 40, width: `${width ? width : '10rem'}`, '&.MuiInputBase-root':{height: '100%'}, '&.MuiInputBase-root .MuiSelect-select':{height: '100%'}}}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoWidth
            label="Tipologia"
        >
            <MenuItem value={""}>
                <MDTypography variant='body2' sx={{display: 'flex', gap: 0.5}}>
                    Nessuno</MDTypography>
            </MenuItem>
            {items.map((data: string | any, index: number) => (
                <MenuItem value={index} key={index}>
                    <MDTypography variant='body2' sx={{display: 'flex', gap: 0.5}}>
                    {propToTakeFromData ? 
                        propToTakeFromData.map((prop: any, y: number) => (
                            <p key={y}>{data[prop]}</p>
                        ))
                    : data}</MDTypography>
                </MenuItem>
            ))}
        </Select>
    </FormControl> :
        <Skeleton sx={{ width: `${width ? width : '10rem'}`, padding: 0 }} />
}