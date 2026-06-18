/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Cpu,
  FastForward,
  Pause,
  Play,
  RefreshCcw,
  Route,
  Sparkles,
  TerminalSquare,
  Zap
} from 'lucide-react';
import { AgentLiveAction } from '../types';

interface LiveActionAgentProps {
  actions: AgentLiveAction[];
  isRunning: boolean;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
}

const statusSkin: Record<AgentLiveAction['status'], string> = {
  queued: 'border-zinc-800 bg-zinc-950/70 text-zinc-400',
  thinking: 'border-amber-500/40 bg-amber-500/10 text-amber-300 animate-pulse',
  running: 'border-red-500/40 bg-red-500/10 text-red-300 animate-pulse',
  waiting: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  completed: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  blocked: 'border-rose-500/35 bg-rose-500/10 text-rose-300'
};

const StatusIcon: React.FC<{ status: AgentLiveAction['status'] }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === 'blocked') return <AlertTriangle className="w-3.5 h-3.5" />;
  if (status === 'thinking') return <Cpu className="w-3.5 h-3.5 animate-spin" />;
  if (status === 'running') return <Activity className="w-3.5 h-3.5 animate-pulse" />;
  if (status === 'waiting') return <Clock3 className="w-3.5 h-3.5" />;
  return <CircleDot className="w-3.5 h-3.5" />;
};

export const LiveActionAgent: React.FC<LiveActionAgentProps> = ({
  actions,
  isRunning,
  autoRun,
  onToggleAutoRun,
  onStart,
  onPause,
  onStep,
  onReset
}) => {
  const completed = actions.filter((a) => a.status === 'completed').length;
  const active = actions.find((a) => a.status === 'thinking' || a.status === 'running' || a.status === 'waiting');
  const progress = actions.length ? Math.round((completed / actions.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-red-500/10 blur-3xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-200">Autonomous Live Actions</h4>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed font-mono">
              Think → plan → act → verify loop with manual step control. Actions are sandbox-safe UI automations, not hidden system changes.
            </p>
          </div>
          <span className="px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-[10px] font-mono text-red-300">
            {progress}% SYNC
          </span>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
          <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={isRunning ? onPause : onStart} className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-zinc-250 transition-colors">
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'PAUSE' : 'RUN'}
          </button>
          <button onClick={onStep} className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-zinc-250 transition-colors">
            <FastForward className="w-3.5 h-3.5" /> STEP
          </button>
          <button onClick={onToggleAutoRun} className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-mono transition-colors ${autoRun ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
            <Zap className="w-3.5 h-3.5" /> AUTO {autoRun ? 'ON' : 'OFF'}
          </button>
          <button onClick={onReset} className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-zinc-250 transition-colors">
            <RefreshCcw className="w-3.5 h-3.5" /> RESET
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900/80">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-red-500" /> Action Route
          </h4>
          <span className="text-[9px] text-zinc-600 font-mono uppercase">{active ? active.title : 'Idle'}</span>
        </div>

        <div className="mt-3 space-y-2">
          {actions.map((action, idx) => (
            <div key={action.id} className={`p-3 rounded-xl border transition-all ${statusSkin[action.status]}`}>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5"><StatusIcon status={action.status} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wide truncate">{idx + 1}. {action.title}</p>
                    <span className="text-[8px] uppercase tracking-wider opacity-70">{action.status}</span>
                  </div>
                  <p className="text-[10.5px] mt-1 leading-relaxed opacity-80 font-mono">{action.detail}</p>
                  {action.log && (
                    <div className="mt-2 px-2 py-1.5 rounded-lg bg-black/30 border border-white/5 text-[10px] text-zinc-400 font-mono flex gap-1.5">
                      <TerminalSquare className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{action.log}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

