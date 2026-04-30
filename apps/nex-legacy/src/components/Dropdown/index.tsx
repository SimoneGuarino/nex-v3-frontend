import { useNexTheme } from '@nex/theme-system';
import MDTypography from 'components/MDTypography';
import { useState, useRef, useEffect } from 'react';

/** Render a dropdown menu component
 * 
 * @param {object} reactChild
 * @param {string} reactChild.ddClass Class name of the main div | default: dropdown
 * @param {string} reactChild.ddId Dropdown id
 * @param {string} reactChild.ddName Dropdown name
 * @param {string} reactChild.ddPlaceHolder Dropdown placeholder
 * @param {string} reactChild.ddMenuId Dropdown menu id
 * @param {Array<any>} reactChild.ddItems Dropdown items -> data
 * @param {any} reactChild.ddValue Dropdown callback to change values
 * @param {boolean} reactChild.ddReset Reset?
 * @param {any} reactChild.ddPassedValue If it exists it's assume its name
 * @param {boolean} reactChild.mandatory Mandatory?
 * @param {string | null} reactChild.background If it exists assume dropdown title background
 */
export function DropDown({
    ddClass = "dropdown",
    ddId,
    ddName,
    ddPlaceHolder,
    ddMenuId,
    ddItems,
    ddValue,
    ddReset,
    ddPassedValue,
    noValue = false,
    mandatory = false,
    background = null
}: {
    ddClass: string,
    ddId: string,
    ddName: string,
    ddPlaceHolder: string,
    ddMenuId: string,
    ddItems: Array<any>,
    ddValue: any,
    ddReset: boolean,
    ddPassedValue?: any,
    noValue?: boolean,
    mandatory?: boolean,
    background?: string | null
}) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    // React hooks
    const [open, setOpen] = useState(false);
    const [selectedName, setSelectedName] = useState(ddPlaceHolder);

    const dropdownRef = useRef(null);

    // HANDLES | Change values and name on the main box
    const handleOptionClick = (options: any) => {
        setSelectedName(options.name);
        setOpen(false);

        if (ddValue) {
            ddValue(options.value);
        }
    };

    const handleDropdownClick = () => {
        setOpen(!open);
    };

    // Handle outside click
    const handleClickOutside = (event: any) => {
        if (dropdownRef &&
            ('current' in dropdownRef) &&
            dropdownRef.current &&
            !(dropdownRef.current as any).contains(event.target)) {
            setOpen(false);
        }
    };

    // EFFECT | Handle click inside/outside dropdown
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Reset dropdown on reset prop change
    useEffect(() => {
        if (ddReset) {
            setSelectedName(ddPlaceHolder);
            setOpen(false);
        }
    }, [ddReset, ddPlaceHolder]);

    // Check mandatory
    let mandatoryText = mandatory && !noValue ? <span className={`${ddClass}-mandatory`}>* </span> : null;

    // RENDER | Render components
    return (
        <div ref={dropdownRef} className={`${ddClass}`} id={ddId} onClick={handleDropdownClick}>
            <MDTypography variant='body2' fontSize='0.8rem' sx={background ? { backgroundColor: background } : {}}>
                {ddName} {mandatoryText}</MDTypography>
            <MDTypography variant='body2' fontSize='0.8rem' className={`${ddClass}-text ${darkMode && 'bg-color-darkMode border-color-darkMode' }`}>
                {ddPassedValue ? ddPassedValue : selectedName}</MDTypography>
            {open ? (
                <ul className={`${ddClass}-menu ${darkMode && 'textColor-darkMode bg-color-darkMode border-color-darkMode'}`} style={open ? { animation: "fadInDown 0.4s forwards" } : {}} id={ddMenuId}>
                    {mandatory && noValue ? null : <li key={0} className={`${ddClass}-item ${darkMode && 'bg-color-darkMode'}`} 
                    onClick={() => handleOptionClick({ name: 'Nessun valore', value: '' })}>Nessun valore</li>}
                    {(ddItems || []).map((menuItem, index) => (
                        <li
                            key={index + 1}
                            className={`${ddClass}-item ${darkMode && 'bg-color-darkMode'}`}
                            onClick={() => handleOptionClick(menuItem)}
                            value={menuItem.value}
                        >
                            {menuItem.name}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
};