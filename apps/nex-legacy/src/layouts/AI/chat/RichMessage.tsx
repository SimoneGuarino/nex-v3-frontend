import React from "react";
import { Message, MessageBlock } from "context/AIContext";
import { CgInfo } from "react-icons/cg";
import { TableRenderer } from "./module/TableRenderer";
import { Markdown } from "./module/markdown"; // <--- nuovo import

const InfoIcon = CgInfo as React.FC<{ size?: number, className?: string }>;

const areBlocksEqual = (a: MessageBlock[] | undefined, b: MessageBlock[] | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const A = a[i]; const B = b[i];
    if (A.kind !== B.kind) return false;
    if (A.kind === "text" && B.kind === "text") {
      if (A.text !== B.text) return false;
    } else if (A.kind === "code" && B.kind === "code") {
      if (A.code !== B.code) return false;
      if ((A as any).language !== (B as any).language) return false;
    } else if (A.kind === "table" && B.kind === "table") {
      const ta = (A as any).table; const tb = (B as any).table;
      if (JSON.stringify(ta) !== JSON.stringify(tb)) return false;
    } else return false;
  }
  return true;
};

const RichMessageInner: React.FC<{ message: Message; isError?: boolean; }> = ({ message, isError }) => {
  if (message.blocks && message.blocks.length > 0) {
    return (
      <div className="prose dark:prose-invert break-words space-y-6">
        {message.blocks.map((block: MessageBlock, i: number) => {
          switch (block.kind) {
            case "text":
              // Se il testo contiene tag HTML, renderizza come HTML; altrimenti interpreta come Markdown
              const isHtml = /<\/?[a-z][\s\S]*>/i.test(block.text || "");
              return isHtml ? (
                <div className="ai-text-block" key={i} dangerouslySetInnerHTML={{ __html: block.text }} />
              ) : (
                <div className="ai-text-block" key={i}>
                  <Markdown text={block.text || ""} />
                </div>
              );
            case "code":
              return (
                <pre key={i} className="bg-gray-100 dark:bg-neutral-800 p-2 rounded">
                  <code>{block.code}</code>
                </pre>
              );
            case "table":
              return <TableRenderer key={i} table={block.table} />
            default:
              return null;
          }
        })}
      </div>
    );
  }

  // fallback: intero contenuto trattato come markdown
  return (
    <div>
      {isError && <InfoIcon size={20} className="text-red-400 inline-block mr-1" />}
      <Markdown text={message.content || ""} />
    </div>
  );
};

const RichMessage = React.memo(RichMessageInner, (prev, next) => {
  if (prev.isError !== next.isError) return false;
  if (prev.message.content !== next.message.content) return false;
  return areBlocksEqual(prev.message.blocks, next.message.blocks);
});

export default RichMessage;
