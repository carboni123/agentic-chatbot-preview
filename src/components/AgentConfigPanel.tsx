// src/components/AgentConfigPanel.tsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

export type ConversationStarter = 'user' | 'assistant';

export interface AgentConfigPanelProps {
    systemPrompt: string;
    onSystemPromptChange: (prompt: string) => void;

    conversationStarter: ConversationStarter;
    onConversationStarterChange: (starter: ConversationStarter) => void;
    firstMessageUser: string;
    onFirstMessageUserChange: (message: string) => void;
    firstMessageAssistant: string;
    onFirstMessageAssistantChange: (message: string) => void;

    onResetSessionAndApply: () => void;
    onSaveConversation: () => void;
    onLoadConversationClick: () => void;
    isLoading: boolean;
    onClose?: () => void;
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
    systemPrompt,
    onSystemPromptChange,
    conversationStarter,
    onConversationStarterChange,
    firstMessageUser,
    onFirstMessageUserChange,
    firstMessageAssistant,
    onFirstMessageAssistantChange,
    onResetSessionAndApply,
    onSaveConversation,
    onLoadConversationClick,
    isLoading,
    onClose,
}) => {
    return (
        <div className="p-4 flex flex-col h-full relative">
             <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Agent Settings</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden text-gray-500 hover:text-gray-800 p-1"
                        aria-label="Close settings"
                    ><FaTimes size={20} /></button>
                )}
            </div>

            <div className="flex-grow space-y-4">
                <div>
                    <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-800 mb-1">
                        Agent's System Prompt
                    </label>
                    <textarea
                        id="system-prompt"
                        rows={6}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono bg-white"
                        value={systemPrompt}
                        onChange={(e) => onSystemPromptChange(e.target.value)}
                        maxLength={16384}
                        placeholder="e.g., You are a helpful assistant."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                        Who Starts?
                    </label>
                    <div className="flex flex-col space-y-2 mt-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="conversationStarter"
                                value="user"
                                checked={conversationStarter === 'user'}
                                onChange={() => onConversationStarterChange('user')}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">User</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="conversationStarter"
                                value="assistant"
                                checked={conversationStarter === 'assistant'}
                                onChange={() => onConversationStarterChange('assistant')}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Assistant</span>
                        </label>
                    </div>
                </div>

                {conversationStarter === 'user' && (
                    <div>
                        <label htmlFor="first-message-user" className="block text-sm font-medium text-gray-800 mb-1">
                            User's First Message Template
                        </label>
                        <textarea
                            id="first-message-user"
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                            value={firstMessageUser}
                            onChange={(e) => onFirstMessageUserChange(e.target.value)}
                            maxLength={550}
                            placeholder="Enter the user's initial message..."
                        />
                    </div>
                )}

                {conversationStarter === 'assistant' && (
                    <div>
                        <label htmlFor="first-message-assistant" className="block text-sm font-medium text-gray-800 mb-1">
                            Assistant's First Message Template
                        </label>
                        <textarea
                            id="first-message-assistant"
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                            value={firstMessageAssistant}
                            onChange={(e) => onFirstMessageAssistantChange(e.target.value)}
                            maxLength={550}
                            placeholder="Enter the assistant's initial message..."
                        />
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 mt-6 space-y-3">
                <p className="text-xs text-gray-600 text-center">
                    Settings are applied when you reset the session.
                </p>
                <button
                    onClick={onLoadConversationClick}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Load Conversation
                </button>
                <button
                    onClick={onSaveConversation}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Conversation
                </button>
                <button
                    onClick={onResetSessionAndApply}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Processing...' : 'Reset Session & Apply Settings'}
                </button>
            </div>
        </div>
    );
};

export default AgentConfigPanel;