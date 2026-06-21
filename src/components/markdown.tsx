"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Renders markdown chat content with:
 * - code blocks (syntax highlighted, with copy button)
 * - inline code, bold, lists, links, headings
 * - safe (no raw HTML)
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-chat", className)}>
      <ReactMarkdown
        components={{
          code({ node, className: cls, children, ...props }: any) {
            const match = /language-(\w+)/.exec(cls || "");
            const isInline = !match && !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-secondary px-1.5 py-0.5 font-mono-display text-[0.85em] text-amber-glow"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const code = String(children).replace(/\n$/, "");
            return <CodeBlock code={code} lang={match?.[1] ?? "text"} />;
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ children, href }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="dotted-link text-primary"
              >
                {children}
              </a>
            );
          },
          ul({ children }: any) {
            return <ul className="my-1.5 ml-4 list-disc space-y-1">{children}</ul>;
          },
          ol({ children }: any) {
            return <ol className="my-1.5 ml-4 list-decimal space-y-1">{children}</ol>;
          },
          li({ children }: any) {
            return <li className="leading-relaxed">{children}</li>;
          },
          p({ children }: any) {
            return <p className="my-1 leading-relaxed first:mt-0 last:mb-0">{children}</p>;
          },
          h1({ children }: any) {
            return <h3 className="mb-1 mt-2 font-mono-display text-base font-bold first:mt-0">{children}</h3>;
          },
          h2({ children }: any) {
            return <h4 className="mb-1 mt-2 font-mono-display text-sm font-bold first:mt-0">{children}</h4>;
          },
          h3({ children }: any) {
            return <h5 className="mb-1 mt-2 font-mono-display text-sm font-bold first:mt-0">{children}</h5>;
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="my-1.5 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-2 border-border/60" />;
          },
          table({ children }: any) {
            return (
              <div className="my-2 overflow-x-auto">
                <table className="w-full border-collapse text-xs">{children}</table>
              </div>
            );
          },
          th({ children }: any) {
            return <th className="border border-border bg-secondary/40 px-2 py-1 text-left font-bold">{children}</th>;
          },
          td({ children }: any) {
            return <td className="border border-border/60 px-2 py-1">{children}</td>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    toast.success("code copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-border bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-3 py-1.5">
        <span className="font-mono-display text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono-display text-[10px] text-muted-foreground transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "0.75rem",
          fontSize: "0.8rem",
          fontFamily: "var(--font-mono), monospace",
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono), monospace" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
