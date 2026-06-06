/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ViewType = 'chat' | 'agent' | 'prompts' | 'code' | 'research' | 'cybersecurity' | 'files' | 'settings';

export type ProviderType = 'built-in-opencore' | 'openai' | 'openrouter' | 'ollama' | 'custom';

export type AssistantModeType =
  | 'general'
  | 'developer'
  | 'cyber_learning'
  | 'researcher'
  | 'writer'
  | 'code_reviewer'
  | 'data_analyst'
  | 'study_tutor'
  | 'business'
  | 'creative_brainstormer';

export type ResponseStyleType = 'detailed' | 'concise' | 'structured' | 'bulleted';

export interface AISettings {
  provider: ProviderType;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string;
  personality: string;
  responseStyle: ResponseStyleType;
  safeMode: boolean;
  streaming: boolean;
  assistantMode: AssistantModeType;
  thinkingLevel?: 'auto' | 'high' | 'low' | 'minimal';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  attachment?: {
    name: string;
    type: string;
    size: number;
    content: string; // Base64 or plain textual content
  };
  // If agent mode is active, include structural sections
  agentPlan?: AgentPlan;
}

export interface AgentPlan {
  goal: string;
  understanding: string;
  steps: {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }[];
  output: string;
  validationChecklist: {
    text: string;
    checked: boolean;
  }[];
  limitations: string[];
  nextAction: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  assistantMode: AssistantModeType;
  viewContext?: ViewType; // e.g. cybersecurity, code, etc.
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  promptText: string;
  icon?: string;
}

export interface MemoryPrefs {
  savePreferences: boolean;
  saveTone: boolean;
  pinnedInstruction: string;
  recentChatsSaved: boolean;
  customPromptTemplates: PromptTemplate[];
}
