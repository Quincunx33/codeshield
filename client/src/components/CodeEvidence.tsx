import { useState } from "react";
import { Check, Clipboard, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Finding, SupportedLanguage } from "../../../shared/scanner";

type Props = {
  file: string;
  line: number;
  language: SupportedLanguage;
  snippet?: string;
  context?: { startLine: number; lines: string[] };
  label?: string;
  related?: Finding["related"];
};

type Token = { text: string; className?: string };

const keywordPattern = /\b(?:and|as|async|await|break|case|catch|class|const|continue|def|do|else|enum|extends|final|finally|for|from|fun|function|if|implements|import|in|interface|let|new|null|of|package|private|protected|public|return|static|switch|throw|try|val|var|void|when|while|with|yield|true|false|None|True|False)\b/g;
const tokenPattern = /(\/\/.*|#.*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b)/g;

function highlight(line: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of Array.from(line.matchAll(tokenPattern))) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push(...highlightKeywords(line.slice(cursor, index)));
    const value = match[0];
    const className = /^(\/\/|#|\/\*)/.test(value) ? "text-slate-500 italic" : /^\d/.test(value) ? "text-amber-200" : "text-emerald-200";
    tokens.push({ text: value, className });
    cursor = index + value.length;
  }
  if (cursor < line.length) tokens.push(...highlightKeywords(line.slice(cursor)));
  return tokens.length ? tokens : [{ text: line }];
}

function highlightKeywords(value: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of Array.from(value.matchAll(keywordPattern))) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ text: value.slice(cursor, index) });
    tokens.push({ text: match[0], className: "text-violet-200" });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) tokens.push({ text: value.slice(cursor) });
  return tokens;
}

function CodeLine({ number, value, focused }: { number: number; value: string; focused: boolean }) {
  return <div className={`flex min-w-max ${focused ? "bg-cyan-300/10" : ""}`}><span className={`w-12 shrink-0 select-none border-r border-white/5 px-3 py-1 text-right ${focused ? "font-semibold text-cyan-200" : "text-slate-600"}`}>{number}</span><code className={`px-3 py-1 ${focused ? "text-cyan-50" : "text-slate-300"}`}>{highlight(value).map((token, index) => <span key={`${index}-${token.text}`} className={token.className}>{token.text}</span>)}</code></div>;
}

function SourcePanel({ file, line, snippet, context, language, label }: Omit<Props, "related">) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  const lines = expanded && context?.lines.length ? context.lines : [snippet ?? "Source line unavailable in this report"];
  const startLine = expanded && context?.lines.length ? context.startLine : line;
  return <div className="overflow-hidden rounded-lg border border-cyan-300/10 bg-[#050b14] font-mono text-xs"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2 font-sans"><span className="text-[11px] font-semibold text-cyan-200">{label ?? "Code"} · {file}:{line} <span className="font-normal text-slate-500">({language})</span></span><div className="flex gap-1"><Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-cyan-100" onClick={copy} aria-label={`Copy source line ${line}`}>{copied ? <Check size={12} /> : <Clipboard size={12} />}{copied ? "Copied" : "Copy line"}</Button>{context?.lines.length ? <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-cyan-100" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}><ChevronsUpDown size={12} />{expanded ? "Hide context" : "Show context"}</Button> : null}</div></div><div className="overflow-x-auto py-1">{lines.map((value, index) => <CodeLine key={`${startLine + index}-${value}`} number={startLine + index} value={value} focused={startLine + index === line} />)}</div></div>;
}

export function CodeEvidence({ file, line, language, snippet, context, label, related }: Props) {
  return <div className="mt-3 space-y-2"><SourcePanel file={file} line={line} language={language} snippet={snippet} context={context} label={label ?? "Reported source"} />{related ? <SourcePanel file={related.file} line={related.line} language={language} snippet={related.snippet} context={related.context} label="Matching source" /> : null}</div>;
}
