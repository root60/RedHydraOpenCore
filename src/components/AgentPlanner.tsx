/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, CheckSquare, AlertTriangle, Play, HelpCircle, ToggleLeft, ArrowRight, Activity } from 'lucide-react';
import { AgentPlan } from '../types';

interface AgentPlannerProps {
  plan?: AgentPlan;
  onToggleStep?: (stepId: string) => void;
  onToggleChecklistItem?: (index: number) => void;
}

export const AgentPlanner: React.FC<AgentPlannerProps> = ({
  plan,
  onToggleStep,
  onToggleChecklistItem
}) => {
  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-zinc-900 rounded-xl bg-zinc-950/20">
        <Target className="w-10 h-10 opacity-20 text-red-500 mb-2 animate-pulse" />
        <p className="text-sm font-mono tracking-wide font-bold uppercase text-zinc-400">Agent Telemetry Cold State</p>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mt-1">
          Activate &quot;Agent Mode&quot; and input a complex multi-step request to generate dynamic schedules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Upper Goal & Understanding Bento Cards */}
      <div className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full" />
        <div className="flex items-start gap-2.5">
          <Target className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Active Agent Goal</h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{plan.goal}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Context Comprehension</h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{plan.understanding}</p>
          </div>
        </div>
      </div>

      {/* Execution Timeline Map */}
      <div className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            TASK EXECUTION PLAN
          </h4>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Step Schedule</span>
        </div>

        <div className="relative pl-3 border-l border-zinc-900 space-y-4 py-1 ml-1">
          {plan.steps.map((step, idx) => {
            const statusConfig = {
              completed: { bg: "bg-emerald-500/15 border-emerald-500/50 text-emerald-400", dot: "bg-emerald-500" },
              running: { bg: "bg-red-500/15 border-red-500/50 text-red-400 animate-pulse", dot: "bg-red-500 animate-ping" },
              pending: { bg: "bg-zinc-900 border-zinc-800 text-zinc-400", dot: "bg-zinc-800" },
              failed: { bg: "bg-rose-950/20 border-rose-900/50 text-rose-400", dot: "bg-rose-500" }
            };

            const config = statusConfig[step.status] || statusConfig.pending;

            return (
              <div key={step.id} className="relative group/step">
                {/* Visual marker dot on timeline track */}
                <div className={`absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full ${config.dot} ring-4 ring-zinc-950`} />
                
                <div 
                  onClick={() => onToggleStep?.(step.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${config.bg} ${
                    step.status === 'running' ? 'shadow-[0_0_10px_rgba(220,38,38,0.05)]' : ''
                  }`}
                >
                  <p className="text-xs font-mono font-bold leading-normal">{step.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">
                    Step {idx + 1} &bull; {step.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification validation Checklist */}
      <div className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl space-y-3">
        <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-900 pb-2">
          <CheckSquare className="w-4 h-4 text-red-500" />
          VALIDATION CHECKLIST
        </h4>

        <div className="space-y-2">
          {plan.validationChecklist.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => onToggleChecklistItem?.(idx)}
              className="flex items-start gap-2.5 p-2 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-lg cursor-pointer select-none transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                item.checked 
                  ? "bg-red-950/20 border-red-500/50 text-red-500" 
                  : "bg-zinc-950 border-zinc-800"
              }`}>
                {item.checked && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
              </div>
              <span className={`text-[11px] font-mono leading-normal transition-colors duration-150 ${
                item.checked ? "text-zinc-500 line-through" : "text-zinc-300"
              }`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations Caveat Panel */}
      <div className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl space-y-2.5">
        <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          SYSTEM SAFETY CONSTRAINTS
        </h4>
        <ul className="space-y-1.5">
          {plan.limitations.map((lim, idx) => (
            <li key={idx} className="text-[11px] text-zinc-400 font-mono flex items-start gap-2 leading-relaxed">
              <span className="text-red-600 font-bold">&#8250;</span>
              {lim}
            </li>
          ))}
        </ul>
      </div>

      {/* Next Actions recommendations footer */}
      <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-xl">
        <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 bg-red-900/10 px-2 py-0.5 rounded w-fit mb-2">
          NEXT RECOMMENDED ACTION
        </h4>
        <p className="text-zinc-300 text-xs font-mono leading-relaxed flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0 animate-ping" />
          {plan.nextAction}
        </p>
      </div>
    </div>
  );
};
