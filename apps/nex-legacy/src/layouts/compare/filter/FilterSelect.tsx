import { memo, useMemo } from "react";
import { FDSkeleton, FDSelect, type FDSelectOption } from "@nex/fd-ui";

export type CompareFilterOption = {
    value: string;
    label: string;
};

type CompareFilterSelectProps = {
    label: string;
    value: string | null;
    options: CompareFilterOption[];
    onChange: (value: string | null) => void;
    loading: boolean;
    disabled?: boolean;
    searchable?: boolean;
    fullWidth?: boolean;
    className?: string;
};

function FilterSelect({
    label,
    value,
    options,
    onChange,
    loading,
    className,
    fullWidth = false,
    disabled = false,
    searchable = true,
}: CompareFilterSelectProps) {
    const selectOptions = useMemo<FDSelectOption<string>[]>(
        () => options.map((option) => ({ value: option.value, label: option.label })),
        [options]
    );

    return (
        <div className={className}>
            <p className="text-xs">{label}</p>
            {loading ? (
                <FDSkeleton className="h-9 w-full rounded-md" />
            ) : (
                <FDSelect
                    options={selectOptions}
                    value={value ?? null}
                    onChange={(nextValue) => onChange(typeof nextValue === "string" ? nextValue : null)}
                    // label={label}
                    placeholder={"Seleziona.."}
                    size="sm"
                    radius="md"
                    color="dark"
                    variant="outline"
                    searchable={searchable}
                    clearable
                    disabled={disabled}
                    fullWidth={fullWidth}
                    menuMaxHeight={260}
                    className={className}
                />
            )}
        </div>
    );
}

export default memo(FilterSelect);
