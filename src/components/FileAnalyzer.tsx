/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, ClipboardList, Lightbulb, Play, Layers, BadgeHelp, CheckSquare, RefreshCw } from 'lucide-react';

interface FileAnalyzerProps {
  onAnalyze: (promptText: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ onAnalyze, onShowToast }) => {
  const [textInput1, setTextInput1] = useState("");
  const [textInput2, setTextInput2] = useState("");
  const [isFileMode, setIsFileMode] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextInput1(content);
      onShowToast(`File &quot;${file.name}&quot; imported successfully (${content.length} characters)`, "success");
    };
    reader.onerror = () => {
      onShowToast("Failed to read selected file", "error");
    };
    reader.readAsText(file);
  };

  const handleAction = (type: 'summarize' | 'points' | 'explain' | 'notes' | 'checklist' | 'compare' | 'qa') => {
    if (!textInput1.trim()) {
      onShowToast("Please enter or upload some text to analyze first.", "error");
      return;
    }

    let finalPrompt = "";
    switch (type) {
      case 'summarize':
        finalPrompt = `Please summarize the following text block. Extract the overall theme and main narrative focus recursively:\n\n---\n${textInput1}\n---`;
        break;
      case 'points':
        finalPrompt = `Extract the top 5-10 key points, structural parameters, or takeaways from this text, styled as a clear bulleted index:\n\n---\n${textInput1}\n---`;
        break;
      case 'explain':
        finalPrompt = `Provide a comprehensive architectural explanation of the following source document or code. Break down its structure, intent, and design parameters:\n\n---\n${textInput1}\n---`;
        break;
      case 'notes':
        finalPrompt = `Generate a structured study outline and educational bullet notes based directly on the key elements of this text:\n\n---\n${textInput1}\n---`;
        break;
      case 'checklist':
        finalPrompt = `Deconstruct the following text/documentation and translate its directives into a comprehensive actionable checklist with status tags:\n\n---\n${textInput1}\n---`;
        break;
      case 'compare':
        if (!textInput2.trim()) {
          onShowToast("To perform a comparison, please insert Source B in the second text field.", "error");
          return;
        }
        finalPrompt = `Conduct a rigorous comparative analysis comparing Source Text A and Source Text B. Highlighting design trade-offs, structural deviations, pros versus cons, and direct inconsistencies:\n\n### SOURCE TEXT A:\n${textInput1}\n\n### SOURCE TEXT B:\n${textInput2}`;
        break;
      case 'qa':
        finalPrompt = `Analyze the following text and generate a structured FAQ (Questions & Answers) covering the most crucial elements, potential edge cases, or details:\n\n---\n${textInput1}\n---`;
        break;
    }

    onAnalyze(finalPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
        <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2 mb-2">
          <ClipboardList className="w-4 h-4 text-red-500" />
          FILE &amp; TEXT ANALYSIS WORKBENCH
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Paste unstructured articles, logs, transcripts, or code to run specialized extraction routines. 
          For comparative analysis, expand the secondary workbench below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT WORKSPACE: Input area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {isFileMode ? "Source Local File Feed" : "Source Document Input (A)"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFileMode(false)}
                className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                  !isFileMode ? "bg-red-950/20 text-red-500 border border-red-900/50" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Manual Paste
              </button>
              <button
                onClick={() => setIsFileMode(true)}
                className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                  isFileMode ? "bg-red-950/20 text-red-500 border border-red-900/50" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                File Upload
              </button>
            </div>
          </div>

          {isFileMode ? (
            <div className="border border-dashed border-zinc-800 bg-zinc-950/50 hover:border-red-900/30 rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300">
              <FileText className="w-10 h-10 text-red-500 opacity-30 mb-2 animate-pulse" />
              <p className="text-xs font-mono text-zinc-300 mb-2">Drag or select a local text file</p>
              <input
                type="file"
                accept=".txt,.js,.ts,.json,.md,.html,.xml,.css,.py,.rs,.go,.sh"
                onChange={handleFileUpload}
                className="hidden"
                id="analyzer-file-selector"
              />
              <label
                htmlFor="analyzer-file-selector"
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 rounded text-xs font-mono cursor-pointer transition-colors"
              >
                Browse Files
              </label>
              {textInput1 && (
                <div className="mt-4 text-[10px] font-mono text-emerald-500 bg-emerald-950/10 px-2 py-1 border border-emerald-900/30 rounded">
                  Active Buffer Loaded: {textInput1.length} characters
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={textInput1}
              onChange={(e) => setTextInput1(e.target.value)}
              className="w-full h-64 p-3 bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded-xl focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50 leading-relaxed"
              placeholder="Paste text source A here for standard queries (Logs, readmes, scripts)..."
            />
          )}

          {/* SECOND INPUT (ONLY SHOWS FOR COMPARATIVE ACTION) */}
          <div className="space-y-2 pt-2 border-t border-zinc-900/50">
            <label className="text-zinc-400 text-[10px] font-mono uppercase tracking-wider block">Comparison Source Input (B) - Optional</label>
            <textarea
              value={textInput2}
              onChange={(e) => setTextInput2(e.target.value)}
              className="w-full h-32 p-3 bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded-xl focus:outline-none focus:border-red-900/50 leading-relaxed"
              placeholder="Paste secondary source B to run comparative queries..."
            />
          </div>
        </div>

        {/* RIGHT WORKSPACE: Action buttons */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-red-500" />
            Select Extraction Routine
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleAction('summarize')}
              className="flex justify-between items-center text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/30 border border-zinc-850 rounded-lg group transition-all"
            >
              <div>
                <span className="text-xs font-mono text-zinc-200 font-bold block">Summarize Context</span>
                <span className="text-[9px] text-zinc-500 font-mono">Boil down themes and core goals</span>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>

            <button
              onClick={() => handleAction('points')}
              className="flex justify-between items-center text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/30 border border-zinc-850 rounded-lg group transition-all"
            >
              <div>
                <span className="text-xs font-mono text-zinc-200 font-bold block">Key Points Extractions</span>
                <span className="text-[9px] text-zinc-500 font-mono">Distill structured takeaways list</span>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>

            <button
              onClick={() => handleAction('explain')}
              className="flex justify-between items-center text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/30 border border-zinc-850 rounded-lg group transition-all"
            >
              <div>
                <span className="text-xs font-mono text-zinc-200 font-bold block">Explain Document</span>
                <span className="text-[9px] text-zinc-500 font-mono">Deeper architectural reasoning reviews</span>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>

            <button
              onClick={() => handleAction('notes')}
              className="flex justify-between items-center text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/30 border border-zinc-850 rounded-lg group transition-all"
            >
              <div>
                <span className="text-xs font-mono text-zinc-200 font-bold block">Generate Outline</span>
                <span className="text-[9px] text-zinc-500 font-mono">Produce comprehensive bullet notes</span>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>

            <button
              onClick={() => handleAction('checklist')}
              className="flex justify-between items-center text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/30 border border-zinc-850 rounded-lg group transition-all"
            >
              <div>
                <span className="text-xs font-mono text-zinc-200 font-bold block">Map Action Checklist</span>
                <span className="text-[9px] text-zinc-500 font-mono">Translate guidelines to status rules</span>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>

            <button
              onClick={() => handleAction('qa')}
              className="flex justify-between items-center text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/30 border border-zinc-850 rounded-lg group transition-all"
            >
              <div>
                <span className="text-xs font-mono text-zinc-200 font-bold block">Generate Q&amp;A FAQ</span>
                <span className="text-[9px] text-zinc-500 font-mono">Formulate structured study guides</span>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-90 w-full space-y-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Advanced Multi-source Routines</span>
            
            <button
              onClick={() => handleAction('compare')}
              className="w-full flex justify-between items-center text-left p-3.5 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 hover:border-red-500 rounded-lg group transition-all"
            >
              <div className="flex gap-2.5 items-center">
                <Layers className="w-4 h-4 text-red-500" />
                <div>
                  <span className="text-xs font-mono text-zinc-200 font-bold block">Rigorous Cross-Source Comparison</span>
                  <span className="text-[9px] text-zinc-400 font-mono">Contrast difference metrics between Buffer A &amp; B</span>
                </div>
              </div>
              <Play className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
