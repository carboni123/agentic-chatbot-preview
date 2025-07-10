// src/types/index.ts

/**
 * Represents a single message in the chat interface.
 */
export interface Message {
    sid: string;
    text: string;
    type: 'sent' | 'received' | 'system';
    timestamp: string;
    senderName?: string;
}

/**
 * Configuration for the agent's behavior and initial state.
 */
export interface AgentConfig {
    systemPrompt: string;
    conversationStarter: 'user' | 'assistant';
    firstMessageUser: string;
    firstMessageAssistant: string;
}

/**
 * Backend endpoint configuration.
 */
export interface BackendConfig {
    sseUrl: string;
    respondUrl: string;
    resetUrl: string;
    loadHistoryUrl: string;
    urlMetadataUrl: string;
}

/**
 * Data structure for a saved conversation.
 */
export interface ConversationData {
    senderId: string;
    config: AgentConfig;
    messages: Message[];
    savedAt: string;
}

/**
 * Props for customizing the UI appearance.
 */
export interface CustomizationOptions {
    chatTitle?: string;
    profilePictureUrl?: string;
    allowedPreviewDomains?: string[];
}

/**
 * Defines the props for the main AgenticChatbot component.
 */
export interface AgenticChatbotProps {
    // --- Core Configuration ---
    backendConfig: BackendConfig;
    initialSenderId: string;

    // --- Event Handlers (Agent Logic) ---
    /**
     * Asynchronous function to handle sending a user message to the agent.
     * The component will manage the loading state around this function.
     * @param text The message text from the user.
     * @param senderId The current sender identifier.
     * @param config The current agent configuration.
     */
    onSendMessage: (text: string, senderId: string, config: AgentConfig) => Promise<void>;

    /**
     * Asynchronous function to reset the conversation session on the backend.
     * @param senderId The current sender identifier.
     */
    onResetSession: (senderId: string) => Promise<void>;

    /**
     * Asynchronous function to load a conversation history into the backend.
     * @param data The parsed conversation data from a JSON file.
     * @returns The messages to be displayed in the chat.
     */
    onLoadConversation: (data: ConversationData) => Promise<Message[]>;

    // --- UI & State ---
    initialConfig?: Partial<AgentConfig>;
    initialMessages?: Message[];
    customizationOptions?: CustomizationOptions;
    enableConfigPanel?: boolean;
    onSenderIdChange?: (newId: string) => void;
    onConfigChange?: (newConfig: AgentConfig) => void;
}