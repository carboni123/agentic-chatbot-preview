# Agentic Chatbot Preview

A reusable, customizable React component for creating and testing agentic chatbots. It provides a WhatsApp-like UI and a powerful interface for integrating with your own agent backend logic.

## Features

-   **Modular Design**: Easily integrate into any React/TypeScript project.
-   **Backend Agnostic**: Connect to any agent backend via a simple props-based API.
-   **Customizable UI**: Change titles, profile pictures, and more.
-   **Full Chat Functionality**: Supports sending messages, receiving real-time updates via WebSockets, and displaying system notifications.
-   **Agent Configuration**: Includes a side panel to dynamically change the agent's system prompt and conversation starters.
-   **Session Management**: Save and load entire conversations, including agent settings and message history.

## Installation

```bash
npm install agentic-chatbot-preview
# or
yarn add agentic-chatbot-preview
```
*(Note: This is a hypothetical package name. You would publish it under your own name.)*

You will also need to have `react` and `react-dom` as dependencies in your project.

```bash
npm install react react-dom socket.io-client
```

## Usage Example

Here's how to integrate `AgenticChatbot` into your application. You provide the handler functions that contain your specific backend logic.

```tsx
// src/App.tsx
import React from 'react';
import { AgenticChatbot, AgentConfig, ConversationData } from 'agentic-chatbot-component';
import 'path/to/your/tailwind.css'; // Make sure to include Tailwind CSS

const App = () => {
  // Define your backend endpoints
  const backendConfig = {
    socketUrl: 'http://localhost:5000',
    respondUrl: 'http://localhost:5000/api/v1/agent-test/respond',
    resetUrl: 'http://localhost:5000/api/v1/agent-test/reset',
    loadHistoryUrl: 'http://localhost:5000/api/v1/agent-test/load_history',
    urlMetadataUrl: 'http://localhost:5000/api/v1/utils/url-metadata', // For URL previews
  };

  // Your custom logic for handling a user's message
  const handleSendMessage = async (text: string, senderId: string, config: AgentConfig) => {
    console.log(`Sending message from ${senderId}: "${text}"`);

    const formData = new URLSearchParams();
    formData.append('Body', text);
    formData.append('From', senderId);
    formData.append('ProfileName', 'React Component User');
    formData.append('system_prompt', config.systemPrompt);

    const response = await fetch(backendConfig.respondUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${errorText}`);
    }
    // The component will receive the agent's reply via WebSocket.
  };

  // Your custom logic for resetting the conversation state
  const handleResetSession = async (senderId: string) => {
    console.log(`Resetting session for ${senderId}`);
    const response = await fetch(backendConfig.resetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderNumber: senderId }),
    });
    if (!response.ok) throw new Error('Failed to reset session.');
  };

  // Your custom logic for loading a saved conversation
  const handleLoadConversation = async (data: ConversationData) => {
    console.log('Loading conversation for', data.senderId);
    const response = await fetch(backendConfig.loadHistoryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderNumber: data.senderId,
            messages: data.messages,
            systemPrompt: data.config.systemPrompt,
        }),
    });
    if (!response.ok) throw new Error('Failed to load history on backend.');
    
    // Return the messages to display in the UI
    return data.messages;
  };

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#333' }}>
      <AgenticChatbot
        backendConfig={backendConfig}
        initialSenderId="web:user-01"
        onSendMessage={handleSendMessage}
        onResetSession={handleResetSession}
        onLoadConversation={handleLoadConversation}
        customizationOptions={{
            chatTitle: "My Custom Agent",
            profilePictureUrl: "https://my-cdn.com/profile.jpg",
        }}
      />
    </div>
  );
};

export default App;
```

## API Reference (Props)

### `<AgenticChatbot />`

| Prop                  | Type                                                               | Required | Description                                                                                                       |
| --------------------- | ------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `backendConfig`       | `BackendConfig`                                                    | Yes      | An object containing all necessary backend URLs.                                                                  |
| `initialSenderId`     | `string`                                                           | Yes      | The initial unique identifier for the user.                                                                       |
| `onSendMessage`       | `(text, senderId, config) => Promise<void>`                        | Yes      | Callback function that implements the logic to send a message to your agent.                                      |
| `onResetSession`      | `(senderId) => Promise<void>`                                      | Yes      | Callback function that implements the logic to reset the conversation on your backend.                            |
| `onLoadConversation`  | `(data) => Promise<Message[]>`                                     | Yes      | Callback function to process a loaded conversation file and sync the state with your backend.                     |
| `initialConfig`       | `Partial<AgentConfig>`                                             | No       | Overrides for the default agent configuration (system prompt, starter messages).                                  |
| `initialMessages`     | `Message[]`                                                        | No       | An array of messages to pre-populate the chat window with.                                                        |
| `customizationOptions`| `CustomizationOptions`                                             | No       | An object to customize UI elements like the chat title and profile picture.                                       |
| `enableConfigPanel`   | `boolean`                                                          | No       | Set to `false` to completely hide the agent settings panel. Defaults to `true`.                                   |
| `onSenderIdChange`    | `(newId: string) => void`                                          | No       | Callback fired when the user's sender ID is changed via the UI.                                                   |
| `onConfigChange`      | `(newConfig: AgentConfig) => void`                                 | No       | Callback fired whenever a setting in the configuration panel is changed.                                          |

This structure transforms your project into a true component library, separating concerns cleanly and providing a flexible, powerful API for other developers to integrate into their own projects.