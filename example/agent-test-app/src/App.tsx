import {
  AgenticChatbot,
  type AgentConfig,
  type ConversationData,
  type Message as ChatbotMessage
} from 'agentic-chatbot-preview';

function App() {
  // Define the backend endpoints pointing to your local server
  const backendConfig = {
    socketUrl: 'http://localhost:5000',
    respondUrl: 'http://localhost:5000/api/v1/agent-test/respond',
    resetUrl: 'http://localhost:5000/api/v1/agent-test/reset',
    loadHistoryUrl: 'http://localhost:5000/api/v1/agent-test/load_history',
    urlMetadataUrl: 'http://localhost:5000/api/v1/utils/url-metadata',
  };

  // Your custom logic for handling a user's message
  const handleSendMessage = async (text: string, senderId: string, config: AgentConfig) => {
    console.log(`Sending message from ${senderId}: "${text}"`);

    const formData = new URLSearchParams();
    formData.append('Body', text);
    formData.append('From', senderId);
    formData.append('ProfileName', 'Component Test App');
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
    // The component will receive the agent's reply via its WebSocket connection.
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
  const handleLoadConversation = async (data: ConversationData): Promise<ChatbotMessage[]> => {
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

    // Return the messages for the component to display
    return data.messages;
  };

  return (
    // This outer div sets up the page background and centers the container
    <div className="flex justify-center items-center w-screen h-screen bg-gray-200 p-4">

      {/*
      *  --- THIS IS THE NEW CONTAINER ---
      *  This div acts as the "column" or "frame" for your component.
      *  We give it a max-width, a specific height, a shadow, and rounded corners.
      *  Your chatbot component will now live inside this and fill it.
    */}
      <div className="w-full max-w-2xl h-[90vh] shadow-2xl rounded-lg overflow-hidden">
        <AgenticChatbot
          backendConfig={backendConfig}
          initialSenderId="web:test-app-user-01"
          onSendMessage={handleSendMessage}
          onResetSession={handleResetSession}
          onLoadConversation={handleLoadConversation}
          customizationOptions={{
            chatTitle: "NPM Package Test",
            profilePictureUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=npm-test",
          }}
          initialMessages={[{
            sid: 'system-welcome-01',
            text: 'Welcome! This component now fits its container.',
            type: 'system',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]}
        />
      </div>
    </div>
  );
}

export default App;