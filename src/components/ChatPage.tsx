// src/components/ChatPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AgentConfigPanel, { ConversationStarter, AgentConfigPanelProps } from './AgentConfigPanel';
import { Message } from '../types';
import { generateMessageSid } from '../utils/sidUtils';
import { FaChevronLeft, FaChevronRight, FaCog } from 'react-icons/fa';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://localhost:5000';
const AGENT_RESPOND_URL = `${API_BASE_URL}/api/v1/agent-test/respond`;
const AGENT_RESET_URL = `${API_BASE_URL}/api/v1/agent-test/reset`;
const AGENT_LOAD_HISTORY_URL = `${API_BASE_URL}/api/v1/agent-test/load_history`;
const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME || 'Agent Tester';
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Your goal is to provide accurate and concise information.
You are running in a test environment.`;
const DEFAULT_ASSISTANT_FIRST_MESSAGE = "Hello! I'm the assistant. How can I help you today?";
const DEFAULT_USER_FIRST_MESSAGE = "Hi, I'd like to start a test conversation.";



const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderNumber, setSenderNumber] = useState<string>('web:agent-tester-01');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Config Panel State - default to closed on all devices for a cleaner initial view.
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [conversationStarter, setConversationStarter] = useState<ConversationStarter>('assistant');
  const [firstMessageUserTemplate, setFirstMessageUserTemplate] = useState<string>(DEFAULT_USER_FIRST_MESSAGE);
  const [firstMessageAssistantTemplate, setFirstMessageAssistantTemplate] = useState<string>(DEFAULT_ASSISTANT_FIRST_MESSAGE);

  const toggleConfigPanel = () => setIsConfigPanelOpen(!isConfigPanelOpen);

  useEffect(() => {
    const socket: Socket = io(API_BASE_URL);
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit('join', { senderNumber });
    };

    socket.on('connect', joinRoom);

    socket.on('agent_message', (payload: { text: string; sid?: string }) => {
      const sid = payload.sid || generateMessageSid(payload.text, 'B', 'BR');
      const newMessage: Message = {
        sid,
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
  }, [senderNumber]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const messageSid = generateMessageSid(text, 'U', 'WS');
      const sentMessage: Message = {
        sid: messageSid,
        text,
        type: 'sent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, sentMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const formData = new URLSearchParams();
        formData.append('Body', text);
        formData.append('From', senderNumber);
        formData.append('ProfileName', 'Agent Tester UI');
        formData.append('MessageSid', messageSid);
        formData.append('system_prompt', systemPrompt);

        const response = await fetch(AGENT_RESPOND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        if (!response.ok) {
          const textResponse = await response.text();
          throw new Error(`Backend error: ${response.status} ${response.statusText}. ${textResponse}`);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        const errorMessageText = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessageText);
      } finally {
        setIsLoading(false);
      }
    },
    [senderNumber, systemPrompt]
  );


  const initializeConversation = useCallback(async (performBackendReset: boolean) => {
    setIsLoading(true);
    setError(null);
    const currentDisplayMessages: Message[] = [];

    if (performBackendReset) {
      try {
        const response = await fetch(AGENT_RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderNumber }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Backend reset failed: ${errorData.message || response.statusText}`);
        }
        console.log('Backend session reset successfully.');
      } catch (err) {
        const resetErrorMsg = err instanceof Error ? err.message : 'Unknown error during backend reset.';
        setError(resetErrorMsg);
        currentDisplayMessages.push({
          sid: generateMessageSid(resetErrorMsg, 'E', 'SY'), // SY for System
          text: `Error: ${resetErrorMsg}`,
          type: 'system',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setMessages(currentDisplayMessages);
        setIsLoading(false);
        return;
      }
    }

    const starterRoleName = conversationStarter === 'user' ? 'User' : 'Assistant';
    const systemWelcomeText = `Conversation (re)started with current settings. ${starterRoleName} initiates.`;
    currentDisplayMessages.push({
      sid: generateMessageSid(systemWelcomeText, 'S', 'SY'),
      text: systemWelcomeText,
      type: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (conversationStarter === 'assistant' && firstMessageAssistantTemplate.trim()) {
      currentDisplayMessages.push({
        sid: generateMessageSid(firstMessageAssistantTemplate, 'A', 'IA'),
        text: firstMessageAssistantTemplate,
        type: 'received',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderName: 'Agent',
      });
      setMessages(currentDisplayMessages);
      setIsLoading(false);
    } else if (conversationStarter === 'user' && firstMessageUserTemplate.trim()) {
      setMessages(currentDisplayMessages);
      await handleSendMessage(firstMessageUserTemplate);
    } else {
      setMessages(currentDisplayMessages);
      setIsLoading(false);
    }
  }, [senderNumber, conversationStarter, firstMessageUserTemplate, firstMessageAssistantTemplate, handleSendMessage, systemPrompt]);


  const handleResetSessionAndApply = useCallback(() => {
    initializeConversation(true);
  }, [initializeConversation]);

  useEffect(() => {
    const initialWelcomeMessage: Message = {
      sid: generateMessageSid(`Welcome to ${BUSINESS_NAME}.`, 'S', 'SY'),
      text: `Welcome to ${BUSINESS_NAME}. Configure agent settings in the side panel and click "Reset Session & Apply Settings" to begin.`,
      type: 'received',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: 'System',
    };
    setMessages([initialWelcomeMessage]);
  }, []);


  const handleSaveConversation = () => {
    try {
      const conversationData = {
        senderNumber,
        systemPrompt,
        conversationStarter,
        firstMessageUserTemplate: conversationStarter === 'user' ? firstMessageUserTemplate : undefined,
        firstMessageAssistantTemplate: conversationStarter === 'assistant' ? firstMessageAssistantTemplate : undefined,
        messages,
        savedAt: new Date().toISOString(),
      };
      const jsonString = JSON.stringify(conversationData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `conversation-${senderNumber}-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save conversation:', err);
      setError('Could not save conversation to file.');
    }
  };

  const handleLoadConversation = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (event.target) event.target.value = ''; // Allow re-loading the same file
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File could not be read.');
        const data = JSON.parse(text);

        if (!data.senderNumber || !data.systemPrompt || !Array.isArray(data.messages)) {
          throw new Error('Invalid conversation file format.');
        }

        const response = await fetch(AGENT_LOAD_HISTORY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderNumber: data.senderNumber,
            messages: data.messages,
            systemPrompt: data.systemPrompt,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`Backend error: ${errorData.message || response.statusText}`);
        }

        setSenderNumber(data.senderNumber);
        setSystemPrompt(data.systemPrompt);
        setMessages(data.messages);
        setConversationStarter(data.conversationStarter || 'assistant');
        setFirstMessageUserTemplate(data.firstMessageUserTemplate || DEFAULT_USER_FIRST_MESSAGE);
        setFirstMessageAssistantTemplate(data.firstMessageAssistantTemplate || DEFAULT_ASSISTANT_FIRST_MESSAGE);

        const successMessage: Message = {
          sid: generateMessageSid('Conversation loaded.', 'S', 'SY'),
          text: 'Conversation successfully loaded from file.',
          type: 'system',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...data.messages, successMessage]);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('Failed to load conversation:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleLoadConversationClick = () => {
    fileInputRef.current?.click();
  };

  const handleSenderNumberChange = (newNumber: string) => {
    setSenderNumber(newNumber);
    initializeConversation(true);
  };

  return (
    <div className="relative flex w-full max-w-7xl h-screen sm:h-[90vh] sm:min-h-[600px] sm:max-h-[1200px] bg-white sm:shadow-2xl sm:rounded-lg overflow-hidden sm:border-4 sm:border-white">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLoadConversation}
        className="hidden"
        accept="application/json"
      />
      {/* Overlay for Mobile Drawer */}
      {isConfigPanelOpen && (
        <div
          onClick={toggleConfigPanel}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Chat Area */}
      <div className="relative flex-grow flex flex-col h-full bg-whatsapp-container-bg">
        <ChatHeader
          backendUrl={AGENT_RESPOND_URL}
          senderNumber={senderNumber}
          onSenderNumberChange={handleSenderNumberChange}
          onToggleConfigPanel={toggleConfigPanel}
        />
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} error={error} />

        {/* Config Panel Toggle Button */}
      <button
        onClick={toggleConfigPanel}
        className={`
          hidden lg:flex items-center justify-center 
          absolute top-1/2 -translate-y-1/2 right-0 z-20 
          bg-gray-700 text-white p-2 rounded-l-md hover:bg-gray-800 
          transition-transform duration-300 ease-in-out
        `}
        title={isConfigPanelOpen ? "Close Settings" : "Open Settings"}
      >
        {isConfigPanelOpen ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
      </button>
      </div>


      {/* Config Panel (Drawer on mobile, Sidebar on desktop) */}
      <div
        className={`
          bg-gray-100 border-l border-gray-300 h-full overflow-hidden
          transform transition-all duration-300 ease-in-out
          fixed top-0 right-0 z-30 w-full max-w-sm
          lg:relative lg:flex-shrink-0 lg:transform-none
          ${isConfigPanelOpen
            ? 'translate-x-0 lg:w-full lg:max-w-sm'
            : 'translate-x-full lg:w-0 lg:border-l-0'
          }
        `}
      >
        <div className="h-full w-full max-w-sm overflow-y-auto" role="dialog" aria-modal="true">
          <AgentConfigPanel
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            conversationStarter={conversationStarter}
            onConversationStarterChange={setConversationStarter}
            firstMessageUser={firstMessageUserTemplate}
            onFirstMessageUserChange={setFirstMessageUserTemplate}
            firstMessageAssistant={firstMessageAssistantTemplate}
            onFirstMessageAssistantChange={setFirstMessageAssistantTemplate}
            onResetSessionAndApply={handleResetSessionAndApply}
            onSaveConversation={handleSaveConversation}
            onLoadConversationClick={handleLoadConversationClick}
            isLoading={isLoading}
            onClose={toggleConfigPanel}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;