/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // clip failed
    }
  };

  return (
    <div className="my-4 border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950 font-mono text-xs relative group/code leading-relaxed">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] tracking-wider uppercase">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 hover:text-zinc-100 opacity-60 group-hover/code:opacity-100 hover:bg-zinc-800 rounded transition-all"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto text-zinc-300">
        <pre className="m-0 select-text whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
