/**
 * Il componente Important è stato creato per includere negli step del tour informazioni importanti.
 * La proprietà `important` si utilizza da sola oppure in `perRoleText`
 * Se usata in `perRoleText`, il messaggio verrà visualizzato solo per gli utenti con il ruolo specificato.
 */

import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;

type ImportantProps = {
    children: React.ReactNode;
    label?: string;
};

export function Important({ children, label = "Importante" }: ImportantProps) {
    return (
        <div className="mt-3 rounded-lg border border-orange-300/25 bg-orange-800/10 px-2.5 py-3 text-xs text-orange-300/90">
            <div className="inline-flex items-center gap-1.5">
                <FiAlertTriangleIcon className="h-3.5 w-3.5 text-orange-200/95" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-200/95">
                    {label}
                </span>
            </div>
            <div className="mt-1 leading-relaxed">{children}</div>
        </div>
    );
}
