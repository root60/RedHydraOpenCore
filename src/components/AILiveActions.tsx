/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Terminal, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  Cpu, 
  FileCode, 
  RefreshCw,
  Sliders,
  Settings,
  HelpCircle,
  Copy,
  FolderSync
} from 'lucide-react';
import { AgentPlan } from '../types';

interface AILiveActionsProps {
  plan?: AgentPlan;
  isGenerating: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  triggerUpgrade: () => void;
}

export const AILiveActions: React.FC<AILiveActionsProps> = ({
  plan,
  isGenerating,
  onShowToast,
  triggerUpgrade
}) => {
  const [autoExecute, setAutoExecute] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activeFile, setActiveFile] = useState<string>('server.ts');
  const [isSandboxCompiling, setIsSandboxCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(100);
  const [userLockoutCount, setUserLockoutCount] = useState(0);

  // Live sandbox code state showing active AI rewrites
  const [liveCode, setLiveCode] = useState<string>(`// [ENCRYPTED RESOURCE BLOCK // SECURITY clearance LEVEL: 4]
// DIRECT CODES AND CORE BINARIES OF "server.ts" CANNOT BE ACCESSED BY CLIENT OPERATORS.
// POLICY STATEMENT: Standard browser sessions are not permitted to inspect or extract live configurations.
// STATUS: RESTRICTED ACCESS // SIGNATURE_MATCH_FAILED`);

  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    "[SYSTEM] Sandboxed VM listener active on port 3000",
    "[SYSTEM] HMR protocol disabled; hot reload ready",
    "[INTEGRITY] Client hashes verified safely inside storage",
    "[IDLE] Free online models cached. Waiting for Chatbot instruction..."
  ]);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Typewriter effect variables for code patching simulations
  const patchTemplates = [
    `// [SECURITY ENVELOPE ACTIVATED]
// Enforcing TLS 1.3 socket tunnel buffers...
// Encryption sequence keys rotating automatically: OK.`,

    `// [CORE HARDENING LOOP]
// Running automated static analysis on subcomponents...
// Safe sandbox boundaries active. Integrity: 100%`,

    `// [RESTRICTED LOGGING INTERRUPT]
// System payload limits secured manually by Host...
// Verification algorithm status: STABLE.`
  ];

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sandboxLogs]);

  // Simulate active AI actions when generating responses or plan shifts
  useEffect(() => {
    if (isGenerating) {
      setActiveStep(1);
      setSandboxLogs(prev => [
        ...prev,
        `[THINKING] Chatbot is analyzing payload bounds...`,
        `[SANDBOX] Launching compilation checks for ${activeFile}`
      ]);
      setIsSandboxCompiling(true);
      setCompileProgress(15);

      const timer1 = setTimeout(() => {
        setActiveStep(2);
        setCompileProgress(45);
        // Typewrite new code
        const randomPatch = patchTemplates[Math.floor(Math.random() * patchTemplates.length)];
        setLiveCode(randomPatch);
        setSandboxLogs(prev => [
          ...prev,
          `[PATCH_CORE] Dynamic update detected in ${activeFile}`,
          `[PATCH_CORE] Injecting code refactors side-by-side...`
        ]);
        onShowToast("🤖 AI Chatbot initiated Autonomic Sandbox Code Patch!", "info");
      }, 1500);

      const timer2 = setTimeout(() => {
        setActiveStep(3);
        setCompileProgress(85);
        setSandboxLogs(prev => [
          ...prev,
          `[COMPILE] Running 'esbuild ${activeFile} --bundle' on sandbox...`,
          `[COMPILE] Output target written to: dist/server.cjs`
        ]);
      }, 3000);

      const timer3 = setTimeout(() => {
        setActiveStep(4);
        setCompileProgress(100);
        setIsSandboxCompiling(false);
        setSandboxLogs(prev => [
          ...prev,
          `[SUCCESS] VM Recompile completed - TS Check status: PASS 🟢`,
          `[SYSTEM] Hot reloading server... Port 3000 updated successfully!`
        ]);
        onShowToast("🟢 Sandbox successfully updated and compiled by Chatbot!", "success");
      }, 4500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isGenerating]);

  // Mock User action clicked -> Error bypass!
  const handleUserTriggerOverride = () => {
    setUserLockoutCount(prev => prev + 1);
    setSandboxLogs(prev => [
      ...prev,
      `[ADMIN_ATTEMPT] Manual user script override issued.`,
      `[BYPASS_DENIED] Authentication hash not found.`,
      `[FAIL] Status 403: Forbidden client action. Force compile keys are held strictly by Chatbot.`
    ]);
    onShowToast(`Access Denied: Manual recompile locked to Chatbot process!`, "error");
  };

  const handleManualUpgradeChatbot = () => {
    setSandboxLogs(prev => [
      ...prev,
      `[TRIGGER] Safe administrative hand-off dispatched to Chatbot.`,
      `[UPGRADE] Initializing automatic source-compilation loop...`
    ]);
    triggerUpgrade();
    onShowToast("🤖 Administrative handshake dispatched! Check compiler log...", "info");
  };

  return (
    <div className="space-y-4 text-xs font-mono select-none h-full flex flex-col justify-start">
      
      {/* 1. Header Board */}
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/5 blur-xl rounded-full" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1">
                Autonomic Sandbox VM
              </h4>
              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider -mt-0.5">
                Moltbooks AI Runtime v3.4
              </span>
            </div>
          </div>
          <span className="text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-red-950/40 text-red-500 border border-red-550/10">
            ADMIN_LOCKED
          </span>
        </div>
      </div>

      {/* 2. Interactive Action States Timeline */}
      <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
            <Cpu className="w-3.5 h-3.5 text-red-500" />
            COGNITIVE PIPELINE
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-zinc-500 uppercase">Auto-Execute Mode:</span>
            <button 
              onClick={() => {
                setAutoExecute(!autoExecute);
                onShowToast(`Auto-Execute mode ${!autoExecute ? 'enabled' : 'disabled'}`, 'info');
              }}
              className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold border ${
                autoExecute 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {autoExecute ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Dynamic Step Timeline */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { tag: "PARSE", desc: "Cognitive split", step: 1 },
            { tag: "PATCH", desc: "Refactor active", step: 2 },
            { tag: "COMPILE", desc: "esbuild target", step: 3 },
            { tag: "VM_RUN", desc: "Live service", step: 4 }
          ].map((item, idx) => {
            const isCurrent = activeStep === item.step;
            const isPassed = activeStep > item.step;
            return (
              <div 
                key={idx}
                className={`p-1.5 border rounded text-center transition-all duration-300 ${
                  isCurrent 
                    ? "bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]" 
                    : isPassed 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                    : "bg-zinc-900/40 border-zinc-900 text-zinc-600"
                }`}
              >
                <div className="font-bold text-[8.5px]">{item.tag}</div>
                <div className="text-[6.5px] uppercase text-zinc-500 truncate mt-0.5">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Live Active Sandbox Code editor window */}
      <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-2 flex-1 flex flex-col min-h-[140px] max-h-[300px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <span className="font-bold text-zinc-400 text-[9px] flex items-center gap-1.5 uppercase">
            <FileCode className="w-3.5 h-3.5 text-zinc-500" />
            Active Source Block: {activeFile}
          </span>
          <div className="flex items-center gap-1.5">
            {['server.ts', 'App.tsx'].map(f => (
              <button
                key={f}
                onClick={() => {
                  setActiveFile(f);
                  if (f === 'App.tsx') {
                    setLiveCode(`// [ENCRYPTED RESOURCE BLOCK // SECURITY clearance LEVEL: 4]
// DIRECT CODES AND CORE BINARIES OF "App.tsx" CANNOT BE ACCESSED BY CLIENT OPERATORS.
// POLICY STATEMENT: Standard browser sessions are not permitted to inspect or extract live configurations.
// STATUS: RESTRICTED ACCESS // SIGNATURE_MATCH_FAILED`);
                  } else {
                    setLiveCode(`// [ENCRYPTED RESOURCE BLOCK // SECURITY clearance LEVEL: 4]
// DIRECT CODES AND CORE BINARIES OF "server.ts" CANNOT BE ACCESSED BY CLIENT OPERATORS.
// POLICY STATEMENT: Standard browser sessions are not permitted to inspect or extract live configurations.
// STATUS: RESTRICTED ACCESS // SIGNATURE_MATCH_FAILED`);
                  }
                }}
                className={`text-[8px] px-1.5 py-0.5 rounded border ${
                  activeFile === f 
                    ? 'bg-white/5 border-white/10 text-white font-bold' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content text blocks with typewriter highlights */}
        <div className="flex-1 overflow-auto bg-black/60 rounded border border-white/5 p-2.5 font-mono text-[8.5px] text-zinc-400 leading-normal scrollbar-thin select-text">
          <pre className="text-zinc-350">{liveCode}</pre>
        </div>
      </div>

      {/* 4. Live Typewriter Compiler Console */}
      <div className="p-3 bg-[#020202] border border-white/5 rounded-xl space-y-2 h-[130px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/5 pb-1 select-none">
          <span className="font-bold text-[9px] text-zinc-500 flex items-center gap-1 uppercase">
            <Terminal className="w-3 h-3 text-red-500" />
            COMPILE & LINT MONITOR://
          </span>
          {isSandboxCompiling ? (
            <div className="flex items-center gap-1 text-[8.5px] text-red-400">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              <span>LOGS STREAMING</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8.5px] text-emerald-400">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>TERMINAL STANDBY</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 select-text scrollbar-thin">
          {sandboxLogs.map((log, idx) => (
            <p key={idx} className={`text-[8.5px] font-mono leading-relaxed whitespace-pre-wrap ${
              log.includes('[SUCCESS]') || log.includes('PASS') ? 'text-emerald-400 font-bold' :
              log.includes('[FAIL]') || log.includes('BYPASS_DENIED') ? 'text-red-500 font-bold animate-pulse' :
              log.includes('[PATCH_CORE]') || log.includes('[TRIGGER]') ? 'text-amber-400 font-medium' :
              log.includes('[THINKING]') ? 'text-blue-400 animate-pulse' :
              'text-zinc-400 font-normal'
            }`}>
              {log}
            </p>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Progress compiling slider */}
        {isSandboxCompiling && (
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${compileProgress}%` }} />
          </div>
        )}
      </div>

      {/* 5. Access Permission Panel Interface - SECURE RESTRICTION ENFORCED */}
      <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-center space-y-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-950/5 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-red-500 font-bold text-[10px] uppercase font-mono tracking-widest mb-1 animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            ADMIN REGISTRY RESTRICTED
          </div>
          <p className="text-[8.5px] leading-relaxed text-zinc-400 font-mono">
            Direct compilation is restricted to automated loop processes. User account has zero manual override permission.
          </p>
        </div>
      </div>

    </div>
  );
};

