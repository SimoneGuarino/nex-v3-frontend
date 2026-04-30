import { useState } from "react";
import ExportRoot, { ExportRootProps } from "./ExportFornitoriRoot";
import {
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";

type ExportFornitoriProps = {
    open?: boolean;
    onClose?: () => void;
    onSubmit?: (value1: string, value2: string) => void;
    options1: string[];
    options2: string[];
    darkMode: boolean;
    loading?: boolean;
    disabled?: boolean;
};

const ExportFornitori = ({
    open = false,
    onClose,
    onSubmit,
    options1,
    options2,
    darkMode,
    loading = false,
    disabled = false,
}: ExportFornitoriProps) => {
    const [select1, setSelect1] = useState<string>("");
    const [select2, setSelect2] = useState<string>("");
    const [openSelect1, setOpenSelect1] = useState<boolean>(false);
    const [openSelect2, setOpenSelect2] = useState<boolean>(false);

    const handleSubmit = () => {
        if (disabled || loading) return;
        if (onSubmit) onSubmit(select1, select2);
    };

    const getIcon = (isOpen: boolean): JSX.Element => (
        <ExpandLess
            sx={{
                transition: "transform 150ms ease-in",
                transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
                color: darkMode ? "#fff" : "#555",
                pointerEvents: "none",
                position: "absolute",
                right: 12,
                top: "50%",
                transformOrigin: "center",
                translate: "0 -50%",
            }}
        />
    );

    const ownerState: ExportRootProps["ownerState"] = {
        open,
        darkMode,
        loading,
    };

    return (
        <ExportRoot ownerState={ownerState} open={open} onClose={onClose}>
            {/* semplice wrapper: non tocca i label */}
            <div className="flex flex-col justify-between items-center mt-5 w-full">
                <FormControl fullWidth sx={{ mb: 3, position: "relative" }}>
                    <InputLabel id="select1-label" required>
                        Seleziona il fornitore
                    </InputLabel>
                    <Select
                        required
                        labelId="select1-label"
                        value={select1}
                        label="Seleziona il fornitore"
                        onChange={(e) => setSelect1(e.target.value)}
                        onOpen={() => setOpenSelect1(true)}
                        onClose={() => setOpenSelect1(false)}
                        className="p-3 text-left"
                        endAdornment={getIcon(openSelect1)}
                        disabled={disabled}
                        MenuProps={{
                            PaperProps: {
                                className:
                                    "max-h-[60vh] w-[min(92vw,520px)] sm:w-auto overflow-y-auto",
                            },
                        }}
                    >
                        {options1.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3, position: "relative" }}>
                    <InputLabel id="select2-label" required>
                        Seleziona il formato
                    </InputLabel>
                    <Select
                        required
                        labelId="select2-label"
                        value={select2}
                        label="Seleziona il formato"
                        onChange={(e) => setSelect2(e.target.value)}
                        onOpen={() => setOpenSelect2(true)}
                        onClose={() => setOpenSelect2(false)}
                        className="p-3 text-left"
                        endAdornment={getIcon(openSelect2)}
                        disabled={disabled}
                        MenuProps={{
                            PaperProps: {
                                className:
                                    "max-h-[60vh] w-[min(92vw,520px)] sm:w-auto overflow-y-auto",
                            },
                        }}
                    >
                        {options2.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <Button
                variant={darkMode ? "contained" : "outlined"}
                color={darkMode ? "secondary" : "primary"}
                fullWidth
                onClick={handleSubmit}
                //disabled={loading || !select1 || !select2}
                disabled={loading || disabled || !select1 || !select2}
                sx={{
                    pointerEvents: loading || !select1 || !select2 ? "none" : "auto",
                    opacity: 1,
                    userSelect: loading || !select1 || !select2 ? "none" : "auto",
                }}
            >
                {loading ? "Caricamento..." : "Conferma"}
            </Button>
        </ExportRoot>
    );
};

export default ExportFornitori;
