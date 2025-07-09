// src/AgenticChatbot.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import AgentConfigPanel from './components/AgentConfigPanel';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { generateMessageSid } from './utils/sidUtils';

import {
    Message,
    AgentConfig,
    ConversationData,
    AgenticChatbotProps,
} from './types';

// Default values, can be overridden by props
const DEFAULT_CONFIG: AgentConfig = {
    systemPrompt: 'You are a helpful AI assistant.',
    conversationStarter: 'assistant',
    firstMessageUser: "Hi, let's start a test conversation.",
    firstMessageAssistant: 'Hello! How can I help you today?',
};

export const AgenticChatbot: React.FC<AgenticChatbotProps> = ({
    backendConfig,
    initialSenderId,
    onSendMessage,
    onResetSession,
    onLoadConversation,
    initialConfig = {},
    initialMessages = [],
    customizationOptions = {},
    enableConfigPanel = true,
    onSenderIdChange,
    onConfigChange,
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [senderId, setSenderId] = useState<string>(initialSenderId);
    const [config, setConfig] = useState<AgentConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Connect to WebSocket for real-time agent messages
    useEffect(() => {
        const socket: Socket = io(backendConfig.socketUrl);
        socketRef.current = socket;

        const joinRoom = () => socket.emit('join', { senderNumber: senderId });
        socket.on('connect', joinRoom);
        socket.on('agent_message', (payload: { text: string; sid?: string }) => {
            const newMessage: Message = {
                sid: payload.sid || generateMessageSid(payload.text, 'B', 'BR'),
                text: payload.text,
                type: 'received',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                senderName: 'Agent',
            };
            setMessages(prev => [...prev, newMessage]);
        });

        return () => {
            socket.off('agent_message');
            socket.off('connect', joinRoom);
            socket.disconnect();
        };
    }, [senderId, backendConfig.socketUrl]);

    const addMessage = (message: Omit<Message, 'sid' | 'timestamp'>) => {
        const fullMessage: Message = {
            ...message,
            sid: generateMessageSid(message.text, 'U', 'UI'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, fullMessage]);
        return fullMessage;
    };

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        addMessage({ text, type: 'sent' });

        setIsLoading(true);
        setError(null);
        try {
            await onSendMessage(text, senderId, config);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [senderId, config, onSendMessage]);

    const initializeConversation = useCallback(async (performBackendReset: boolean) => {
        setIsLoading(true);
        setError(null);
        let currentDisplayMessages: Message[] = [];

        if (performBackendReset) {
            try {
                await onResetSession(senderId);
                const starterRoleName = config.conversationStarter === 'user' ? 'User' : 'Assistant';
                currentDisplayMessages.push({
                    sid: generateMessageSid('reset', 'S', 'SY'),
                    text: `Conversation reset. ${starterRoleName} will start.`,
                    type: 'system',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                });
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Backend reset failed.';
                setError(msg);
                currentDisplayMessages.push({ sid: generateMessageSid('reset-err', 'E', 'SY'), text: `Error: ${msg}`, type: 'system', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
                setMessages(currentDisplayMessages);
                setIsLoading(false);
                return;
            }
        }

        setMessages(currentDisplayMessages);

        if (config.conversationStarter === 'assistant' && config.firstMessageAssistant.trim()) {
            addMessage({ text: config.firstMessageAssistant, type: 'received', senderName: 'Agent' });
            setIsLoading(false);
        } else if (config.conversationStarter === 'user' && config.firstMessageUser.trim()) {
            await handleSendMessage(config.firstMessageUser);
        } else {
            setIsLoading(false);
        }
    }, [senderId, config, onResetSession, handleSendMessage]);

    const handleResetAndApply = useCallback(() => initializeConversation(true), [initializeConversation]);

    const handleSaveConversation = () => {
        try {
            const conversationData: ConversationData = {
                senderId: senderId,
                config: config,
                messages: messages,
                savedAt: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(conversationData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `conversation-${senderId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Could not save conversation to file.');
            console.error(err);
        }
    };

    const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (event.target) event.target.value = ''; // Allow re-loading
        if (!file) return;

        setIsLoading(true);
        setError(null);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string) as ConversationData;
                // Basic validation
                if (!data.senderId || !data.config || !Array.isArray(data.messages)) {
                    throw new Error('Invalid conversation file format.');
                }

                const loadedMessages = await onLoadConversation(data);

                setSenderId(data.senderId);
                setConfig(data.config);
                setMessages(loadedMessages);
                addMessage({ text: 'Conversation successfully loaded from file.', type: 'system' });

            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to load conversation.';
                setError(msg);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleConfigChange = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onConfigChange?.(newConfig);
    };

    const handleSenderIdChange = (newId: string) => {
        setSenderId(newId);
        onSenderIdChange?.(newId);
        initializeConversation(true);
    };

    return (
        <div className="relative flex w-full h-full bg-white overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleLoadFile} className="hidden" accept="application/json" />

            {isConfigPanelOpen && <div onClick={() => setIsConfigPanelOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" />}

            <div className="relative flex-grow flex flex-col h-full bg-[#f0f2f5]">
                <ChatHeader
                    backendUrl={backendConfig.respondUrl}
                    senderNumber={senderId}
                    onSenderNumberChange={handleSenderIdChange}
                    onToggleConfigPanel={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                    customizationOptions={customizationOptions}
                />
                <MessageList
                    messages={messages}
                    backendConfig={backendConfig}
                    customizationOptions={customizationOptions}
                />
                <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} error={error} />

                {enableConfigPanel && (
                    <button
                        onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                        className="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-gray-700 text-white p-2 rounded-l-md hover:bg-gray-800"
                        title={isConfigPanelOpen ? "Close Settings" : "Open Settings"}
                    >
                        {isConfigPanelOpen ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
                    </button>
                )}
            </div>

            {enableConfigPanel && (
                <div className={`bg-gray-100 border-l border-gray-300 transform transition-all duration-300 fixed top-0 right-0 z-30 w-full max-w-sm h-full lg:relative lg:flex-shrink-0 lg:transform-none ${isConfigPanelOpen ? 'translate-x-0 lg:w-full lg:max-w-sm' : 'translate-x-full lg:w-0'}`}>
                    <div className="h-full overflow-y-auto">
                        <AgentConfigPanel
                            systemPrompt={config.systemPrompt}
                            onSystemPromptChange={(val) => handleConfigChange('systemPrompt', val)}
                            conversationStarter={config.conversationStarter}
                            onConversationStarterChange={(val) => handleConfigChange('conversationStarter', val)}
                            firstMessageUser={config.firstMessageUser}
                            onFirstMessageUserChange={(val) => handleConfigChange('firstMessageUser', val)}
                            firstMessageAssistant={config.firstMessageAssistant}
                            onFirstMessageAssistantChange={(val) => handleConfigChange('firstMessageAssistant', val)}
                            onResetSessionAndApply={handleResetAndApply}
                            onSaveConversation={handleSaveConversation}
                            onLoadConversationClick={() => fileInputRef.current?.click()}
                            isLoading={isLoading}
                            onClose={() => setIsConfigPanelOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};