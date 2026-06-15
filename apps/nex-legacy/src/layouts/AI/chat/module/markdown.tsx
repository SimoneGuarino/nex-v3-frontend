// markdown.tsx
import React from "react";

type NodeType = "paragraph" | "ul" | "ol" | "li" | "blockquote" | "text" | "heading" | "table" | "codeblock" | "hr" | "empty";

interface Node {
  type: NodeType;
  content?: string;
  level?: number; // for headings
  children?: Node[];
  rows?: string[][]; // for tables
  lang?: string; // for code blocks
}

interface MarkdownProps {
  text: string;
}

// ---------- EXPORT COMPONENT ----------
export const Markdown: React.FC<MarkdownProps> = ({ text }) => {
  const ast = parseMarkdownGPT(text);
  return (
    <div className="prose dark:prose-invert max-w-full min-w-0 w-full overflow-x-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      {ast.map((node, i) => renderNode(node, i))}
    </div>
  );
};

// ---------- PARSER ----------
function parseMarkdownGPT(input: string): Node[] {
  const normalized = normalizeText(input);
  const lines = normalized.split("\n");
  const root: Node[] = [];
  let currentList: { type: "ul" | "ol"; node: Node } | null = null;

  const pushNode = (node: Node) => {
    // Se stiamo aggiungendo qualcosa che non è un list item, chiudi la lista corrente
    if (node.type !== "li" && currentList) {
      root.push(currentList.node);
      currentList = null;
    }
    if (node.type === "li" && currentList) {
      currentList.node.children = currentList.node.children || [];
      currentList.node.children.push(node);
    } else {
      root.push(node);
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Linea vuota - preserva come spazio
    if (!trimmed) {
      if (currentList) {
        root.push(currentList.node);
        currentList = null;
      }
      pushNode({ type: "empty" });
      i++;
      continue;
    }

    // Fenced code block ```
    if (trimmed.startsWith("```")) {
      if (currentList) {
        root.push(currentList.node);
        currentList = null;
      }
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      pushNode({ type: "codeblock", content: codeLines.join("\n"), lang });
      i++; // skip closing ```
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      pushNode({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentList) {
        root.push(currentList.node);
        currentList = null;
      }
      pushNode({ type: "heading", level: headingMatch[1].length, content: headingMatch[2] });
      i++;
      continue;
    }

    // Table (detect by | at start and end)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (currentList) {
        root.push(currentList.node);
        currentList = null;
      }
      const tableRows: string[][] = [];
      while (i < lines.length) {
        const tLine = lines[i].trim();
        if (!tLine.startsWith("|") || !tLine.endsWith("|")) break;
        // Skip separator row (|---|---|)
        if (/^\|[\s\-:|]+\|$/.test(tLine)) {
          i++;
          continue;
        }
        const cells = tLine
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        tableRows.push(cells);
        i++;
      }
      if (tableRows.length > 0) {
        pushNode({ type: "table", rows: tableRows });
      }
      continue;
    }

    // OL item (1. or 1))
    const olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        if (currentList) root.push(currentList.node);
        currentList = { type: "ol", node: { type: "ol", children: [] } };
      }
      currentList.node.children = currentList.node.children || [];
      currentList.node.children.push({ type: "li", children: [{ type: "text", content: olMatch[3] }] });
      i++;
      continue;
    }

    // UL item (-, *, •)
    const ulMatch = line.match(/^(\s*)(?:[-*•])\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== "ul") {
        if (currentList) root.push(currentList.node);
        currentList = { type: "ul", node: { type: "ul", children: [] } };
      }
      currentList.node.children = currentList.node.children || [];
      currentList.node.children.push({ type: "li", children: [{ type: "text", content: ulMatch[2] }] });
      i++;
      continue;
    }

    // Blockquote
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      if (currentList) {
        root.push(currentList.node);
        currentList = null;
      }
      pushNode({ type: "blockquote", children: [{ type: "text", content: quoteMatch[1] }] });
      i++;
      continue;
    }

    // Paragrafo normale - preserva indentazione
    if (currentList) {
      root.push(currentList.node);
      currentList = null;
    }
    pushNode({ type: "paragraph", content: line });
    i++;
  }

  // Chiudi lista finale se aperta
  if (currentList) {
    root.push(currentList.node);
  }

  return root;
}

// ---------- RENDER ----------
function renderNode(node: Node, key: number): JSX.Element {
  switch (node.type) {
    case "empty":
      return <div key={key} className="h-4" />;

    case "hr":
      return <hr key={key} className="my-4 border-gray-300 dark:border-neutral-600" />;

    case "heading": {
      const Tag = `h${node.level}` as keyof JSX.IntrinsicElements;
      const sizes: Record<number, string> = {
        1: "text-2xl font-bold",
        2: "text-xl font-bold",
        3: "text-lg font-semibold",
        4: "text-base font-semibold",
        5: "text-sm font-semibold",
        6: "text-xs font-semibold",
      };
      return (
        <Tag key={key} className={`${sizes[node.level || 1]} my-2`}>
          {renderInline(node.content || "")}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p key={key} className="my-1 whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {renderInline(node.content || "")}
        </p>
      );

    case "ul":
      return (
        <ul key={key} className="list-disc list-inside pl-4 space-y-1 my-2">
          {node.children?.map((c, i) => renderNode(c, i))}
        </ul>
      );

    case "ol":
      return (
        <ol key={key} className="list-decimal list-inside pl-4 space-y-1 my-2">
          {node.children?.map((c, i) => renderNode(c, i))}
        </ol>
      );

    case "li":
      return <li key={key}>{node.children?.map((c, i) => renderNode(c, i))}</li>;

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 dark:border-neutral-500 pl-4 italic opacity-80 my-2">
          {node.children?.map((c, i) => renderNode(c, i))}
        </blockquote>
      );

    case "codeblock":
      return (
        <pre key={key} className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 my-2 overflow-x-auto">
          <code className="text-sm font-mono">{node.content}</code>
        </pre>
      );

    case "table":
      if (!node.rows || node.rows.length === 0) return <React.Fragment key={key} />;
      const [header, ...body] = node.rows;
      return (
        <div key={key} className="overflow-x-auto my-2">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-neutral-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-neutral-700">
                {header.map((cell, ci) => (
                  <th key={ci} className="border border-gray-300 dark:border-neutral-600 px-3 py-2 text-left font-semibold">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="even:bg-gray-50 dark:even:bg-neutral-800/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-gray-300 dark:border-neutral-600 px-3 py-2">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "text":
      return <React.Fragment key={key}>{renderInline(node.content || "")}</React.Fragment>;

    default:
      return <React.Fragment key={key} />;
  }
}

// ---------- INLINE FORMATTING ----------
function renderInline(text: string): (string | JSX.Element)[] {
  let nodes: (string | JSX.Element)[] = [text];

  // Inline code `code`
  nodes = splitMap(nodes, /`([^`]+)`/g, (m, i) => (
    <code key={`code-${i}`} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-neutral-700 font-mono text-sm">
      {m[1]}
    </code>
  ));

  // Bold **text**
  nodes = splitMap(nodes, /\*\*(.+?)\*\*/g, (m, i) => (
    <strong key={`bold-${i}`} className="font-bold">
      {m[1]}
    </strong>
  ));

  // Strikethrough ~~text~~
  nodes = splitMap(nodes, /~~(.+?)~~/g, (m, i) => (
    <del key={`del-${i}`} className="line-through">
      {m[1]}
    </del>
  ));

  // Underline <u>text</u> (HTML tag)
  nodes = splitMap(nodes, /<u>(.+?)<\/u>/gi, (m, i) => (
    <u key={`u-${i}`} className="underline">
      {m[1]}
    </u>
  ));

  // Italic *text* (single asterisk, not preceded by another asterisk)
  nodes = splitMap(nodes, /(?<!\*)\*([^*]+)\*(?!\*)/g, (m, i) => (
    <em key={`em-${i}`} className="italic">
      {m[1]}
    </em>
  ));

  // Link [text](url). Internal MEPA evidence links are rendered as source pills
  // and dispatch a page-level event consumed by the MEPA workspace Evidence Viewer.
  nodes = splitMap(nodes, /\[([^\]]+)\]\(([^)]+)\)/g, (m, i) => {
    const href = m[2];
    if (href.startsWith("nex-mepa-evidence:")) {
      const chunkId = decodeURIComponent(href.replace("nex-mepa-evidence:", ""));
      return (
        <button
          key={`mepa-evidence-${i}`}
          type="button"
          title={`Apri fonte ${m[1]}`}
          onClick={(event) => {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent("nex:mepa:evidence:open", { detail: { chunkId } }));
          }}
          className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1.5 align-super text-[10px] font-semibold leading-none text-blue-700 shadow-sm transition hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25"
        >
          {m[1]}
        </button>
      );
    }
    return (
      <a key={`link-${i}`} href={href} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:opacity-80">
        {m[1]}
      </a>
    );
  });

  // Citation references like [1], [2], rendered as compact ChatGPT-like source pills.
  // This is intentionally after markdown links so [label](url) is not converted.
  nodes = splitMap(nodes, /\[(\d{1,2})\](?!\()/g, (m, i) => (
    <sup key={`citation-${m[1]}-${i}`} className="mx-0.5 inline-flex align-super">
      <span
        title={`Fonte ${m[1]}`}
        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1.5 text-[10px] font-semibold leading-none text-blue-700 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200"
      >
        {m[1]}
      </span>
    </sup>
  ));

  return nodes;
}

function splitMap(
  nodes: (string | JSX.Element)[],
  regex: RegExp,
  fn: (m: RegExpExecArray, i: number) => JSX.Element
): (string | JSX.Element)[] {
  const out: (string | JSX.Element)[] = [];
  let idx = 0;

  for (const node of nodes) {
    if (typeof node === "string") {
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      // Reset regex
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(node))) {
        if (match.index > lastIndex) {
          out.push(node.slice(lastIndex, match.index));
        }
        out.push(fn(match, idx++));
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < node.length) {
        out.push(node.slice(lastIndex));
      }
    } else {
      out.push(node);
    }
  }

  return out;
}

function normalizeText(t: string): string {
  // Converti escape sequences ma preserva newlines e tabs reali
  return t
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"');
}
