// src/components/MessageList.tsx
import React, { useEffect, useRef } from 'react';
import { Message, BackendConfig, CustomizationOptions } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  backendConfig: BackendConfig;
  customizationOptions?: CustomizationOptions;
}

const MessageList: React.FC<MessageListProps> = ({ messages, backendConfig, customizationOptions }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#E5DDD5] bg-repeat">
      {messages.map((msg) => (
        <MessageItem
          key={msg.sid}
          message={msg}
          backendConfig={backendConfig}
          customizationOptions={customizationOptions}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;