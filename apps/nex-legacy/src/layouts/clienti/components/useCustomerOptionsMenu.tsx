import React, { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BsBoxSeam, BsPiggyBank } from "react-icons/bs";
import {
    IoEllipsisVertical,
    IoInformation,
    IoPersonSharp,
    IoMapSharp
} from "react-icons/io5";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { FiTruck } from "react-icons/fi";
import { BiNote } from "react-icons/bi";

import ContextMenu from "components/UI/menu/ContextMenu";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { CustomersPanel } from "components/UI/panels/customersPanel";

import { BackordersDetailsPanel } from "./BackordersDetailsPanel";
import AddressesDialog from "./AddressesDialog";
import type { ViewId } from "../types/view";
import CustomerNotesPanel from "components/UI/panels/customerNotes";

type CustomerPayload = {
    codice: string;
    denominazione?: string;
};

type UseCustomerOptionsMenuArgs = {
    currentView: ViewId;
    userContext: any;
    companySelected?: any;
    agentCode?: string | null;
    onNavigateToCustomerView: (
        targetView: ViewId,
        customer: { codice: string; denominazione?: string }
    ) => void;
};

type RenderOptionsTriggerArgs = {
    codice: string;
    denominazione?: string | null;
    rowKey: string;
};

type CustomerMenuButton = {
    title: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    childrenMenu?: { component: React.ReactNode }[];
};

export function useCustomerOptionsMenu({
    currentView,
    userContext,
    companySelected,
    agentCode,
    onNavigateToCustomerView,
}: UseCustomerOptionsMenuArgs) {
    const navigate = useNavigate();

    const optionBtnRef = useRef<HTMLElement | null>(null);
    const [openOption, setOpenOption] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerPayload | null>(null);

    const [customerPanelCode, setCustomerPanelCode] = useState("");
    const [openCustomerPanel, setOpenCustomerPanel] = useState(false);
    const [openCustomerNotes, setOpenCustomerNotes] = useState(false);

    const [openBackordersDetails, setOpenBackordersDetails] = useState(false);
    const [detailsCustomer, setDetailsCustomer] = useState<{
        codice: string | null;
        denominazione: string | null;
    }>({ codice: null, denominazione: null });

    const [openAddresses, setOpenAddresses] = useState(false);
    const [addressesCustomer, setAddressesCustomer] = useState<{
        codice: string | null;
        denominazione: string | null;
    }>({ codice: null, denominazione: null });

    const closeOptionsMenu = useCallback(() => {
        setOpenOption(null);
        setSelectedCustomer(null);
    }, []);

    const openOptionsMenu = useCallback(
        (
            e: React.MouseEvent<HTMLButtonElement>,
            customer: CustomerPayload,
            menuKey: string
        ) => {
            e.stopPropagation();
            optionBtnRef.current = e.currentTarget;
            setSelectedCustomer(customer);
            setOpenOption(menuKey);
        },
        []
    );

    const openCustomerPanelFor = useCallback((customer: CustomerPayload) => {
        const codice = String(customer.codice ?? "").trim();
        if (!codice) return;
        setCustomerPanelCode(codice);
        setOpenCustomerPanel(true);
    }, []);

    const openCustomerNotesFor = useCallback((customer: CustomerPayload) => {
        const codice = String(customer.codice ?? "").trim();
        if (!codice) return;
        setCustomerPanelCode(codice);
        setOpenCustomerNotes(true);
    }, []);

    const openBackordersDetailsFor = useCallback((customer: CustomerPayload) => {
        const codice = String(customer.codice ?? "").trim();
        const denominazione = String(customer.denominazione ?? "").trim();
        if (!codice) return;

        setDetailsCustomer({
            codice,
            denominazione: denominazione || null,
        });
        setOpenBackordersDetails(true);
    }, []);

    const openAddressesFor = useCallback((customer: CustomerPayload) => {
        const codice = String(customer.codice ?? "").trim();
        const denominazione = String(customer.denominazione ?? "").trim();
        if (!codice) return;

        setAddressesCustomer({
            codice,
            denominazione: denominazione || null,
        });
        setOpenAddresses(true);
    }, []);

    const menuButtons = useMemo(() => {
        if (!selectedCustomer) return [];

        const codice = String(selectedCustomer.codice ?? "").trim();
        const denominazione = String(selectedCustomer.denominazione ?? "").trim();
        if (!codice) return [];

        const customerPayload = {
            codice,
            denominazione,
        };

        const buttons: CustomerMenuButton[] = [];

        const mainTabTargets: Array<{ id: ViewId; title: string; icon: React.ReactNode }> = [
            { id: "anagrafica", title: "Anagrafica", icon: IoPersonSharp({}) },
            { id: "fido", title: "Fido", icon: BsPiggyBank({}) },
            { id: "backorders", title: "Backorders", icon: BsBoxSeam({}) },
        ];

        const reportTargets: Array<{ id: ViewId; title: string }> = [
            { id: "reportCambioAgente", title: "Report Cambio Agente" },
            { id: "reportDiffEconomica", title: "Report Difficolta Economica" },
            { id: "reportAltriProblemi", title: "Report Altri Problemi" },
            // { id: "reportNoteClienti", title: "Report Note Clienti" },
        ];

        buttons.push({
            title: "Scheda Cliente",
            icon: IoInformation({}),
            onClick: () => openCustomerPanelFor(customerPayload),
        });

        buttons.push({
            title: "Note Cliente",
            icon: BiNote({}),
            onClick: () => openCustomerNotesFor(customerPayload),
        });

        buttons.push(
            {
                title: "Dettagli Backorders",
                icon: FiTruck({}),
                onClick: () => openBackordersDetailsFor(customerPayload),
            });

        buttons.push({
            title: "Trackings",
            icon: FiTruck({}),
            onClick: () => {
                navigate(`/logistica/trackings`, {
                    state: {
                        payload: {
                            ccli: [{ codice }],
                        },
                    }
                }
                )
            },
        })

        buttons.push({
            title: "Fatturato",
            icon: LuChartNoAxesCombined({}),
            onClick: () => {
                const searchParams = new URLSearchParams({
                    CLI: codice,
                    dimension: "CLIENT",
                    sysInfo: "FOCELDA",
                });

                navigate(`/contabilita/fatturati?${searchParams.toString()}`);
            },
        });

        buttons.push({
            title: "Preventivi",
            icon: HiOutlineDocumentText({}),
            onClick: () => {
                navigate("/contabilita/preventivi", {
                    state: {
                        customerCode: codice,
                    },
                });
            },
        });

        buttons.push({
            title: "Acquisti cliente",
            icon: HiOutlineDocumentText({}),
            onClick: () => {
                /**
                 * Apriamo la vista completa acquisti con filtro cliente preimpostato.
                 * Usiamo location.state per non sporcare la URL con parametri temporanei
                 * e mantenere coerenza con il pattern già usato per Preventivi.
                 */
                navigate("/contabilita/acquisti_clienti", {
                    state: {
                        customerCode: codice,
                        customerName: denominazione,
                    },
                });
            },
        });

        buttons.push({
            title: "Indirizzi Cliente",
            icon: IoMapSharp({}),
            onClick: () => openAddressesFor(customerPayload),
        });

        mainTabTargets.forEach((target) => {
            if (currentView === target.id) return;

            buttons.push({
                title: target.title,
                icon: target.icon,
                onClick: () => onNavigateToCustomerView(target.id, customerPayload),
            });
        });

        const availableReportTargets = reportTargets.filter(
            (target) => currentView !== target.id
        );

        if (availableReportTargets.length > 0) {
            buttons.push({
                title: "Report",
                icon: IoPersonSharp({}),
                childrenMenu: [
                    {
                        component: (
                            <div className="flex flex-col items-stretch min-w-[220px]">
                                {availableReportTargets.map((target) => (
                                    <button
                                        key={target.id}
                                        type="button"
                                        className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-[#2e2e2e] focus:bg-[#2e2e2e] focus:outline-none cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateToCustomerView(target.id, customerPayload);
                                            closeOptionsMenu();
                                        }}
                                    >
                                        {target.title}
                                    </button>
                                ))}
                            </div>
                        ),
                    },
                ],
            });
        }





        return buttons;
    }, [
        selectedCustomer,
        currentView,
        onNavigateToCustomerView,
        navigate,
        openCustomerPanelFor,
        openCustomerNotesFor,
        openBackordersDetailsFor,
        openAddressesFor,
        closeOptionsMenu,
    ]);

    const renderOptionsTrigger = useCallback(
        ({ codice, denominazione, rowKey }: RenderOptionsTriggerArgs) => {
            const customerCode = String(codice ?? "").trim();
            if (!customerCode) return null;

            const customerLabel = String(denominazione ?? "").trim();

            return (
                <div className="w-full h-full flex justify-center items-center">
                    <FDIconButton
                        icon={IoEllipsisVertical({})}
                        dataTooltipId="customers-tooltip"
                        dataTooltipContent="Opzioni cliente"
                        onClick={(e) =>
                            openOptionsMenu(
                                e,
                                { codice: customerCode, denominazione: customerLabel },
                                rowKey
                            )
                        }
                    />
                </div>
            );
        },
        [openOptionsMenu]
    );

    const optionsOverlays = (
        <>
            <ContextMenu
                openFor={openOption && selectedCustomer ? openOption : null}
                pos={optionBtnRef}
                onClose={closeOptionsMenu}
                placement="bottom"
                className="min-w-[220px]"
                menuButtons={menuButtons}
            />

            <CustomersPanel
                cliente={customerPanelCode}
                openFor={openCustomerPanel}
                onClose={() => setOpenCustomerPanel(false)}
            />

            <CustomerNotesPanel
                cliente={customerPanelCode}
                openFor={openCustomerNotes}
                onClose={() => setOpenCustomerNotes(false)}
            />

            <BackordersDetailsPanel
                open={openBackordersDetails}
                onClose={() => setOpenBackordersDetails(false)}
                userContext={userContext}
                companySelected={companySelected}
                agentCode={agentCode ?? null}
                customerCode={detailsCustomer.codice}
                customerLabel={detailsCustomer.denominazione}
            />

            <AddressesDialog
                open={openAddresses}
                onClose={() => setOpenAddresses(false)}
                userContext={userContext}
                customerCode={addressesCustomer.codice}
                customerLabel={addressesCustomer.denominazione}
            />
        </>
    );

    return {
        renderOptionsTrigger,
        optionsOverlays,
    };
}
