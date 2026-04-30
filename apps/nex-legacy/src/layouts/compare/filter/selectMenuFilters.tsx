// src/layouts/compare/filter/selectMenuFilters.tsx
import React, { memo } from "react";

// MUI Components
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

type SelectMenuData = {
    label: string;
    dataArray?: string[];
    menuItemOnClick: (item: string, index: number) => void;
    noneOnClick: () => void;
};

type SelectMenuFiltersProps = {
    data: SelectMenuData;
};

function SelectMenuFilters({ data }: SelectMenuFiltersProps) {
    const labelId = "grouped-select-label";
    const selectId = "grouped-select";

    return (
        <FormControl id="grouped-select-brand" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id={labelId} htmlFor={selectId}>
                {data.label}
            </InputLabel>

            <Select<string>
                defaultValue=""
                id={selectId}
                labelId={labelId}
                label={data.label}
            >
                <MenuItem onClick={data.noneOnClick} value="">
                    <em>None</em>
                </MenuItem>

                {data.dataArray
                    ?.slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map((item, id) => (
                        <MenuItem
                            key={id}
                            value={item}
                            onClick={() => data.menuItemOnClick(item, id)}
                        >
                            {item}
                        </MenuItem>
                    ))}
            </Select>
        </FormControl>
    );
}

export default memo(SelectMenuFilters);
