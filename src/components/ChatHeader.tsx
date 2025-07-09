// src/components/ChatHeader.tsx
import React from 'react';
import { FaCog } from 'react-icons/fa';
// Import the type we need from the central types file
import { CustomizationOptions } from '../types';

interface ChatHeaderProps {
  backendUrl: string;
  senderNumber: string;
  onSenderNumberChange: (newNumber: string) => void;
  onToggleConfigPanel: () => void;
  // Make customizationOptions an optional prop
  customizationOptions?: CustomizationOptions;
}

// Default values to be used if no customization is provided
const DEFAULT_CHAT_TITLE = "Agent Chat";
const DEFAULT_PROFILE_PICTURE = "https://picsum.photos/seed/default_profile_pic/40/40";

const ChatHeader: React.FC<ChatHeaderProps> = ({
  backendUrl,
  senderNumber,
  onSenderNumberChange,
  onToggleConfigPanel,
  customizationOptions, // Destructure the new prop
}) => {
  // Use the prop values with fallbacks to the defaults
  const chatTitle = customizationOptions?.chatTitle || DEFAULT_CHAT_TITLE;
  const profilePictureUrl = customizationOptions?.profilePictureUrl || DEFAULT_PROFILE_PICTURE;

  const handleEditSender = () => {
    const newNumber = window.prompt(
      'Enter new sender identifier (e.g., web:+15559876543 or web:my-id):',
      senderNumber,
    );
    if (newNumber && newNumber.trim().startsWith('web:')) {
      onSenderNumberChange(newNumber.trim());
    } else if (newNumber) {
      alert('Invalid format. Must start with "web:".');
    }
  };

  return (
    <div className="bg-gray-700 text-white p-3 sm:p-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center min-w-0">
          <img
            src={profilePictureUrl}
            alt="Profile"
            className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-white/50 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error_profile_pic/40/40";
            }}
          />
          <h5 className="text-lg font-semibold truncate">{chatTitle}</h5>
        </div>
        <button onClick={onToggleConfigPanel} className="lg:hidden text-white/80 hover:text-white p-2 -mr-2" aria-label="Open settings">
          <FaCog size={20} />
        </button>
      </div>
      <p className="text-xs opacity-90 mb-0.5">
        Connected to backend API: <code className="bg-white/15 px-1.5 py-0.5 rounded-sm text-xs">{backendUrl}</code>
      </p>
      <p className="text-xs opacity-90">
        Sending as: <code onClick={handleEditSender} className="bg-white/15 px-1.5 py-0.5 rounded-sm text-xs cursor-pointer hover:bg-white/30 transition-colors">{senderNumber}</code> <span className="text-white/70 text-xs">(Click to Edit)</span>
      </p>
    </div>
  );
};

export default ChatHeader;