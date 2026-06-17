import { FDBox, FDButton } from "@nex/fd-ui";

import { IoSearch } from "react-icons/io5";

import FiltersMenu from "./FiltersMenu";
import type { TrackingsFiltersState } from "../types";

type TopbarProps = {
    onSearch?: () => void;
    searching?: boolean;
    filters: TrackingsFiltersState;
};

/**
 * Barra azioni del layout trackings, ridotta a wiring di ricerca e filtro.
 */
export default function Topbar({
    onSearch,
    searching = false,
    filters,
}: TopbarProps) {
    return (
        <FDBox variant="gradient" border={true} radius="md" pad="sm" className="flex flex-wrap justify-end gap-2 items-center space-x-2">
            <FiltersMenu filters={filters} />

            <FDButton
                radius="md"
                size="small"
                color="primary"
                variant="solid"
                rightIcon={IoSearch({})}
                onClick={onSearch}
                disabled={searching}
            >
                Cerca
            </FDButton>
        </FDBox>
    );
}
