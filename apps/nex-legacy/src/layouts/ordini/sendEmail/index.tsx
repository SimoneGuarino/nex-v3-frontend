import React, { Fragment } from 'react';

import { icon_close, icon_reportProblem, icon_delete } from 'config/icons';
import { FDIconButton, RichTextEditor } from "@nex/fd-ui";


interface codTarget {
    nome: string;
    id?: number;
}

interface SendEmailProps {
    codTarget: codTarget;
    SendEmailToAgent: (tp: 0 | 1) => void | Promise<void>
    commentBody: string;
    setCommentBody: React.Dispatch<React.SetStateAction<string>>;
    setSendEmail: React.Dispatch<React.SetStateAction<boolean>>;
    sendingEmailStatus: boolean;
}

export function SendEmail({ codTarget, SendEmailToAgent, commentBody, setCommentBody,
    setSendEmail, sendingEmailStatus }: SendEmailProps) {

    const headerMemo = React.useMemo(() => (
        <Fragment>
            <div className='flex flex-row items-center gap-2 p-4'>
                {icon_reportProblem({ width: 30, height: 30, color: '#edb448' })}
                <h2 className="text-2xl font-medium">
                    Invia una e-mail di sollecito
                </h2>
                <FDIconButton
                    onClick={() => setSendEmail(false)}
                    className="ml-auto border-b border-[#ccc]"
                    icon={icon_close({ color: '#d35a29' })}
                />
            </div>

            <div className='flex flex-row items-center gap-3 p-4'>
                <span className="text-base font-medium border border-[#ccc] px-5 rounded">A</span>
                <span className="text-base font-extralight w-full">
                    {codTarget.nome}
                </span>
            </div>
        </Fragment>
    ), [codTarget])


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="h-[70%] w-[35%] rounded-xl bg-white shadow flex flex-col">
                <div className='flex flex-col gap-2'>
                    {headerMemo}

                    <RichTextEditor
                        value={commentBody || ""}
                        onChange={(html) => setCommentBody(html)}
                        placeholder="Scrivi il messaggio…"
                        className="w-full h-full"
                        debounceMs={120}
                        actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                    />

                    <div className="flex flex-row items-center px-4 pb-4 mt-auto">
                        <FDIconButton
                            onClick={() => SendEmailToAgent(1)}
                            variant="primary"
                            size="small"
                            loading={sendingEmailStatus}
                            className="min-w-[100px] text-white"
                            icon={<span>Invia E-Mail</span>}
                        />
                        <FDIconButton
                            onClick={() => setCommentBody("")}
                            variant="text"
                            className="ml-auto"
                            icon={icon_delete({ color: "#7f7e7e" })}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}