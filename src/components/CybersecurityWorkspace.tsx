/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, Terminal, ShieldAlert, Play, CheckCircle } from 'lucide-react';

interface CybersecurityWorkspaceProps {
  onExecute: (promptText: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CybersecurityWorkspace: React.FC<CybersecurityWorkspaceProps> = ({ onExecute, onShowToast }) => {
  const [targetCode, setTargetCode] = useState("");
  const [cveInput, setCveInput] = useState("");

  const handleHardening = (platform: 'docker' | 'nginx' | 'express') => {
    let finalPrompt = "";
    switch (platform) {
      case 'docker':
        finalPrompt = `Please compile an actionable Infrastructure Hardening Guide and validation checklist for Docker containers running Node.js databases. Detail multi-stage builds, non-root user allocations, read-only rootfilesystems, and minimal Alpine parent selections. Include complete secure Dockerfile examples.`;
        break;
      case 'nginx':
        finalPrompt = `Please generate an Nginx Server Security Hardening configuration block. Explain and include headers defending against Clickjacking (X-Frame-Options), XSS (X-Content-Type-Options), custom buffers limit controls, and Strict-Transport-Security (HSTS).`;
        break;
      case 'express':
        finalPrompt = `Generate a defense script in Node.js setting up comprehensive CORS headers, rate-limiting rules, Express limit parameters, and secure Helmet protection middlewares.`;
        break;
    }
    onExecute(finalPrompt);
  };

  const handleCodeReview = () => {
    if (!targetCode.trim()) {
      onShowToast("Please enter some source code to review.", "error");
      return;
    }
    const finalPrompt = `Perform a defensive security code review on the following block. Locate any OWASP Top 10 security risks (such as input injection, broken auth, timing leaks, or verbose errors). Compile a findings table rated by Severity (High, Medium, Low) and provide an equivalent hardened, secure code block:\n\n\`\`\`\n${targetCode}\n\`\`\``;
    onExecute(finalPrompt);
  };

  const handleCveExplain = () => {
    if (!cveInput.trim()) {
      onShowToast("Please specify a CVE ID or query.", "error");
      return;
    }
    const finalPrompt = `Research public intelligence and explain the vulnerability mechanics, CVSS score vectors, and complete defensive remediation plans for the security advisory: ${cveInput}. Format the response cleanly.`;
    onExecute(finalPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
        <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
          DEFENSIVE cybersecurity WORKSPACE
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Learn, harden, and audit coding patterns safely. Build secure workflows, explain vulnerability disclosures, and secure container configurations.
        </p>

        {/* Safety guardrails */}
        <div className="mt-3.5 flex gap-2.5 p-3 bg-red-950/10 border border-red-900/40 rounded-lg text-[10.5px] leading-relaxed text-red-400 font-mono">
          <ShieldAlert className="w-4 w-4 flex-shrink-0" />
          <div>
            <span className="font-bold uppercase block mb-0.5">Defensive Guardrails Activated</span>
            This workspace strictly enforces safe, educational-only cybersecurity principles. Generative tools will not craft malware, evasions, exploit scripts, or unauthorized intrusion material.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COMPONENT: Code Auditing scan */}
        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            Static Security Code Audit
          </h4>
          <p className="text-zinc-400 text-xs leading-normal">
            Paste login routines, routing templates, database operations, or cookie handlers to inspect under OWASP policies.
          </p>

          <textarea
            value={targetCode}
            onChange={(e) => setTargetCode(e.target.value)}
            className="w-full h-44 p-3 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-350 rounded-lg focus:outline-none focus:border-red-900/50"
            placeholder="Paste code snippet here..."
          />

          <button
            onClick={handleCodeReview}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-zinc-100 rounded-lg font-mono text-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Run Security Audit Review
          </button>
        </div>

        {/* RIGHT COMPONENT: CVE & Infrastructure hardening */}
        <div className="space-y-6">
          {/* Infrastructure Hardening Config makers */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-red-500" />
              Secure Container & Server Hardening
            </h4>
            <p className="text-zinc-400 text-xs text-zinc-500">
              Generate fully annotated configuration scripts matching strict server checklists.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleHardening('docker')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 hover:border-red-500/30 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded text-center transition-all"
              >
                Secure Dockerfile
              </button>
              <button
                onClick={() => handleHardening('nginx')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 hover:border-red-500/30 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded text-center transition-all"
              >
                Nginx Headers
              </button>
              <button
                onClick={() => handleHardening('express')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 hover:border-red-500/30 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded text-center transition-all"
              >
                Helmet CORS
              </button>
            </div>
          </div>

          {/* Public Vulnerability explainer */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              CVSS Remediation Planner
            </h4>
            <p className="text-zinc-400 text-xs">
              Explain disclosures using public security records. Provide mechanical background and patch blueprints.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={cveInput}
                onChange={(e) => setCveInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-905 border border-zinc-900 bg-zinc-900 text-xs font-mono text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50"
                placeholder="e.g. CVE-2021-44228, Log4Shell"
              />
              <button
                onClick={handleCveExplain}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-red-500 border border-zinc-800 rounded-lg font-mono text-xs transition-colors"
              >
                Explore CVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
