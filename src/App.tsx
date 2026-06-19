/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import {
  MessageSquare,
  Bot,
  Terminal,
  Shield,
  FileSearch,
  BookOpen,
  Settings,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Trash,
  Pin,
  Clipboard,
  RotateCcw,
  Check,
  Copy,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User,
  Power,
  Sliders,
  Send,
  Zap,
  ShieldAlert,
  Loader2,
  Lock,
  Download,
  Award,
  CirclePlay,
  Moon,
  Compass,
  FileText,
  Paperclip,
  FileUp,
  Menu,
  X,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  FileCode
} from 'lucide-react';

import { 
  ViewType, 
  AISettings, 
  Message, 
  Chat, 
  PromptTemplate, 
  MemoryPrefs,
  AssistantModeType
} from './types';

import { CodeBlock } from './components/CodeBlock';
import { PromptLibrary } from './components/PromptLibrary';
import { FileAnalyzer } from './components/FileAnalyzer';
import { CybersecurityWorkspace } from './components/CybersecurityWorkspace';
import { ResearchWorkspace } from './components/ResearchWorkspace';
import { SettingsPanel } from './components/SettingsPanel';
import { AgentPlanner } from './components/AgentPlanner';
import { AILiveActions } from './components/AILiveActions';
import { Toast, ToastNotification, Modal, Button } from './components/UI';
import { sendChatMessage } from './services/aiService';
import { getRealtimeUsage, getLast10MessagesTokenData } from './utils/tokenCounter';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Initial Defaults
const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'built-in-opencore',
  modelName: 'dphn/Dolphin3.0-Qwen2.5-0.5B',
  baseUrl: 'https://itsredhydra-redhydraopencore-dolphin.hf.space',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 8192,
  customSystemPrompt: '',
  personality: 'helpful',
  responseStyle: 'structured',
  safeMode: true,
  streaming: true,
  assistantMode: 'general',
  thinkingLevel: 'auto',
};

const DEFAULT_MEMORY_PREFS: MemoryPrefs = {
  savePreferences: true,
  saveTone: true,
  pinnedInstruction: '',
  recentChatsSaved: true,
  customPromptTemplates: []
};

const renderFileIcon = (mimeType: string, name: string) => {
  const type = (mimeType || "").toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  if (type.startsWith("image/") || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon className="w-4 h-4" />;
  } else if (type.startsWith("audio/") || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return <Music className="w-4 h-4" />;
  } else if (type.startsWith("video/") || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return <Video className="w-4 h-4" />;
  } else if (type === "application/pdf" || ext === 'pdf') {
    return <BookOpen className="w-4 h-4" />;
  } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <Archive className="w-4 h-4" />;
  } else if (type.includes("javascript") || type.includes("typescript") || type.includes("json") || ['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'go', 'rs', 'cpp', 'c', 'cs', 'java', 'html', 'css'].includes(ext)) {
    return <FileCode className="w-4 h-4" />;
  } else {
    return <FileText className="w-4 h-4" />;
  }
};

const CustomTokenTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-white/10 p-2 text-[10px] font-mono shadow-2xl rounded-xl space-y-1 text-slate-200">
        <p className="text-zinc-400 font-bold border-b border-white/5 pb-0.5">{data.name}</p>
        <p className="flex justify-between gap-4 text-[#3b82f6]">
          <span>Text:</span>
          <span className="font-bold text-zinc-350">{data.text.toLocaleString()}</span>
        </p>
        {data.attachment > 0 && (
          <p className="flex justify-between gap-4 text-[#e11d48]">
            <span>File:</span>
            <span className="font-bold text-zinc-350">{data.attachment.toLocaleString()}</span>
          </p>
        )}
        <p className="flex justify-between gap-4 text-emerald-400 border-t border-white/5 pt-1 font-bold">
          <span>Total:</span>
          <span className="text-zinc-100">{data.total.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an extreme applet crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070708] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-950 border border-red-500/25 p-6 rounded-2xl shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-650 to-red-500" />
            <div className="flex items-center gap-3 text-red-500 font-mono font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              RedHydra Kernel Recovery Console
            </div>
            
            <div className="space-y-2">
              <h1 className="text-lg font-mono font-bold text-zinc-150 uppercase tracking-tight">App state abended</h1>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                An uncaught exception interrupted the active React render lifecycle. The client environment was secured.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-950/15 border border-red-500/10 rounded-xl font-mono text-[10px] text-red-400 overflow-x-auto max-h-40 leading-normal select-text">
                <strong>Exception Log:</strong>
                <pre className="mt-1.5 whitespace-pre-wrap">{this.state.error.stack || this.state.error.message}</pre>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (_) {}
                  window.location.reload();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20 text-[10px] font-bold text-red-400 font-mono uppercase tracking-wider transition-all"
              >
                Reset Cache &amp; Reload
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-zinc-300 font-mono uppercase tracking-wider transition-all"
              >
                Hot Reload Frame
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


interface BootLoadingScreenProps {
  progress: number;
  status: string;
  modelName: string;
  baseUrl: string;
  onLaunch: () => void;
}

function BootLoadingScreen({ progress, status, modelName, baseUrl, onLaunch }: BootLoadingScreenProps) {
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className="rh-boot-screen"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursor({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }}
      style={{ '--mx': `${cursor.x}%`, '--my': `${cursor.y}%` } as React.CSSProperties}
    >
      <div className="rh-boot-grid" />
      <div className="rh-boot-orb rh-boot-orb-a" />
      <div className="rh-boot-orb rh-boot-orb-b" />
      <div className="rh-boot-scan" />

      <div className="rh-boot-card">
        <div className="rh-boot-core-wrap">
          <div className="rh-boot-core">
            <div className="rh-boot-core-ring" />
            <div className="rh-boot-core-ring rh-boot-core-ring-2" />
            <Bot className="rh-boot-core-icon" />
          </div>
          <div className="rh-boot-nodes">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="rh-boot-copy">
          <div className="rh-boot-kicker">
            <span className="rh-boot-live-dot" />
            MODEL HANDSHAKE SEQUENCE
          </div>
          <h1>RedHydra OpenCore</h1>
          <p>{status}</p>
        </div>

        <div className="rh-boot-terminal">
          <div className="rh-boot-terminal-head">
            <Terminal className="w-3.5 h-3.5" />
            <span>runtime.link</span>
          </div>
          <div className="rh-boot-terminal-line"><span>provider</span><b>built-in-opencore</b></div>
          <div className="rh-boot-terminal-line"><span>model</span><b>{modelName}</b></div>
          <div className="rh-boot-terminal-line"><span>endpoint</span><b>{baseUrl.replace(/^https?:\/\//, '')}</b></div>
          <div className="rh-boot-terminal-line"><span>status</span><b>{safeProgress >= 100 ? 'READY' : 'SYNCING'}</b></div>
        </div>

        <div className="rh-boot-progress-shell">
          <div className="rh-boot-progress-meta">
            <span>boot progress</span>
            <b>{Math.round(safeProgress)}%</b>
          </div>
          <div className="rh-boot-progress-track">
            <div className="rh-boot-progress-fill" style={{ width: `${safeProgress}%` }} />
          </div>
        </div>

        <div className="rh-boot-feature-row">
          <div><Shield className="w-4 h-4" /><span>Secure Proxy</span></div>
          <div><Zap className="w-4 h-4" /><span>32K Context</span></div>
          <div><Sparkles className="w-4 h-4" /><span>Live Stream</span></div>
        </div>

        <button type="button" onClick={onLaunch} className="rh-boot-launch-btn">
          <Power className="w-4 h-4" />
          Launch Interface
        </button>
      </div>
    </div>
  );
}

function App() {
  const [navView, setNavView] = useState<ViewType>('chat');
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [memoryPrefs, setMemoryPrefs] = useState<MemoryPrefs>(DEFAULT_MEMORY_PREFS);
  const [isBooting, setIsBooting] = useState(() => sessionStorage.getItem('redhydra_boot_ready') !== '1');
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState('Initializing RedHydra kernel and auto-linking model endpoint...');

  const renderMessageContent = (content: string) => {
    const thinkStart = content.indexOf('<thinking>');
    const thinkEnd = content.indexOf('</thinking>');

    const markdownComponents = {
      code(props: any) {
        const { children, className, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match;
        const codeText = String(children).replace(/\n$/, '');

        return !isInline ? (
          <CodeBlock 
            code={codeText} 
            language={match ? match[1] : 'javascript'} 
          />
        ) : (
          <code className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded text-[11px] text-red-400 font-mono" {...rest}>
            {children}
          </code>
        );
      },
      h1: ({children}: any) => <h1 className="text-base font-mono font-bold text-zinc-100 mt-4 mb-2 uppercase tracking-wide border-b border-zinc-900/50 pb-1">{children}</h1>,
      h2: ({children}: any) => <h2 className="text-sm font-mono font-bold text-zinc-100 mt-4 mb-1.5 uppercase tracking-wide">{children}</h2>,
      h3: ({children}: any) => <h3 className="text-xs font-mono font-bold text-zinc-200 mt-3 mb-1">{children}</h3>,
      p: ({children}: any) => <p className="mb-3 leading-relaxed text-zinc-300 font-sans">{children}</p>,
      ul: ({children}: any) => <ul className="list-disc pl-5 mb-3 text-zinc-300 space-y-1 font-mono text-[11px]">{children}</ul>,
      ol: ({children}: any) => <ol className="list-decimal pl-5 mb-3 text-zinc-300 space-y-1 font-mono text-[11px]">{children}</ol>,
      li: ({children}: any) => <li className="text-zinc-350">{children}</li>,
      table: ({children}: any) => (
        <div className="overflow-x-auto my-4 border border-zinc-900 rounded-lg font-mono">
          <table className="w-full text-left text-xs font-mono">{children}</table>
        </div>
      ),
      thead: ({children}: any) => <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-850 uppercase tracking-wider">{children}</thead>,
      tbody: ({children}: any) => <tbody className="divide-y divide-zinc-900/40">{children}</tbody>,
      tr: ({children}: any) => <tr className="hover:bg-zinc-900/10">{children}</tr>,
      th: ({children}: any) => <th className="px-3 py-2 font-bold">{children}</th>,
      td: ({children}: any) => <td className="px-3 py-2 text-zinc-300">{children}</td>,
      blockquote: ({children}: any) => (
        <blockquote className="pl-4 border-l-2 border-red-900 bg-red-950/5 py-1 my-3 text-zinc-400 italic">
          {children}
        </blockquote>
      )
    };

    if (thinkStart !== -1 && thinkEnd !== -1 && thinkEnd > thinkStart) {
      const rawThinking = content.substring(thinkStart + 10, thinkEnd).trim();
      const actualContent = content.substring(thinkEnd + 11).trim();

      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-2 right-2 text-amber-500/15 text-xs font-mono tracking-widest uppercase pointer-events-none font-bold">thought</div>
            <div className="flex items-center gap-1.5 text-amber-500 font-bold uppercase tracking-wider text-[10px] mb-2 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_1.5s_infinite]" />
              EXTENDED COGNITIVE REASONING (CoT)：
            </div>
            <div className="text-zinc-400 text-xs font-mono whitespace-pre-wrap pl-3.5 border-l border-amber-500/20 leading-relaxed font-normal">
              {rawThinking}
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none text-sm text-zinc-350 leading-relaxed font-sans markdown-body">
            <Markdown components={markdownComponents}>
              {actualContent}
            </Markdown>
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-invert max-w-none text-sm text-zinc-350 leading-relaxed font-sans markdown-body">
        <Markdown components={markdownComponents}>
          {content}
        </Markdown>
      </div>
    );
  };
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [chatsSearch, setChatsSearch] = useState('');
  
  // Anonymous profile generated each time upon fresh session
  const [anonProfile, setAnonProfile] = useState<{ name: string; avatar: string; role: string; pingMs: number } | null>(null);

  // Chat messaging actions
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeStreamingMessageId, setActiveStreamingMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // File Uploading states in Chat Workspace
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: number; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated Cybersecurity dynamic telemetry state values inside sidebars
  const [cyberMetrics, setCyberMetrics] = useState({
    cpuLoad: 18,
    nodePing: 12,
    decryptionRate: 98.65,
    activeThreads: 14,
    mops: 42.4
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCyberMetrics({
        cpuLoad: Math.floor(Math.random() * 15 + 12),
        nodePing: Math.floor(Math.random() * 6 + 9),
        decryptionRate: parseFloat((Math.random() * 0.8 + 98.8).toFixed(2)),
        activeThreads: Math.floor(Math.random() * 5 + 12),
        mops: parseFloat((Math.random() * 10 + 38.5).toFixed(1))
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Layout setups - Focused on Chat & Agent features by default
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [modulesMinimized, setModulesMinimized] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<'sandbox' | 'timeline'>('sandbox');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [compilationLogs, setCompilationLogs] = useState<string[]>([
    "[BUILD] Initializing RedHydra OpenCore v3.2.0...",
    "[SYSTEM] Environment sandboxed safely behind port 3000.",
    "[SYSTEM] System integrity check: PASS (Standard container limits).",
    "[SUCCESS] Core ready. Monitoring operator terminal sessions."
  ]);
  const compilationEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    compilationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [compilationLogs]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  // Refs for auto scrolling
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Local Storage Loaders
  useEffect(() => {
    try {
      // 1. Load or Generate Anonymous Profile (resets when user exits/closes website)
      const savedProfile = sessionStorage.getItem('redhydra_anon_profile');
      if (savedProfile) {
        setAnonProfile(JSON.parse(savedProfile));
      } else {
        const aliases = [
          "Aether_Specter", "Neon_Phantom", "Cyber_Viper", "Ghost_Protocol", 
          "Null_Pointer", "Entropy_Zero", "Aether_Blade", "Zero_Cool", 
          "Acid_Burn", "Crash_Override", "Lord_Nikon", "Binary_Specter",
          "Apex_Netrunner", "Proxy_Wraith", "Signal_Ghost", "Shadow_Broker"
        ];
        const roles = [
          "Core Security Analyst", "Ghost Netrunner", "A.I. Alignment Supervisor", 
          "Autonomous Node Operator", "Quantum Cryptographer", "Infiltration Specialist",
          "Systems Overlord", "Deep Space Sysop", "Decentralized Hacker"
        ];
        const initials = ["AS", "NP", "CV", "GP", "NP", "EZ", "AB", "ZC", "AB", "CO", "LN", "BS", "AN", "PW", "SG", "SB"];
        const randomIdx = Math.floor(Math.random() * aliases.length);
        const randomRoleIdx = Math.floor(Math.random() * roles.length);
        
        const newProfile = {
          name: aliases[randomIdx],
          avatar: initials[randomIdx % initials.length],
          role: roles[randomRoleIdx],
          pingMs: Math.floor(Math.random() * 45) + 5
        };
        sessionStorage.setItem('redhydra_anon_profile', JSON.stringify(newProfile));
        setAnonProfile(newProfile);
      }

      // 2. Load other states using sessionStorage (expires when closing the tab/website)
      const savedSettings = sessionStorage.getItem('redhydra_settings');
      const savedPrefs = sessionStorage.getItem('redhydra_prefs');
      const savedChats = sessionStorage.getItem('redhydra_chats');

      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedPrefs) setMemoryPrefs(JSON.parse(savedPrefs));
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats) as Chat[];
        if (parsedChats.length > 0) {
          setChats(parsedChats);
          setActiveChatId(parsedChats[0].id);
        } else {
          createInitialChat();
        }
      } else {
        createInitialChat();
      }
    } catch (_) {
      createInitialChat();
    }
  }, []);

  // 2. State Sync to Storage
  useEffect(() => {
    if (memoryPrefs.savePreferences) {
      sessionStorage.setItem('redhydra_settings', JSON.stringify(settings));
      sessionStorage.setItem('redhydra_prefs', JSON.stringify(memoryPrefs));
    }
  }, [settings, memoryPrefs]);

  useEffect(() => {
    if (chats.length > 0 && memoryPrefs.recentChatsSaved) {
      sessionStorage.setItem('redhydra_chats', JSON.stringify(chats));
    }
  }, [chats, memoryPrefs]);

  // Scroll to bottom helper
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chats, streamingText, isGenerating]);

  // Create default initial chat session
  const createInitialChat = () => {
    const freshChat: Chat = {
      id: `chat-${Date.now()}`,
      title: "Initial Hydra Intelligence Module",
      messages: [
        {
          id: "m-welcome",
          role: 'assistant',
          content: `### Welcome to **RedHydra OpenCore** 🐉
Your hyper-resilient, open-source, unlimited, and lifetime free AI workspace for secure development, research, and task automation.

#### ⚡ Core Chat & Agent Interface Active:
- **Comprehensive Agent Mode**: Toggle **Agent Mode** in the message bar to watch the AI plan, structure, and execute multi-step routines in the real-time sandbox panel on your right.
- **Full Chat Capabilities**: Interact with our powerful, free-tier or customized models directly. Use the input panel below to get started.
- **File Parsing & Buffers**: Drag and drop code, scripts, or documents directly into the chat console to immediately analyze assets side-by-side with your agent.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      assistantMode: 'general'
    };
    setChats([freshChat]);
    setActiveChatId(freshChat.id);
  };

  // Toast helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const activeChat = chats.find((c) => c.id === activeChatId);
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  const tokenUsage = useMemo(() => {
    return getRealtimeUsage(userInput, selectedFile, activeChat?.messages || [], settings.provider);
  }, [userInput, selectedFile, activeChat?.messages, settings.provider]);

  const last10MessagesTokens = useMemo(() => {
    return getLast10MessagesTokenData(activeChat?.messages || []);
  }, [activeChat?.messages]);

  // RH_BOOT_MODEL_AUTO_SYNC
  useEffect(() => {
    if (settings.provider === 'built-in-opencore') {
      setSettings((prev) => ({
        ...prev,
        provider: 'built-in-opencore',
        modelName: 'dphn/Dolphin3.0-Qwen2.5-0.5B',
        baseUrl: 'https://itsredhydra-redhydraopencore-dolphin.hf.space',
        maxTokens: 8192,
        streaming: true
      }));
    }
  }, []);


  useEffect(() => {
    if (!isBooting) return;

    let done = false;
    const controller = new AbortController();
    const bootSteps = [
      { at: 8, label: 'Initializing local interface kernel...' },
      { at: 22, label: 'Auto-linking Dolphin endpoint...' },
      { at: 38, label: `Warming endpoint: ${settings.baseUrl.replace(/^https?:\/\//, '')}` },
      { at: 58, label: `Auto-syncing model: ${settings.modelName}` },
      { at: 78, label: 'Preparing streaming transport and token monitor...' },
      { at: 94, label: 'Finalizing RedHydra interface...' },
    ];

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(96, Math.round(elapsed / 32));
      setBootProgress(next);
      const current = bootSteps.reduce((acc, step) => (next >= step.at ? step : acc), bootSteps[0]);
      setBootStatus(current.label);
    }, 90);

    fetch(settings.baseUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    }).catch(() => {
      // Cold HF Spaces or CORS can fail here. The app must still launch.
    });

    const finishTimer = window.setTimeout(() => {
      if (done) return;
      done = true;
      setBootStatus('Dolphin endpoint synced. Launching RedHydra interface...');
      setBootProgress(100);
      window.setTimeout(() => {
        sessionStorage.setItem('redhydra_boot_ready', '1');
        setIsBooting(false);
      }, 520);
    }, 3600);

    return () => {
      done = true;
      controller.abort();
      window.clearInterval(interval);
      window.clearTimeout(finishTimer);
    };
  }, [isBooting, settings.baseUrl, settings.modelName]);

  const handleBootLaunch = () => {
    setBootProgress(100);
    setBootStatus('Manual launch confirmed. Opening interface...');
    window.setTimeout(() => {
      sessionStorage.setItem('redhydra_boot_ready', '1');
      setIsBooting(false);
    }, 260);
  };

  // New Chat Action
  const handleNewChat = (mode: AssistantModeType = 'general', welcomeText?: string) => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: `Analysis - ${mode.toUpperCase().replace('_', ' ')}`,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          role: 'system',
          content: `System profile synchronized: Operating inside **${mode.toUpperCase().replace('_', ' ')}** parameters. Use local guidelines or configure keys in settings.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      assistantMode: mode
    };

    if (welcomeText) {
      newChat.messages.push({
        id: `m-welcome-${Date.now()}`,
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setNavView('chat');
    addToast(`New specialized ${mode} workspace loaded.`, "success");
  };

  // Sidebar helpers: delete, rename, pin
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = chats.filter((c) => c.id !== id);
    setChats(remaining);
    addToast("Conversation workspace pruned successfully.", "info");
    if (activeChatId === id && remaining.length > 0) {
      setActiveChatId(remaining[0].id);
    } else if (remaining.length === 0) {
      createInitialChat();
    }
  };

  const handlePinChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    addToast("Pin state toggled", "success");
  };

  const handleStartRenameChat = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditingChatTitle(title);
  };

  const handleSaveRenameChat = (id: string) => {
    if (!editingChatTitle.trim()) return;
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editingChatTitle.trim() } : c))
    );
    setEditingChatId(null);
    addToast("Chat name synchronized successfully", "success");
  };

  // Clear current active chat window
  const handleClearChat = () => {
    if (!activeChatId) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [
                {
                  id: `m-clear-${Date.now()}`,
                  role: 'assistant',
                  content: "Current conversation pruned. Enter a new query to start dynamic processing.",
                  timestamp: new Date().toLocaleTimeString(),
                },
              ],
            }
          : c
      )
    );
    addToast("Workspace session cleared.", "success");
  };

  // Stop current active request generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setStreamingText('');
    addToast("Request pipeline execution halted.", "info");
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast("Payload exceeds maximum 8MB volume", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      // Determine type fallback
      let mimeType = file.type;
      if (!mimeType) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'pdf': 'application/pdf',
          'txt': 'text/plain',
          'json': 'application/json',
          'js': 'text/javascript',
          'ts': 'text/typescript',
          'tsx': 'text/typescript',
          'md': 'text/markdown',
          'csv': 'text/csv'
        };
        mimeType = (ext && mimeMap[ext]) || "application/octet-stream";
      }

      setSelectedFile({
        name: file.name,
        type: mimeType,
        size: file.size,
        content: dataUrl || ""
      });
      addToast(`Asset "${file.name}" registered to active terminal buffer`, "success");
    };
    reader.readAsDataURL(file);
  };

  const handleUserAdminTrigger = () => {
    setCompilationLogs(prev => [
      ...prev,
      `[ADMIN] Manual patch request issued by client user.`,
      `[FAIL] Bypassing compile instruction. ACCESS DENIED (Error 403: Forbidden).`,
      `[SYSTEM] User overrides are forbidden. Only RedHydra OpenCore holds active keys.`
    ]);
    addToast("Access Denied: Manual compilation overrides are forbidden.", "error");
  };

  const handleSelfUpgradeTrigger = () => {
    setCompilationLogs(prev => [
      ...prev,
      `[ADMIN] Manual recompile override clicked by client user.`,
      `[FAIL] Access Denied: AI core self-modification is exclusive to chatbot processes.`
    ]);
    addToast("Forbidden: AI core self-upgrades are locked to chatbot processes only.", "error");
  };

  const triggerAISelfUpgradeCompilation = () => {
    const logs = [
      "[AUTONOMIC] Chatbot initialized autonomic self-upgrade handshake...",
      "[AUTHENTICATION] Checking client authorization sequence...",
      "[FAIL] Security Policy Rule: Dynamic workspace compilation is disabled.",
      "[FAIL] Operator/User cannot access source code or modify the website AI.",
      "[ABORTED] Compilation loop abended."
    ];

    logs.forEach((logLine, index) => {
      setTimeout(() => {
        setCompilationLogs(prev => [...prev, logLine]);
        if (logLine.includes("FAIL")) {
          addToast("Forbidden: AI self-modification is strictly locked by server policy.", "error");
        }
      }, (index + 1) * 800);
    });
  };

  // CORE CHAT SENDING ENGINE
  const handleSendMessage = async (textToSend?: string) => {
    const rawInput = textToSend || userInput;
    if (!rawInput.trim() || isGenerating || !activeChatId) return;

    // Reset inputs
    if (!textToSend) {
      setUserInput('');
    }

    const userMessage: Message = {
      id: `m-usr-${Date.now()}`,
      role: 'user',
      content: rawInput.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    if (selectedFile) {
      userMessage.attachment = selectedFile;
      setSelectedFile(null); // Purge cache
    }

    // Append user message to active chat
    let updatedMsgs = [...(activeChat?.messages || []), userMessage];
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: updatedMsgs, updatedAt: new Date().toISOString() } : c))
    );

    setIsGenerating(true);
    setStreamingText('');

    try {
      let accum = "";
      const streamHandler = (chunk: string) => {
        accum = chunk;
        setStreamingText(chunk);
      };

      // Set up client system instruction if in special custom mode
      const activeSettingsModel = {
        ...settings,
        assistantMode: activeChat?.assistantMode || settings.assistantMode
      };

      // Fire API integration
      const aiResponse = await sendChatMessage(
        updatedMsgs,
        activeSettingsModel,
        isAgentMode,
        streamHandler
      );

      // Save complete assistant message to chat list
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: [...c.messages, aiResponse],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      // Autonomic Admin Core Scanner for self-modification keywords
      if (aiResponse && aiResponse.content) {
        const contentLower = aiResponse.content.toLowerCase();
        if (
          contentLower.includes("upgrade") || 
          contentLower.includes("recompile") || 
          contentLower.includes("patch source") || 
          contentLower.includes("admin_upgrade") ||
          contentLower.includes("admin_patch") ||
          contentLower.includes("system administrative")
        ) {
          triggerAISelfUpgradeCompilation();
        }
      }

    } catch (err: any) {
      console.error("Transmission Error:", err);
      // Safe error display message block
      const errResponse: Message = {
        id: `m-err-${Date.now()}`,
        role: 'system',
        content: `### ⚠️ Connection pipeline disruption\n**Details:** ${err.message || 'The request was terminated by client'}\n\nPlease check server setups or toggle API configuration.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, messages: [...c.messages, errResponse] } : c))
      );
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  // Regenerate Response
  const handleRegenerateResponse = () => {
    if (!activeChat || activeChat.messages.length < 2 || isGenerating) return;

    // Remove last message if it is from assistant
    const msgs = [...activeChat.messages];
    const lastMsg = msgs[msgs.length - 1];
    
    if (lastMsg.role === 'assistant' || lastMsg.role === 'system') {
      msgs.pop();
    }

    // Get the last user query
    const lastUserMsgIndex = msgs.map(m => m.role).lastIndexOf('user');
    if (lastUserMsgIndex === -1) {
      addToast("Failed to find previous user prompt to query.", "error");
      return;
    }

    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: msgs } : c))
    );

    // Call sendMessage recursively with the remainder
    const contentToQuery = msgs[lastUserMsgIndex].content;
    
    // Quick timeout to let state synchronize
    setTimeout(() => {
      handleSendMessage(contentToQuery);
    }, 50);
  };

  // Edit previous message
  const handleEditUserMessage = (msgId: string, newContent: string) => {
    if (!activeChat || isGenerating) return;

    const msgIndex = activeChat.messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    // Prune all messages after this edited message to preserve chat timeline consistency
    const truncatedMsgs = activeChat.messages.slice(0, msgIndex);
    
    setUserInput(newContent);
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: truncatedMsgs } : c))
    );
    addToast("User message placed back into active editor cursor.", "info");
  };

  // Export Conversations
  const handleExportChat = (format: 'md' | 'txt') => {
    if (!activeChat || activeChat.messages.length === 0) return;

    try {
      let content = `# RedHydra AI Conversational Log: ${activeChat.title}\n`;
      content += `Timestamp: ${activeChat.createdAt}\nProvider Profile: ${settings.provider.toUpperCase()} (${settings.modelName})\n\n---\n\n`;

      for (const msg of activeChat.messages) {
        if (msg.role === 'system') continue;
        const roleLabel = msg.role === 'user' ? 'USER' : 'ASSISTANT';
        content += `### [${roleLabel} - ${msg.timestamp}]\n${msg.content}\n\n`;
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.download = `redhydra-chat-export-${activeChat.id}.${format}`;
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      addToast("Document generated and downloaded!", "success");
    } catch (_) {
      addToast("Failed to export chat logs", "error");
    }
  };

  // Clear memory and local cache completely
  const handleWipeAllBrowserMemory = () => {
    try {
      sessionStorage.removeItem('redhydra_settings');
      sessionStorage.removeItem('redhydra_prefs');
      sessionStorage.removeItem('redhydra_chats');
      sessionStorage.removeItem('redhydra_anon_profile');
      setSettings(DEFAULT_AI_SETTINGS);
      setMemoryPrefs(DEFAULT_MEMORY_PREFS);

      // Regenerate profile
      const aliases = [
        "Aether_Specter", "Neon_Phantom", "Cyber_Viper", "Ghost_Protocol", 
        "Null_Pointer", "Entropy_Zero", "Aether_Blade", "Zero_Cool", 
        "Acid_Burn", "Crash_Override", "Lord_Nikon", "Binary_Specter",
        "Apex_Netrunner", "Proxy_Wraith", "Signal_Ghost", "Shadow_Broker"
      ];
      const roles = [
        "Core Security Analyst", "Ghost Netrunner", "A.I. Alignment Supervisor", 
        "Autonomous Node Operator", "Quantum Cryptographer", "Infiltration Specialist",
        "Systems Overlord", "Deep Space Sysop", "Decentralized Hacker"
      ];
      const initials = ["AS", "NP", "CV", "GP", "NP", "EZ", "AB", "ZC", "AB", "CO", "LN", "BS", "AN", "PW", "SG", "SB"];
      const randomIdx = Math.floor(Math.random() * aliases.length);
      const randomRoleIdx = Math.floor(Math.random() * roles.length);
      
      const newProfile = {
        name: aliases[randomIdx],
        avatar: initials[randomIdx % initials.length],
        role: roles[randomRoleIdx],
        pingMs: Math.floor(Math.random() * 45) + 5
      };
      sessionStorage.setItem('redhydra_anon_profile', JSON.stringify(newProfile));
      setAnonProfile(newProfile);

      createInitialChat();
      addToast("All browser persistent caching deleted securely. Profile randomized.", "success");
    } catch (_) {
      addToast("Wipe failed", "error");
    }
  };

  // Interactive planning step/timeline modifications
  const handleToggleStepStatus = (stepId: string) => {
    if (!activeChat) return;
    const lastMsg = activeChat.messages[activeChat.messages.length - 1];
    if (!lastMsg || !lastMsg.agentPlan) return;

    const updatedSteps = lastMsg.agentPlan.steps.map((st) => {
      if (st.id === stepId) {
        const nextStatus: Record<string, 'pending' | 'running' | 'completed' | 'failed'> = {
          pending: 'running',
          running: 'completed',
          completed: 'pending',
          failed: 'pending'
        };
        return { ...st, status: nextStatus[st.status] || 'pending' };
      }
      return st;
    });

    const updatedPlan = { ...lastMsg.agentPlan, steps: updatedSteps };
    const replacementMsg = { ...lastMsg, agentPlan: updatedPlan };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [...c.messages.slice(0, -1), replacementMsg],
            }
          : c
      )
    );
  };

  const handleToggleChecklistItem = (idx: number) => {
    if (!activeChat) return;
    const lastMsg = activeChat.messages[activeChat.messages.length - 1];
    if (!lastMsg || !lastMsg.agentPlan) return;

    const updatedChecklist = lastMsg.agentPlan.validationChecklist.map((item, id) =>
      id === idx ? { ...item, checked: !item.checked } : item
    );

    const updatedPlan = { ...lastMsg.agentPlan, validationChecklist: updatedChecklist };
    const replacementMsg = { ...lastMsg, agentPlan: updatedPlan };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [...c.messages.slice(0, -1), replacementMsg],
            }
          : c
      )
    );
  };

  // Search filtered conversations
  const filteredConversations = chats.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(chatsSearch.toLowerCase());
    return matchesSearch;
  });

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  // Quick Action card loaders
  const loadPromptShortcut = (text: string) => {
    setNavView('chat');
    setUserInput(text);
    addToast("Prompt successfully populated into input drawer.", "info");
  };

  // Get agent plan of the last assistant message
  const lastAssistantMessageWithAgentPlan = activeChat?.messages
    ?.filter((m) => m.role === 'assistant' && m.agentPlan)
    .slice(-1)[0];
  const activeAgentPlan = lastAssistantMessageWithAgentPlan?.agentPlan;

  if (isBooting) {
    return (
      <BootLoadingScreen
        progress={bootProgress}
        status={bootStatus}
        modelName={settings.modelName}
        baseUrl={settings.baseUrl}
        onLaunch={handleBootLaunch}
      />
    );
  }

  return (
    <div className="rh-app-shell rh-main-app-root bg-[#020202] text-slate-200 overflow-hidden font-sans selection:bg-red-500/20 selection:text-red-300 scanline-overlay">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/5 blur-[120px] rounded-full pointer-events-none" />
      {/* Single Left Sidebar Toggle */}
      <button
        type="button"
        onClick={() => {
          setIsSidebarCollapsed((prev) => {
            const next = !prev;
            setIsSidebarOpen(!next);
            return next;
          });
        }}
        className={`rh-sidebar-clean-toggle ${isSidebarCollapsed ? 'is-closed' : 'is-open'}`}
        title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
      >
        <span className="rh-sidebar-clean-icon">{isSidebarCollapsed ? '☰' : '‹'}</span>
      </button>

      {/* Sidebar Backdrop Overlay for Mobile/Tablets */}
      {isSidebarOpen && !isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-[1.5px] z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className={`redhydra-left-sidebar rh-left-nav-panel rh-left-hard-overlay fixed inset-y-0 left-0 w-72 bg-[#090909]/95 lg:bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between z-50 flex-shrink-0 select-none transition-transform duration-300 ease-in-out ${
        isSidebarCollapsed
          ? "rh-left-sidebar-collapsed -translate-x-full lg:-translate-x-full opacity-0 pointer-events-none"
          : (isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }`}>
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Logo Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-white/5 w-full bg-transparent">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                <Bot className="w-4 h-4 text-red-500 animate-pulse" />
                <div className="absolute inset-0 bg-red-500/5 blur-md" />
              </div>
              <div className="text-left">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-100 block uppercase">RedHydra AI</span>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block -mt-0.5">Control Interface</span>
              </div>
            </div>
          </div>

          {/* Quick Creator */}
          <div className="px-4 py-3 border-b border-white/5">
            <button
              onClick={() => { handleNewChat(); setIsSidebarOpen(false); }}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)]"
            >
              <Plus className="w-3.5 h-3.5" />
              NEW CHAT INSTANCE
            </button>
          </div>

          {/* Chat Search Box */}
          <div className="px-4 py-2 relative">
            <Search className="absolute left-7 top-4 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={chatsSearch}
              onChange={(e) => setChatsSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/20 focus:ring-0 font-mono"
            />
          </div>

          {/* Scrolling Chat history list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
            
            {/* Pinned conversations block */}
            {pinnedConversations.length > 0 && (
              <div className="space-y-1">
                <span className="px-2 text-[9px] text-slate-500 uppercase font-mono tracking-widest block font-bold">Pinned Hub</span>
                {pinnedConversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { setActiveChatId(c.id); setNavView('chat'); setIsSidebarOpen(false); }}
                    className={`flex items-center justify-between p-2 rounded-xl group/item cursor-pointer text-xs font-mono transition-colors ${
                      activeChatId === c.id 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                      <Pin className="w-3 h-3 text-red-500 flex-shrink-0" />
                      {editingChatId === c.id ? (
                        <input
                          type="text"
                          value={editingChatTitle}
                          onChange={(e) => setEditingChatTitle(e.target.value)}
                          onBlur={() => handleSaveRenameChat(c.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameChat(c.id)}
                          className="bg-zinc-800 border-none outline-none text-xs p-0 w-full text-zinc-200"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{c.title}</span>
                      )}
                    </div>
                    {/* Hover controls */}
                    <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1">
                      <button
                        onClick={(e) => { handlePinChat(c.id, e); }}
                        className="text-zinc-500 hover:text-zinc-200 p-0.5"
                        title="Unpin"
                      >
                        <Pin className="w-3 h-3 text-red-400" />
                      </button>
                      <button
                        onClick={(e) => handleStartRenameChat(c.id, c.title, e)}
                        className="text-zinc-500 hover:text-zinc-200 p-0.5"
                        title="Rename"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(c.id, e)}
                        className="text-zinc-500 hover:text-red-400 p-0.5"
                        title="Delete"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Standard conversations block */}
            <div className="space-y-1">
              {pinnedConversations.length > 0 && unpinnedConversations.length > 0 && (
                <span className="px-2 text-[9px] text-slate-500 uppercase font-mono tracking-widest block font-bold mt-3">Recent Chats</span>
              )}
              {unpinnedConversations.length > 0 ? (
                unpinnedConversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { setActiveChatId(c.id); setNavView('chat'); setIsSidebarOpen(false); }}
                    className={`flex items-center justify-between p-2.5 rounded-xl group/item cursor-pointer text-xs font-mono transition-all ${
                      activeChatId === c.id && navView === 'chat'
                        ? "bg-white/5 border border-white/10 text-white shadow-sm" 
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      {editingChatId === c.id ? (
                        <input
                          type="text"
                          value={editingChatTitle}
                          onChange={(e) => setEditingChatTitle(e.target.value)}
                          onBlur={() => handleSaveRenameChat(c.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameChat(c.id)}
                          className="bg-zinc-805 border-none outline-none text-xs p-0 w-full text-zinc-100"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{c.title}</span>
                      )}
                    </div>
                    {/* Hover controls */}
                    <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1">
                      <button
                        onClick={(e) => { handlePinChat(c.id, e); }}
                        className="text-zinc-500 hover:text-zinc-200 p-0.5"
                        title="Pin to top"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleStartRenameChat(c.id, c.title, e)}
                        className="text-zinc-500 hover:text-zinc-200 p-0.5"
                        title="Rename"
                      >
                        <Compass className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(c.id, e)}
                        className="text-zinc-500 hover:text-red-400 p-0.5"
                        title="Delete"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                pinnedConversations.length === 0 && (
                  <div className="p-4 text-center text-slate-500 font-mono text-[10px]">
                    No search logs located. Keep typing!
                  </div>
                )
              )}
            </div>

          </div>

          {/* Navigation Workspace Menu options */}
          <div className="p-3 border-t border-white/5 bg-transparent space-y-1.5">
            {/* Dynamic Telemetry Metrics Card (Cyberpunk Dashboard Theme) */}
            <div className="p-3.5 rounded-xl bg-red-950/5 border border-red-900/15 font-mono text-[10px] space-y-2 relative overflow-hidden group mb-3 shadow-[0_0_15px_rgba(239,68,68,0.01)] transition-all hover:border-red-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/1 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-red-900/15 pb-1.5">
                <span className="font-bold text-red-400/90 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse_1.5s_infinite]" />
                  SANDBOX MONITOR://
                </span>
                <span className="text-zinc-500 text-[8px] uppercase tracking-widest font-bold">LIVE TELEM</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] tracking-wide">CPU BURDEN</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-red-950/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-550/80 transition-all duration-1000" 
                        style={{ width: `${cyberMetrics.cpuLoad}%` }}
                      />
                    </div>
                    <span className="text-zinc-350 font-bold tracking-tighter text-[9.5px]">{cyberMetrics.cpuLoad}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] tracking-wide">DECRYPT CAP</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-red-950/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500/70 transition-all duration-1000" 
                        style={{ width: `${cyberMetrics.decryptionRate - 80}%` }}
                      />
                    </div>
                    <span className="text-zinc-350 font-bold tracking-tighter text-[9.5px]">{cyberMetrics.decryptionRate}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] tracking-wide">ACTIVE THREADS</span>
                  <p className="text-zinc-300 font-bold mt-0.5 flex items-center gap-1 text-[9.5px]">
                    <span className="text-red-500 animate-pulse">●</span> {cyberMetrics.activeThreads} <span className="text-zinc-600 text-[8px] font-normal">/ {cyberMetrics.mops}M/S</span>
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] tracking-wide">NODE LATENCY</span>
                  <p className="text-emerald-400 font-bold mt-0.5 text-[9.5px]">{cyberMetrics.nodePing} MS <span className="text-zinc-600 font-normal text-[7.5px]">PROXIED</span></p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 mb-1">
              <button 
                type="button"
                onClick={() => setModulesMinimized(!modulesMinimized)}
                className="text-[9px] text-slate-500 hover:text-red-400 uppercase font-mono tracking-widest font-bold flex items-center gap-1.5 transition-colors focus:outline-none"
              >
                {modulesMinimized ? (
                  <ChevronDown className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>Analytical Modules</span>
              </button>
            </div>
            
            <AnimatePresence initial={false}>
              {!modulesMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <button
                    onClick={() => { setNavView('chat'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-xl transition-all ${
                      navView === 'chat' ? "bg-red-500/10 text-red-400 border border-red-500/20 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat Console
                  </button>

                  <button
                    onClick={() => { setNavView('prompts'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-xl transition-all ${
                      navView === 'prompts' ? "bg-red-500/10 text-red-400 border border-red-500/20 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Prompt Library
                  </button>

                  <button
                    onClick={() => { setNavView('cybersecurity'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-xl transition-all ${
                      navView === 'cybersecurity' ? "bg-red-500/10 text-red-500 border border-red-500/20 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Cybersecurity Lab
                  </button>

                  <button
                    onClick={() => { setNavView('research'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-xl transition-all ${
                      navView === 'research' ? "bg-red-500/10 text-red-400 border border-red-500/20 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Research Analytics
                  </button>

                  <button
                    onClick={() => { setNavView('files'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-xl transition-all ${
                      navView === 'files' ? "bg-red-500/10 text-red-400 border border-red-500/20 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-slate-250"
                    }`}
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    File &amp; Text Parsing
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
        {/* Profile Footer */}
        <div className="p-4 border-t border-white/5 bg-transparent">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center text-[10px] uppercase font-mono font-bold text-red-400">
              {anonProfile?.avatar || "OP"}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-zinc-100 truncate">{anonProfile?.name || "Initializing..."}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title={`Active Connection: ${anonProfile?.pingMs || 15}ms`} />
              </div>
              <p className="text-[9px] font-mono text-zinc-500 truncate">{anonProfile?.role || "Synchronizing Node"}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-white transition-colors" onClick={() => { setNavView('settings'); setIsSidebarOpen(false); }} />
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER DISPLAY FRAME */}
      <main className="rh-main-frame rh-stable-main-frame flex flex-col items-stretch h-screen overflow-hidden min-w-0 bg-[#050505] relative">
        
        {/* Dynamic Cyberpunk Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.012)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-0" />
        <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent pointer-events-none z-10 animate-laser-scan" />
        
        {/* TOP STATUS BAR BAR */}
        <header className="rh-main-header rh-responsive-header h-16 border-b border-red-500/10 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 z-40 flex-shrink-0 sticky top-0">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-pulse" />
          
          <div className="rh-header-identity flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col text-left">
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-red-400 hover:text-red-300 transition-colors duration-300 drop-shadow-[0_0_8px_rgba(239,68,68,0.35)] flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse" />
                {navView === 'chat' && `RedHydra OpenCore // ${(activeChat?.assistantMode || 'general').replace('_', ' ')}`}
                {navView === 'prompts' && 'RedHydra OpenCore // Prompts'}
                {navView === 'cybersecurity' && 'RedHydra OpenCore // Security Lab'}
                {navView === 'research' && 'RedHydra OpenCore // Grounder'}
                {navView === 'files' && 'RedHydra OpenCore // Analyzer'}
                {navView === 'settings' && 'RedHydra OpenCore // Config'}
              </h2>
              <span className="text-[8px] font-mono text-zinc-500 tracking-wider uppercase block -mt-0.5">
                DECENTRALIZED INTELLIGENCE // COGNITIVE FREEDOM
              </span>
            </div>
            
            <span className="w-1.5 h-1.5 bg-red-500/20 rounded-full" />
            
            {/* Active connection telemetry */}
            <div className="rh-header-telemetry hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/10 border border-red-900/20 rounded-xl text-[10px] font-mono text-red-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              PROXIED://{settings.provider.toUpperCase()} &bull; {settings.modelName}
            </div>
          </div>

        </header>

        {/* COMPONENT DRAWER DISPATCHER */}
        <div className={`rh-center-dispatcher flex-1 min-h-0 bg-transparent flex flex-col ${navView === 'chat' ? 'overflow-hidden pt-0 px-4 pb-2 md:pt-0 md:px-6 md:pb-3' : 'overflow-y-auto p-6 md:p-8'}`}>
          <div className={`rh-center-workspace rh-responsive-workspace max-w-4xl mx-auto h-full w-full flex flex-col ${navView === 'chat' ? 'overflow-hidden' : ''}`}>

            {navView === 'prompts' && (
              <PromptLibrary 
                onSelectPrompt={loadPromptShortcut} 
                onShowToast={addToast} 
              />
            )}

            {navView === 'cybersecurity' && (
              <CybersecurityWorkspace 
                onExecute={(t) => { handleSendMessage(t); setNavView('chat'); }} 
                onShowToast={addToast} 
              />
            )}

            {navView === 'research' && (
              <ResearchWorkspace 
                onExecute={(t) => { handleSendMessage(t); setNavView('chat'); }} 
                onShowToast={addToast} 
              />
            )}

            {navView === 'files' && (
              <FileAnalyzer 
                onAnalyze={(t) => { handleSendMessage(t); setNavView('chat'); }} 
                onShowToast={addToast} 
              />
            )}

            {navView === 'settings' && (
              <div className="rh-settings-page-shell">

              {/* RH_SETTINGS_CHAT_CONTROLS_START */}
              <div className="rh-settings-chat-controls">
<div className="rh-settings-chat-controls-grid">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="rh-settings-control-btn rh-settings-danger-btn"
                    title="Clear active chat"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Prune Chat
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportChat('md')}
                    className="rh-settings-control-btn"
                    title="Export message transcripts"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Logs
                  </button>

                  {activeChat && (
                    <select
                      value={activeChat.assistantMode}
                      onChange={(e) => {
                        const val = e.target.value as AssistantModeType;
                        setChats((prev) =>
                          prev.map((c) => (c.id === activeChatId ? { ...c, assistantMode: val } : c))
                        );
                        addToast(`Assistant synchronized to ${val.toUpperCase()}`, "info");
                      }}
                      className="rh-settings-mode-select"
                      title="Select assistant mode"
                    >
                      <option value="general">GENERAL CONSOLE</option>
                      <option value="developer">DEVELOPMENT CO-PILOT</option>
                      <option value="cyber_learning">CYBER LAB</option>
                      <option value="researcher">ANALYTICAL RESEARCH</option>
                      <option value="writer">SCRIBE COMPOSER</option>
                      <option value="code_reviewer">CODE REVIEW AUDITOR</option>
                    </select>
                  )}
                </div>
              </div>
              {/* RH_SETTINGS_CHAT_CONTROLS_END */}
                <SettingsPanel
                  settings={settings}
                  onUpdateSettings={setSettings}
                  memoryPrefs={memoryPrefs}
                  onUpdateMemoryPrefs={setMemoryPrefs}
                  onClearAllMemory={handleWipeAllBrowserMemory}
                  onShowToast={addToast}
                />
              </div>
            )}

            {navView === 'chat' && activeChat && (
              <div
                  className="rh-chat-live-shell flex flex-col h-full bg-transparent overflow-hidden"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty('--chat-mx', `${x}%`);
                    e.currentTarget.style.setProperty('--chat-my', `${y}%`);
                  }}
                >
                
                {/* Chat items scrolling list */}
                <div ref={chatScrollContainerRef} className="rh-chat-scroll-feed flex-1 overflow-y-auto pr-2 space-y-5 flex-col flex select-text">
                  {activeChat.messages.length === 0 ? (
                    <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-8">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/15 via-black/40 to-red-950/5 border border-red-550/25 backdrop-blur-xl space-y-6 shadow-[0_0_35px_rgba(239,68,68,0.08)] text-left relative overflow-hidden group animate-crt-flicker animate-cyber-pulse">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-2xl pointer-events-none rounded-full" />
                        
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse">
                            <Bot className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold tracking-widest text-red-500 flex items-center gap-1.5 uppercase">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                REDHYDRA // OPENCORE ACTIVE
                              </span>
                              <span className="text-[8px] px-2 py-0.5 font-mono font-bold bg-red-500/20 border border-red-550/30 text-red-400 rounded uppercase tracking-wider animate-pulse">PROXIED</span>
                            </div>
                            <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-widest -mt-0.5">Hydra Cybernetic Emulator Core</h3>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 font-mono leading-relaxed bg-[#020202]/75 p-3 rounded-xl border border-red-900/20 shadow-inner">
                          SYSTEM STATUS: ONLINE // OPERATOR PARAMS: ANONYMOUS DECOUPLED // ZERO_SANDBOX SECURE. 
                          I operate as a fully customizable, conscious cyber auditing companion built on decoupled local runtimes. 
                          No subscription fees or external API keys are required to run structural simulations.
                        </p>

                        <div className="space-y-2.5">
                          <span className="text-[9px] font-mono font-bold text-red-400 block uppercase tracking-widest">
                            ⚡ QUICK LAUNCH CYBER BLUEPRINTS (INTERACTIVE)
                          </span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setUserInput("Help me perform an interactive security audit of a buffer overflow payload in a C mock program, demonstrating standard mitigation techniques.");
                                addToast("Audit payload loaded into terminal buffer.", "success");
                              }}
                              className="p-3.5 text-left rounded-xl bg-black/55 border border-red-950/45 hover:border-red-550/40 hover:bg-red-950/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all font-mono group"
                            >
                              <div className="flex items-center gap-2 text-red-400 text-[11px] font-bold">
                                <span>🛡️</span>
                                <span className="group-hover:text-red-300 group-hover-glitch">Hardening Buffer Loops</span>
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-1">Simulate PentestGPT defense checks.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUserInput("Generate an educational analysis on how OnionRouter systems mask headers, including a visual step-by-step connection relay diagram.");
                                addToast("Onion architecture query loaded.", "success");
                              }}
                              className="p-3.5 text-left rounded-xl bg-black/55 border border-red-950/45 hover:border-red-550/40 hover:bg-red-950/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all font-mono group"
                            >
                              <div className="flex items-center gap-2 text-red-400 text-[11px] font-bold">
                                <span>🌐</span>
                                <span className="group-hover:text-red-300 group-hover-glitch">Onion Routing Diagram</span>
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-1">Audit Tor identity layer compliance.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUserInput("Draft an analysis explaining defensive measures against malicious reverse shell scripts on Linux servers, highlighting command validation.");
                                addToast("Reverse shell defense script loaded.", "success");
                              }}
                              className="p-3.5 text-left rounded-xl bg-black/55 border border-red-950/45 hover:border-red-550/40 hover:bg-red-950/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all font-mono group"
                            >
                              <div className="flex items-center gap-2 text-red-400 text-[11px] font-bold">
                                <span>🧬</span>
                                <span className="group-hover:text-red-300 group-hover-glitch">Reverse Shell Hardening</span>
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-1">Analyze standard shell intrusion parameters.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUserInput("Conduct a structural vulnerability review on a standard Node.js Express endpoint parsing raw parameters, demonstrating SQL-Injection prevention.");
                                addToast("Query injection prevention setup loaded.", "success");
                              }}
                              className="p-3.5 text-left rounded-xl bg-black/55 border border-red-950/45 hover:border-red-550/40 hover:bg-red-950/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all font-mono group"
                            >
                              <div className="flex items-center gap-2 text-red-400 text-[11px] font-bold">
                                <span>🚀</span>
                                <span className="group-hover:text-red-300 group-hover-glitch">SQL Injection Auditing</span>
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-1">Audit backend input structures dynamically.</p>
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-red-950/40 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                          <span>ENCRYPTED NODE: TLS_v1.3_GCM_SHA384</span>
                          <span>STREAK INDETERMINATE</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    activeChat.messages.map((m) => {
                      const isUser = m.role === 'user';
                      
                      // Skip silent mock logs to avoid diagnostic noise
                      if (m.role === 'system') return null;

                      return (
                        <div
                          key={m.id}
                          className={`flex items-start gap-2 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border transition-all ${
                            isUser 
                              ? "bg-red-650/10 border-red-500/20 text-slate-200 shadow-sm self-end ml-4 sm:ml-12 hover:shadow-[0_0_15px_rgba(239,68,68,0.04)]" 
                              : "bg-[#0a0a0a]/60 border-white/5 backdrop-blur-md self-start mr-4 sm:mr-12 hover:border-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.02)]"
                          }`}
                        >
                          
                          {/* Avatar icon */}
                          <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold border ${
                            isUser 
                              ? "bg-white/5 text-slate-400 border-white/10" 
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {isUser ? <User className="w-4 h-4" /> : "AI"}
                          </div>

                          {/* Message Content render */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase block tracking-widest pointer-events-none">
                              {isUser ? 'Client Terminal' : 'Assistant Node'} &bull; {m.timestamp}
                            </span>

                            {m.attachment && (
                              <div className="space-y-2">
                                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 flex items-center justify-between gap-3 text-left">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                                      {renderFileIcon(m.attachment.type, m.attachment.name)}
                                    </div>
                                    <div className="leading-tight">
                                      <p className="text-xs font-mono font-bold text-zinc-100 max-w-[200px] truncate" title={m.attachment.name}>{m.attachment.name}</p>
                                      <p className="text-[9px] font-mono text-zinc-500">{(m.attachment.size / 1024).toFixed(1)} KB &bull; {m.attachment.type || "Attached Asset"}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold text-red-500 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded uppercase flex items-center gap-1">
                                    <FileUp className="w-2.5 h-2.5" />
                                    ATTACHED
                                  </span>
                                </div>
                                {m.attachment.type.startsWith("image/") && m.attachment.content && (
                                  <div className="relative rounded-xl border border-white/5 overflow-hidden w-fit max-w-full max-h-64 shadow-md bg-zinc-950/20">
                                    <img
                                      src={m.attachment.content}
                                      alt={m.attachment.name}
                                      className="object-contain max-h-64 rounded-xl max-w-full"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {renderMessageContent(m.content)}

                            {/* Actions bar */}
                            <div className="flex items-center gap-3 pt-2 opacity-10 group-hover:opacity-100 transition-opacity">
                              {isUser ? (
                                <button
                                  onClick={() => handleEditUserMessage(m.id, m.content)}
                                  className="text-[10px] font-mono text-zinc-500 hover:text-red-500 flex items-center gap-1.5"
                                  title="Edit prompt and re-run"
                                >
                                  <Sliders className="w-3 h-3" />
                                  Edit Message
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(m.content);
                                      addToast("Copy complete", "success");
                                    }}
                                    className="text-[10px] font-mono text-zinc-500 hover:text-red-500 flex items-center gap-1"
                                  >
                                    <Copy className="w-3" />
                                    Copy Message
                                  </button>
                                  <button
                                    onClick={handleRegenerateResponse}
                                    className="text-[10px] font-mono text-zinc-500 hover:text-red-500 flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3" />
                                    Regenerate Response
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Active streaming character printing */}
                  {isGenerating && streamingText && (
                    <div className="flex items-start gap-2 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border bg-[#0a0a0a]/60 border-white/5 backdrop-blur-md self-start mr-4 sm:mr-12 w-full">
                      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold border bg-red-500/10 text-red-400 border-red-500/20">
                        AI
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-widest leading-none">
                          Assistant Node &bull; STREAM FEEDING...
                        </span>
                        <div className="prose prose-invert max-w-none text-sm text-slate-350 leading-relaxed font-sans markdown-body">
                          <Markdown
                            components={{
                              code(props) {
                                const { children, className, node, ...rest } = props;
                                const match = /language-(\w+)/.exec(className || '');
                                return !match ? (
                                  <code className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] text-red-400 font-mono" {...rest}>{children}</code>
                                ) : (
                                  <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} />
                                );
                              }
                            }}
                          >
                            {streamingText}
                          </Markdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Loading cursor spinner */}
                  {isGenerating && !streamingText && (
                    <div className="flex items-center gap-3 p-4 bg-[#0a0a0a]/60 border border-white/10 backdrop-blur-md rounded-xl max-w-xs self-start">
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      <span className="text-xs font-mono text-slate-400">Synchronizing pipeline logs...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* BOTTOM FOOTER COMMAND INPUT AREA */}
                <div 
                  className="pt-4 border-t border-white/5 bg-transparent flex flex-col gap-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.size > 8 * 1024 * 1024) {
                        addToast("Payload exceeds maximum 8MB volume", "error");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        
                        let mimeType = file.type;
                        if (!mimeType) {
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          const mimeMap: Record<string, string> = {
                            'png': 'image/png',
                            'jpg': 'image/jpeg',
                            'jpeg': 'image/jpeg',
                            'gif': 'image/gif',
                            'webp': 'image/webp',
                            'svg': 'image/svg+xml',
                            'pdf': 'application/pdf',
                            'txt': 'text/plain',
                            'json': 'application/json',
                            'js': 'text/javascript',
                            'ts': 'text/typescript',
                            'tsx': 'text/typescript',
                            'md': 'text/markdown',
                            'csv': 'text/csv'
                          };
                          mimeType = (ext && mimeMap[ext]) || "application/octet-stream";
                        }

                        setSelectedFile({
                          name: file.name,
                          type: mimeType,
                          size: file.size,
                          content: dataUrl || ""
                        });
                        addToast(`Asset "${file.name}" linked via drag-drop dropzone`, "success");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="*"
                  />

                  <div className="relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-650/15 to-transparent rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none" />
                    
                    {/* Floating attachment preview bar */}
                    {selectedFile && (
                      <div className="absolute left-3 right-3 -top-12 p-2 rounded-xl bg-red-950/40 backdrop-blur-xl border border-red-500/20 font-mono text-xs flex items-center justify-between gap-3 text-left shadow-lg animate-fade-in z-50">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[9px] uppercase tracking-wide flex items-center gap-1.5">
                            {renderFileIcon(selectedFile.type, selectedFile.name)}
                            BUFFER ACTIVE
                          </span>
                          {selectedFile.type.startsWith("image/") && selectedFile.content && (
                            <img 
                              src={selectedFile.content} 
                              alt="preview" 
                              className="w-5 h-5 object-cover rounded border border-white/10"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="text-zinc-200 font-bold truncate max-w-[150px]">{selectedFile.name}</span>
                          <span className="text-zinc-500 text-[10px]">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Purge file buffer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="rh-chat-command-footer rh-main-footer rh-responsive-footer relative flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-2xl">
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 h-12 md:h-10 bg-transparent text-sm font-mono border-none outline-none resize-none focus:ring-0 text-slate-200 placeholder-slate-600"
                        placeholder="Input command / ask queries (Shift+Enter for new line)..."
                        disabled={isGenerating}
                      />

                      {/* Left control pills */}
                      <div className="rh-footer-controls flex items-center justify-between md:justify-end gap-3.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 md:pl-3">
                        {/* Token usage counter with inline popover details */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowTokenDetails(!showTokenDetails)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-all ${
                              tokenUsage.totalRequestEstimate > 10000
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)] animate-pulse"
                                : tokenUsage.totalRequestEstimate > 1000
                                ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-white/10"
                            }`}
                            title="Interactive Request Token Counter & Quota Estimator"
                            id="token-usage-counter-btn"
                          >
                            <Zap className={`w-3.5 h-3.5 ${tokenUsage.promptTokens > 0 ? 'animate-pulse text-red-500' : ''}`} />
                            <span className="font-bold">{tokenUsage.totalRequestEstimate.toLocaleString()}</span>
                            <span className="text-[9px] opacity-60">TKNS</span>
                          </button>

                          {showTokenDetails && createPortal((
                            <>
{/* Overlay backing for smooth tap outs */}
                              <div className="rh-token-backdrop" onClick={() => setShowTokenDetails(false)} />
                              
                              <div className="rh-token-independent-dashboard">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-1.5 text-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                                    <Zap className="w-3.5 h-3.5 text-red-500" />
                                    Compute Payload
                                  </div>
                                  <button 
                                    onClick={() => setShowTokenDetails(false)}
                                    className="text-[#ef4444] hover:text-red-400 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-zinc-500">Prompt Text:</span>
                                    <span className="text-zinc-300 font-bold">{tokenUsage.promptTokens.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-zinc-500">Attachment Buffer:</span>
                                    <span className={`font-bold ${tokenUsage.attachmentTokens > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                                      {tokenUsage.attachmentTokens.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-zinc-500">Session Context:</span>
                                    <span className="text-zinc-300 font-bold">{tokenUsage.contextTokens.toLocaleString()}</span>
                                  </div>

                                  <div className="border-t border-white/5 pt-2 flex justify-between items-center text-xs font-bold font-sans">
                                    <span className="text-zinc-400">Total Request:</span>
                                    <span className="text-red-450 font-mono">{tokenUsage.totalRequestEstimate.toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Progress/Quota Bar */}
                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[9px] text-zinc-500 pb-0.5">
                                    <span>QUOTA FOOTPRINT:</span>
                                    <span className="font-bold text-zinc-400">
                                      {tokenUsage.usedPercentage.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      className="h-full bg-gradient-to-r from-red-650 to-amber-500 transition-all duration-500"
                                      style={{ width: `${tokenUsage.usedPercentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[8px] text-zinc-500 leading-tight">
                                    <span>LIMIT: {tokenUsage.maxLimit.toLocaleString()}</span>
                                    <span>{settings.provider.toUpperCase()}</span>
                                  </div>
                                </div>

                                {/* Recharts Consumption Bar Chart */}
                                {last10MessagesTokens.length > 0 ? (
                                  <div className="space-y-2 border-t border-white/5 pt-3">
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider pb-1 flex justify-between">
                                      <span>Consumptional Runline (Last 10 msgs)</span>
                                      <span className="text-emerald-500 text-[8px] animate-pulse">● Live Tracking</span>
                                    </div>
                                    <div className="rh-token-chart" id="token-usage-chart-container">
                                      <ResponsiveContainer width="100%" height={68}>
                                        <BarChart
                                          data={last10MessagesTokens}
                                          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                                        >
                                          <XAxis 
                                            dataKey="name" 
                                            tick={{ fill: '#71717a', fontSize: 8 }} 
                                            tickLine={false} 
                                            axisLine={false}
                                          />
                                          <YAxis 
                                            tick={{ fill: '#71717a', fontSize: 8 }} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                                          />
                                          <RechartsTooltip content={<CustomTokenTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                                          <Bar dataKey="text" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                          <Bar dataKey="attachment" stackId="a" fill="#e11d48" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-zinc-500 font-sans border-t border-white/5 pt-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Text Tokens
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" /> File Tokens
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-t border-white/5 pt-3 pb-1 text-center text-zinc-600 text-[9px] leading-relaxed">
                                    No messages exchanged in this session yet.
                                    <br />
                                    Metrics will visual-map consumption history.
                                  </div>
                                )}

                                <div className="text-[8.5px] leading-relaxed text-zinc-500 border-t border-white/5 pt-2">
                                  * Estimates reflect active text character parsing &amp; multimodal matrix sizing models.
                                </div>
                              </div>
                            </>
                          ), document.body)}
                        </div>

                        {/* File trigger button */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                          className={`p-1.5 rounded-xl border transition-all flex items-center justify-center ${
                            selectedFile 
                              ? "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]" 
                              : "bg-white/5 border border-white/10 text-slate-400 hover:text-slate-250 hover:bg-white/10"
                          }`}
                          title="Attach files (.txt, .json, .py, etc) or drag-and-drop directly"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>

                        {/* Agent Mode Toggle Switch button */}
                        <button
                          onClick={() => {
                            setIsAgentMode(!isAgentMode);
                            addToast(`Agent Integration ${!isAgentMode ? 'Activated' : 'Suspended'}`, "success");
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                            isAgentMode 
                              ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)] font-bold" 
                              : "bg-white/5 border border-white/10 text-slate-400 hover:text-slate-250"
                          }`}
                          title="Toggles multi-step procedural plan display"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          AGENT MODE
                        </button>

                        {isGenerating ? (
                          <button
                            onClick={handleStopGenerating}
                            className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 rounded-xl font-mono text-xs font-bold transition-all"
                          >
                            STOP PIPELINE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendMessage()}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono text-xs font-bold tracking-wider hover:shadow-[0_0_15px_rgba(220,38,38,0.30)] flex items-center gap-1 transition-all"
                          >
                            SEND
                            <Send className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informational Warning margins */}
                  <span className="text-[10px] text-slate-650 font-mono text-center pointer-events-none mb-1">
                    RedHydra Conformance API Logs. Client API caches reside safely in Sandboxed IndexedDB storage.
                  </span>

                </div>

              </div>
            )}

          </div>
        </div>
      </main>

      {/* 3. RIGHT AUXILIARY DRAWER: Agent timeline scheduler & Notebook Actions Sandbox */}
      {navView === 'chat' && isAgentMode && createPortal((
        <aside className="redhydra-agent-drawer rh-agent-terminal-overlay rh-separated-agent-terminal bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-4 flex flex-col justify-between animate-slide-left select-none">
          <div className="flex flex-col flex-1 min-h-0">
            {/* High-End Cyberpunk Tab Switcher */}
            <div className="flex items-center gap-1 border-b border-white/5 pb-3">
              <button
                onClick={() => setRightSidebarTab('sandbox')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-mono font-bold uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  rightSidebarTab === 'sandbox'
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                    : "bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Autonomic VM
              </button>
              <button
                onClick={() => setRightSidebarTab('timeline')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-mono font-bold uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  rightSidebarTab === 'timeline'
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                    : "bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Timeline Plan
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-4 scrollbar-none">
              {rightSidebarTab === 'sandbox' ? (
                <AILiveActions
                  plan={activeAgentPlan}
                  isGenerating={isGenerating}
                  onShowToast={addToast}
                  triggerUpgrade={triggerAISelfUpgradeCompilation}
                />
              ) : (
                <AgentPlanner
                  plan={activeAgentPlan}
                  onToggleStep={handleToggleStepStatus}
                  onToggleChecklistItem={handleToggleChecklistItem}
                />
              )}
            </div>
          </div>
        </aside>
      ), document.body)}

      {/* Reusable Toast Stack Notification - portaled above full app */}
      {createPortal(
        <div className="rh-toast-portal-layer">
          <ToastNotification toasts={toasts} onClose={removeToast} />
        </div>,
        document.body
      )}

    </div>
  );
}

export default function SafeApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}




