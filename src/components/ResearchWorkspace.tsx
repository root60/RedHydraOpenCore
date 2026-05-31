/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Newspaper, Info, HelpCircle, Table, CheckSquare, Search } from 'lucide-react';

interface ResearchWorkspaceProps {
  onExecute: (promptText: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({ onExecute, onShowToast }) => {
  const [sources, setSources] = useState("");
  const [hypothesis, setHypothesis] = useState("");

  const handleRoutine = (type: 'report' | 'facts' | 'compare_internal' | 'outline') => {
    if (!sources.trim()) {
      onShowToast("Please paste some research source material or URLs first.", "error");
      return;
    }

    let finalPrompt = "";
    switch (type) {
      case 'report':
        finalPrompt = `Synthesize the pasted information and generate a formal, deeply analytical Research Report. Include categorized summary clusters, primary evidence pointers, and explicit citations to elements in the source document:\n\n### SOURCES:\n${sources}`;
        break;
      case 'facts':
        finalPrompt = `Analyze the pasted sources and compile a Factuality Assessment. Create a table that explicitly separates established, verifiable FACTS from hypothetical assumptions, biases, or speculative assertions in the text:\n\n### SOURCES:\n${sources}`;
        break;
      case 'compare_internal':
        finalPrompt = `Conduct a structured comparative analysis of the different viewpoints inside this document. Detect potential conflict claims, inconsistencies, or alignment points:\n\n### SOURCES:\n${sources}`;
        break;
      case 'outline':
        finalPrompt = `Synthesize a structured knowledge brief and summary out of the following research inputs. Group by conceptual headers and separate facts from hypotheses:\n\n### SOURCES:\n${sources}`;
        break;
    }
    onExecute(finalPrompt);
  };

  const handleGroundingSearch = () => {
    if (!hypothesis.trim()) {
      onShowToast("Please enter a research query or claim to ground.", "error");
      return;
    }
    const finalPrompt = `Conduct an exhaustive research inquiry on the topic: "${hypothesis}". Verify the claim using structural reasoning, cite relevant public facts, and identify current information boundaries or limitations.`;
    onExecute(finalPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Column banner */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
        <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2 mb-2">
          <Newspaper className="w-4 h-4 text-red-500" />
          RESEARCH ANALYTICS WORKSPACE
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Paste academic papers, notes, news clips, or raw articles to compile executive digests. 
          To unlock real-time web verification, toggle Google Search Grounding inside your Model settings.
        </p>

        {/* Search Grounding warning notice */}
        <div className="mt-3.5 flex gap-2.5 p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-lg text-[10.5px] leading-relaxed text-zinc-400">
          <Info className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="font-mono">
            <span className="font-bold text-zinc-300 uppercase tracking-wider block mb-0.5">Real-time Grounding Note</span>
            Web search capabilities require an active API key or compatible provider configured. If offline, the search grounding function will synthesize structured comparative blueprints based entirely on your provided manual documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT WORKSPACE: Source paste and processing */}
        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
            Research Source Material &amp; Article Paste
          </h4>
          <p className="text-zinc-400 text-xs leading-normal">
            Paste research articles, URL materials, paragraphs, or reference notes in the buffer below.
          </p>

          <textarea
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            className="w-full h-56 p-3 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg focus:outline-none focus:border-red-900/50 resize-y leading-relaxed"
            placeholder="Paste text source material here..."
          />

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleRoutine('report')}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 border border-zinc-800 rounded text-xs font-mono transition-colors text-center"
            >
              Executive Report
            </button>
            <button
              onClick={() => handleRoutine('facts')}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 border border-zinc-800 rounded text-xs font-mono transition-colors text-center"
            >
              Facts vs Assumptions
            </button>
            <button
              onClick={() => handleRoutine('compare_internal')}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 border border-zinc-800 rounded text-xs font-mono transition-colors text-center"
            >
              Compare Viewpoints
            </button>
            <button
              onClick={() => handleRoutine('outline')}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 border border-zinc-800 rounded text-xs font-mono transition-colors text-center"
            >
              Structured Outline
            </button>
          </div>
        </div>

        {/* RIGHT WORKSPACE: Claim Grounding / Hypothetical review */}
        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            Vibe Grounding &amp; Fact Query
          </h4>
          <p className="text-zinc-400 text-xs leading-normal">
            Input a claim, theory, or hypothesis. The system will outline logic boundaries, crosscheck reference points, and list informational limits.
          </p>

          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            className="w-full h-40 p-3 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg focus:outline-none focus:border-red-900/50 leading-relaxed"
            placeholder="e.g. 'How does carbon-neutral concrete scale in industrial manufacturing, and what is its material limitation?'"
          />

          <button
            onClick={handleGroundingSearch}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-zinc-100 rounded-lg font-mono text-xs transition-colors"
          >
            <Search className="w-4 h-4" />
            Analyze &amp; Ground Claim
          </button>
        </div>
      </div>
    </div>
  );
};
