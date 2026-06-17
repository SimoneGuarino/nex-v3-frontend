import { FDBox, FDIconButton } from "@nex/fd-ui";
import { useState } from "react"
//icons
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";


export function InfoPanel() {
    const [expanded, setExpanded] = useState(true)
    return (
        <FDBox
            radius="lg"
            pad="sm"
            fullWidth
        >
            <div className="flex flex-col w-full gap-2">
                <div className="flex w-full justify-between items-center">
                    <span>Note importanti per l'inserimento ordini FB | OF:</span>
                    <FDIconButton
                        icon={expanded ? IoIosArrowUp({}) : IoIosArrowDown({})}
                        variant="secondary"
                        onClick={expanded ? () => setExpanded(false) : () => setExpanded(true)}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-red-500 !text-xs/4">Attenzione, gli LTI-TEST non sono più attivi da Aprile 2025, sono già stati resi noti i nuovi codici di lavorazione univoci, nel caso abbiate già inserito un LTI-TEST nell’FB lo dovete rimuovere e sostituire con un dei codici sottostanti (nel link ?).</span>
                    <span className="text-red-500 !text-xs/4">Il codice univoco inserito in FB verrà comunque controllato se adeguato alla lavorazione richiesta.</span>
                </div>
                {expanded && (
                    <div className="text-xs">
                        <b>lavorazioni commerciali:</b>
                        <ol className="list-decimal ml-4 list-inside space-y-1">
                            <li>Installazione OS PC / Notebook (comprende sballaggio e reimballaggio) PC ASS-PC-SW</li>
                            <li>Upgrade PC / Notebook (comprende sballaggio e reimballaggio) PC UPG-PC-HW</li>
                            <li>Upgrade PC / Notebook + installazione OS (comprende sballaggio e reimballaggio) PC UPG-PC-SW+HW</li>
                            <li>Assemblaggio PC Office + installazione OS (comprende imballaggio) PC ASS-PC-OFFICE</li>
                            <li>Assemblaggio PC Gaming + installazione OS (comprende imballaggio) PC ASS-PC-MID</li>
                            <li>Assemblaggio PC Gaming / Workstation + installazione OS (comprende imballaggio) PC ASS-PC-TOP</li>
                            <li>Upgrade WORKSTATION, Sballaggio, installazione componenti, reimballaggio Server UPG-WKS</li>
                            <li>Upgrade WORKSTATION, Sballaggio, installazione OS + Componenti, reimballaggio Server UPG-WKS-SER</li>
                            <li>Upgrade SERVER BASIC, Sballaggio, installazione OS + Componenti, reimballaggio Server UPG-SER-BAS</li>
                            <li> Upgrade SERVER HIGH, Sballaggio, installazione OS + Componenti, reimballaggio Server UPG-SER-HIGH</li>
                        </ol>
                    </div>
                )}
            </div>
        </FDBox>
    )
}

export default InfoPanel