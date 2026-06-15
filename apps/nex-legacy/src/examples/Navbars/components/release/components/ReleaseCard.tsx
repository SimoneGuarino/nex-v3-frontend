// release/components/ReleaseCard.tsx
import React from "react";
import type { ReleaseNote } from "../fetchdata/getReleaseNotes"; // path ok per il tuo repo
import { m } from "framer-motion";
import { FDBox } from "@nex/fd-ui";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

const ArrowRightIcon = MdOutlineKeyboardArrowRight as React.FC<React.SVGProps<SVGSVGElement>>;

function fmtDate(d: Date) {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); }
    catch { return ""; }
}

const Tag: React.FC<{ fontSize?: "small" | "medium" | "large"; text: string }> = ({ fontSize = "small", text }) => (
    <span className={`px-3 py-0.5 border dark:border-gray-600 border-gray-400 rounded-xl text-gray-500
    ${fontSize === "small" ? "text-xs" : fontSize === "medium" ? "text-sm" : "text-base"}`}>
        {text}
    </span>
);

const ReleaseCard: React.FC<{
    note: ReleaseNote;
    onClick: () => void;
    palette: any;
}> = ({ note, onClick }) => {
    const effDate = (note.dataUltimaModifica ?? note.dataCreazione) as Date;
    const cover = (note as any).coverUrl as string | undefined; // opzionale

    return (
        <m.div
            whileHover={{ y: -2, scale: 1.002 }}
            transition={{ duration: .25, ease: "easeOut" }}
            className="rounded-2xl p-1"
            style={{ willChange: "transform" }}
        >
            <FDBox
                variant="ghost"
                color="dark"
                className="flex gap-12 items-start w-full p-4 sm:p-6"
            >
                {/* rail sinistra */}
                <div className="flex flex-col items-start gap-2 min-w-[92px] pt-1">
                    <span className="text-sm dark:text-indigo-300 bg-indigo-300 text-indigo-800 font-bold
                    dark:bg-indigo-800 px-4 py-0.5 rounded-lg">{`v${note.versione}`}</span>
                    <p className="mt-2 text-xs dark:text-white/70  text-gray-800">
                        {fmtDate(effDate)}
                    </p>
                </div>

                {/* contenuto */}
                <div className="min-w-0">
                    {/* target/tag row */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Tag fontSize="small" text={note.tags} />
                        {Array.isArray(note.targetUtenti) &&
                            note.targetUtenti.slice(0, 4).map((t, i) => <Tag key={i} fontSize="small" text={t} />)}
                        {Array.isArray(note.targetUtenti) && note.targetUtenti.length > 4 && (
                            <Tag fontSize="small" text={`+${note.targetUtenti.length - 4}`} />
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-medium leading-snug dark:text-inherit text-gray-800">
                            {note.titolo}
                        </h2>
                    </div>

                    {note.descrizione && (
                        <h3 className="mt-2 text-sm text-gray-500 leading-snug">
                            {note.descrizione}
                        </h3>
                    )}

                    {/* target/tag row */}
                    <div onClick={onClick} 
                    className="ml-auto mt-4 text-sm opacity-90 text-indigo-400 hover:text-indigo-300 
                    font-medium cursor-pointer select-none">
                        Read more <ArrowRightIcon className="inline-block ml-1 mb-0.5 size-5" />
                    </div>

                    {/* cover opzionale */}
                    {cover && (
                        <div className="mt-4">
                            <div
                                className="rounded-xl overflow-hidden shadow-2xl"
                                style={{
                                    background:
                                        "linear-gradient(135deg, rgba(168,85,247,.5), rgba(59,130,246,.5))",
                                }}
                            >
                                <img
                                    src={cover}
                                    alt=""
                                    className="w-full h-auto block"
                                    loading="lazy"
                                    style={{ display: "block", transform: "translateZ(0)" }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </FDBox>
        </m.div>
    );
};

export default React.memo(ReleaseCard);