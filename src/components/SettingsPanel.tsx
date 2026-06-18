/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Save, ShieldAlert, Trash2, Download, RefreshCw, Key } from 'lucide-react';
import { AISettings, ProviderType, AssistantModeType, ResponseStyleType, MemoryPrefs } from '../types';
import { ASSISTANT_SYSTEM_INSTRUCTIONS } from '../utils/prompts';

interface SettingsPanelProps {
  settings: AISettings;
  onUpdateSettings: (settings: AISettings) => void;
  memoryPrefs: MemoryPrefs;
  onUpdateMemoryPrefs: (prefs: MemoryPrefs) => void;
  onClearAllMemory: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  memoryPrefs,
  onUpdateMemoryPrefs,
  onClearAllMemory,
  onShowToast
}) => {

  const [onlineSynced, setOnlineSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value as ProviderType;
    let baseUrl = "";
    let modelName = "";

    switch (prov) {
      case 'built-in-opencore':
        baseUrl = "https://itsredhydra-redhydraopencore-dolphin.hf.space";
        modelName = "dphn/Dolphin3.0-Qwen2.5-0.5B";
        break;
      case 'openai':
        baseUrl = "https://api.openai.com/v1";
        modelName = "gpt-4o-mini";
        break;
      case 'openrouter':
        baseUrl = "https://openrouter.ai/api/v1";
        modelName = "meta-llama/llama-3-8b-instruct:free";
        break;
      case 'ollama':
        baseUrl = "http://localhost:11434/v1";
        modelName = "llama3";
        break;
      case 'custom':
        baseUrl = "https://api.yourcustomprovider.com/v1";
        modelName = "custom-model";
        break;
    }

    onUpdateSettings({
      ...settings,
      provider: prov,
      baseUrl,
      modelName,
      // Keep key or let user wipe
    });
    onShowToast(`Provider switched to ${prov.toUpperCase()}. Recommended defaults set.`, "info");
  };

  const handleExportMemory = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ settings, memoryPrefs }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `redhydra-memory-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast("Memory config file generated and exported!", "success");
    } catch (_) {
      onShowToast("Failed to export settings", "error");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Visual Identity banner */}
      <div className="relative p-6 rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-red-600/5 blur-3xl rounded-full" />
        <h3 className="text-base font-mono font-bold text-zinc-100 flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-red-500 animate-pulse" />
          SYSTEM CREDENTIALS & API CONFORMANCE
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Configure external models or utilize the default, unlimited, and lifetime free server-side RedHydra OpenCore model. 
          Your client API credentials are saved only in private local browser cache storage (IndexedDB/LocalStorage) and never transmitted to our telemetry log.
        </p>

        {/* Browser storage secure notice */}
        <div className="mt-4 flex gap-3 p-3.5 bg-red-950/10 border border-red-900/40 rounded-lg text-[11px] leading-relaxed text-red-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">Security Notice</span>
            Clients entered inside client settings forms are accessible in the browser context via developer tools. For enhanced production isolation, prefer using restricted API keys with narrow usage scopes or leverage the built-in server router.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API PROVIDER COLUMN */}
        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
            AI Provider & Endpoint Configuration
          </h4>

          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px] font-mono uppercase">Select API Provider</label>
            <select
              value={settings.provider}
              onChange={handleProviderChange}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50 font-mono"
            >
              <option value="built-in-opencore">Built-in RedHydra OpenCore (Lifetime Free & Unlimited)</option>
              <option value="openai">OpenAI (GPT-4 / GPT-3.5)</option>
              <option value="openrouter">OpenRouter (Claude, LLaMA, etc.)</option>
              <option value="ollama">Local Ollama (Offline Runner)</option>
              <option value="custom">Custom JSON Endpoints</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px] font-mono uppercase">Model Identifier Designation</label>
            <input
              type="text"
              value={settings.modelName}
              onChange={(e) => onUpdateSettings({ ...settings, modelName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm font-mono text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50"
              placeholder="e.g. dphn/Dolphin3.0-Qwen2.5-0.5B, llama3"
            />
          </div>

          <div className="space-y-3 pt-1">
            {/* Automated Model Endpoint Status */}
            <div className="redhydra-auto-sync-status p-3 bg-zinc-950/80 w-full border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in select-none">
              <div className="flex items-center gap-2 text-left">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <div>
                  <span className="text-[10px] font-bold text-zinc-300 block uppercase font-mono">
                    Dolphin Endpoint Auto-Link
                  </span>
                  <span className="text-[8px] text-zinc-500 block leading-tight font-mono uppercase">
                    Synced automatically during RedHydra loading screen.
                  </span>
                </div>
              </div>

              <div className="py-1.5 px-3 rounded-lg text-[9px] font-mono font-bold uppercase border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                AUTO SYNC ACTIVE
              </div>
            </div>

            <label className="text-zinc-400 text-[11px] font-mono uppercase block pt-1">AI Model Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'built-in-opencore',
                    baseUrl: 'https://itsredhydra-redhydraopencore-dolphin.hf.space',
                    modelName: 'dphn/Dolphin3.0-Qwen2.5-0.5B'
                  });
                  onShowToast("RedHydra OpenCore v3 model activated.", "success");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'dphn/Dolphin3.0-Qwen2.5-0.5B' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🐉 OpenCore v3</span>
                  <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-400 rounded-sm">Free</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">built-in-opencore</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'openai',
                    baseUrl: 'https://api.openai.com/v1',
                    modelName: 'gpt-4o'
                  });
                  onShowToast("GPT-4o configuration loaded. Set your OpenAI client key if needed.", "info");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'gpt-4o' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🧠 GPT-4o Omni</span>
                  <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 rounded-sm">Key Req</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">openai/gpt-4o</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'openrouter',
                    baseUrl: 'https://openrouter.ai/api/v1',
                    modelName: 'anthropic/claude-3.5-sonnet'
                  });
                  onShowToast("Claude 3.5 Sonnet loaded via OpenRouter.", "info");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'anthropic/claude-3.5-sonnet' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>💡 Claude 3.5</span>
                  <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 rounded-sm">Key Req</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">anthropic/claude-3.5</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'openrouter',
                    baseUrl: 'https://openrouter.ai/api/v1',
                    modelName: 'deepseek/deepseek-r1'
                  });
                  onShowToast("DeepSeek R1 reasoning model loaded.", "info");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'deepseek/deepseek-r1' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🌀 DeepSeek R1</span>
                  <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 rounded-sm">Key Req</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">deepseek-r1</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'openrouter',
                    baseUrl: 'https://openrouter.ai/api/v1',
                    modelName: 'meta-llama/llama-3.3-70b-instruct'
                  });
                  onShowToast("Llama 3.3 70B loaded.", "info");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'meta-llama/llama-3.3-70b-instruct' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🦙 LLaMA 3.3 70B</span>
                  <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 rounded-sm">Key Req</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">llama-3.3-70b</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'openrouter',
                    baseUrl: 'https://openrouter.ai/api/v1',
                    modelName: 'meta-llama/llama-3-8b-instruct:free'
                  });
                  onShowToast("Llama 3 8B Free Tier model loaded.", "success");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'meta-llama/llama-3-8b-instruct:free' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>⚡ LLaMA 3 8B</span>
                  <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-400 rounded-sm">Free</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">llama-3-8b-free</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'built-in-opencore',
                    baseUrl: 'https://itsredhydra-redhydraopencore-dolphin.hf.space',
                    modelName: 'google/gemini-2.5-flash'
                  });
                  onShowToast("🌐 Preloaded Google Dolphin OpenCore 2.5 Flash activated from automatic endpoint sync!", "success");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'google/gemini-2.5-flash' 
                    ? "bg-red-500/10 border-red-500/30 text-red-500 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-350 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🚀 Dolphin OpenCore 2.5 Flash</span>
                  <span className="text-[8px] px-1 bg-red-550/20 text-red-400 rounded-sm font-bold">Online</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">gemini-2.5-flash</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    provider: 'built-in-opencore',
                    baseUrl: 'https://itsredhydra-redhydraopencore-dolphin.hf.space',
                    modelName: 'google/gemini-2.5-pro'
                  });
                  onShowToast("🌐 Preloaded Google Dolphin OpenCore 2.5 Pro reasoning engine activated!", "success");
                }}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[10px] ${
                  settings.modelName === 'google/gemini-2.5-pro' 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-350 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>🧠 Dolphin OpenCore 2.5 Pro</span>
                  <span className="text-[8px] px-1 bg-red-550/20 text-red-400 rounded-sm font-bold">Online</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5">gemini-2.5-pro</div>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px] font-mono uppercase">API Host Base URL</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => onUpdateSettings({ ...settings, baseUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm font-mono text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50"
              placeholder="https://api.endpoint.com/v1"
              disabled={settings.provider === 'built-in-opencore'}
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px] font-mono uppercase">Client Access API Token</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => onUpdateSettings({ ...settings, apiKey: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm font-mono text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50"
              placeholder={settings.provider === 'built-in-opencore' ? "Server Key Active. Leave Blank." : "sk-..."}
              disabled={settings.provider === 'built-in-opencore'}
            />
            {settings.provider === 'built-in-opencore' && (
              <p className="text-[10px] text-zinc-500 font-mono">Our built-in provider is 100% open-source, unlimited, and runs directly via our server-side secure nodes.</p>
            )}
          </div>
        </div>

        {/* PARAMETERS AND TUNING COLUMN */}
        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
            Model Hyperspace / Parameter Tuning
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-zinc-400 text-[11px] font-mono uppercase">Temperature</label>
                <span className="text-xs font-mono font-bold text-red-500">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full h-1 bg-zinc-900 border-none outline-none appearance-none accent-red-600 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-[11px] font-mono uppercase">Max Response Tokens</label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => onUpdateSettings({ ...settings, maxTokens: parseInt(e.target.value) || 2048 })}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50"
                min="64"
                max="16384"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px] font-mono uppercase">Default Assistant mode</label>
            <select
              value={settings.assistantMode}
              onChange={(e) => onUpdateSettings({ ...settings, assistantMode: e.target.value as AssistantModeType })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50 font-mono"
            >
              {Object.keys(ASSISTANT_SYSTEM_INSTRUCTIONS).map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px] font-mono uppercase">Response Structural Style</label>
            <select
              value={settings.responseStyle}
              onChange={(e) => onUpdateSettings({ ...settings, responseStyle: e.target.value as ResponseStyleType })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50 font-mono"
            >
              <option value="detailed">Detailed (Exploratory Text)</option>
              <option value="concise">Concise (Direct Core)</option>
              <option value="structured">Structured (H2 Headings & Outline)</option>
              <option value="bulleted">Bulleted (High Scannability)</option>
            </select>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-zinc-900/40">
            <div className="flex justify-between items-center">
              <label className="text-zinc-400 text-[11px] font-mono uppercase">Extended Reasoning (High Thinking)</label>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                settings.thinkingLevel === 'high' 
                  ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" 
                  : settings.thinkingLevel === 'low'
                  ? "bg-amber-500/10 text-amber-500" 
                  : settings.thinkingLevel === 'minimal'
                  ? "bg-zinc-800 text-zinc-400"
                  : "bg-emerald-500/20 text-emerald-400 font-bold"
              }`}>
                {settings.thinkingLevel || 'auto'}
              </span>
            </div>
            <select
              value={settings.thinkingLevel || 'auto'}
              onChange={(e) => onUpdateSettings({ ...settings, thinkingLevel: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg focus:outline-none focus:border-red-900/50 focus:ring-1 focus:ring-red-900/50 font-mono"
            >
              <option value="auto">Auto-Think (Scales based on complexity)</option>
              <option value="high">High Thinking (Maximize reasoning for complex tasks)</option>
              <option value="low">Low Thinking (Minimize latency and speed up response)</option>
              <option value="minimal">Minimal / Off (Equivalent to no extra reasoning)</option>
            </select>
            <p className="text-[10px] text-zinc-500 font-mono leading-normal pt-1">
              Controls Chain-of-Thought (CoT) configuration for Dolphin OpenCore 3 series models. Turning it to <span className="text-red-400/95 font-bold">High</span> instructs the engine to analyze multihost structures and solve complex queries before delivering response payloads.
            </p>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-zinc-900 rounded-lg">
            <div>
              <span className="text-xs font-mono text-zinc-200 font-semibold block">Real-time SSE Streaming</span>
              <span className="text-[10px] text-zinc-500 font-mono">Increases response fluid type animation (if supported)</span>
            </div>
            <input
              type="checkbox"
              checked={settings.streaming}
              onChange={(e) => onUpdateSettings({ ...settings, streaming: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-800 text-red-600 focus:ring-0 focus:ring-offset-0 accent-red-600 bg-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* EXTENDED MEMORY & PERSISTENCE SECTION */}
      <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-6">
        <h4 className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
          Encrypted Browser Memory Management
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300">Disable Memory Accumulation</span>
              <input
                type="checkbox"
                checked={!memoryPrefs.savePreferences}
                onChange={(e) => onUpdateMemoryPrefs({ ...memoryPrefs, savePreferences: !e.target.checked })}
                className="w-4 h-4 rounded border-zinc-800 text-red-600 accent-red-600 bg-zinc-900"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300">Save Recent Chat Histories</span>
              <input
                type="checkbox"
                checked={memoryPrefs.recentChatsSaved}
                onChange={(e) => onUpdateMemoryPrefs({ ...memoryPrefs, recentChatsSaved: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-800 text-red-600 accent-red-600 bg-zinc-900"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300">Retain Custom Assistant Tone preferences</span>
              <input
                type="checkbox"
                checked={memoryPrefs.saveTone}
                onChange={(e) => onUpdateMemoryPrefs({ ...memoryPrefs, saveTone: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-800 text-red-600 accent-red-600 bg-zinc-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-zinc-400 text-[11px] font-mono uppercase">User Pin Instruction (Persistent Context Injection)</label>
              <textarea
                value={memoryPrefs.pinnedInstruction}
                onChange={(e) => onUpdateMemoryPrefs({ ...memoryPrefs, pinnedInstruction: e.target.value })}
                className="w-full h-16 p-2 bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded-lg focus:outline-none focus:border-red-900/50 resize-none leading-relaxed"
                placeholder="Declare user context (e.g. 'Always answer in Python unless specified, my server runs Debian.')"
              />
            </div>
          </div>
        </div>

        {/* Action utility row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-905">
          <div className="text-[11px] text-zinc-500 font-mono">
            Secure configuration exports preserve active models context.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportMemory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-xs font-mono text-zinc-300 rounded border border-zinc-800"
            >
              <Download className="w-3.5 h-3.5" />
              Export Config
            </button>
            <button
              onClick={onClearAllMemory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-900/30 text-xs font-mono text-red-400 rounded border border-red-900/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wipe Browser Memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

