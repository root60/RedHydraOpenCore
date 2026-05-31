/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Sparkles, Copy, Send, Check } from 'lucide-react';
import { BUILTIN_PROMPTS } from '../utils/prompts';
import { PromptTemplate } from '../types';

interface PromptLibraryProps {
  onSelectPrompt: (text: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelectPrompt, onShowToast }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ["All", "Coding", "Debugging", "Cybersecurity learning", "Research", "Writing", "Business", "Productivity"];

  const filteredPrompts = BUILTIN_PROMPTS.filter((prompt) => {
    const matchesSearch = prompt.title.toLowerCase().includes(search.toLowerCase()) || 
                          prompt.description.toLowerCase().includes(search.toLowerCase()) ||
                          prompt.promptText.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (prompt: PromptTemplate) => {
    try {
      navigator.clipboard.writeText(prompt.promptText);
      setCopiedId(prompt.id);
      onShowToast("Prompt copied to clipboard!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {
      onShowToast("Failed to copy prompt", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50 font-mono transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 justify-start md:justify-end w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                selectedCategory === cat 
                  ? "bg-red-950/20 text-red-500 border border-red-900/50" 
                  : "bg-zinc-950 border border-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.length > 0 ? (
          filteredPrompts.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative group flex flex-col justify-between hover:border-red-900/40 hover:shadow-[0_0_15px_rgba(220,38,38,0.03)] transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-mono tracking-wider text-red-500 rounded">
                    {p.category}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-200 mb-1 pointer-events-none">{p.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 pointer-events-none">{p.description}</p>
                
                <div className="p-3 bg-zinc-900 border border-zinc-950 rounded-lg text-[11px] font-mono text-zinc-400/80 mb-4 select-all line-clamp-3">
                  {p.promptText}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-900/50">
                <button
                  onClick={() => handleCopy(p)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-xs border border-zinc-850"
                  title="Copy full prompt text"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onSelectPrompt(p.promptText)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/30 rounded font-mono text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Use Prompt</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center text-zinc-500 border border-dashed border-zinc-900 rounded-xl bg-zinc-950/50">
            <Sparkles className="w-8 h-8 opacity-25 mb-2 text-red-500" />
            <p className="text-sm font-mono">No matching prompt-templates located.</p>
          </div>
        )}
      </div>
    </div>
  );
};
