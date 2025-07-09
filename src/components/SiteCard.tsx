// src/components/SiteCard.tsx
import React from 'react';

export interface SiteMetadata {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  error?: boolean;
  errorMessage?: string; // To display a specific error message
}

interface SiteCardProps {
  metadata: SiteMetadata;
}

const SiteCard: React.FC<SiteCardProps> = ({ metadata }) => {
  // If error is true and we have no other useful info other than a generic title.
  if (metadata.error && metadata.title === metadata.url && !metadata.description && !metadata.imageUrl && !metadata.siteName) {
    return (
      <div className="mb-2 p-3 border border-red-300 rounded-lg bg-red-50 text-red-700 text-xs shadow-sm">
        <p className="font-semibold truncate">Preview not available</p>
        <p className="truncate">{metadata.url}</p>
        {metadata.errorMessage && <p className="text-xxs mt-0.5">{metadata.errorMessage}</p>}
      </div>
    );
  }

  // If no title (or title is just the URL), no description, no image, and no site name, don't render.
  // (unless it's explicitly an error we want to show, handled above)
  if ((!metadata.title || metadata.title === metadata.url) && !metadata.description && !metadata.imageUrl && !metadata.siteName && !metadata.error) {
    return null;
  }

  return (
    <a href={metadata.url} target="_blank" rel="noopener noreferrer" className="block mb-2 no-underline group">
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white group-hover:bg-gray-50 transition-colors shadow-sm">
        {metadata.imageUrl && (
          <img
            src={metadata.imageUrl}
            alt={metadata.title || metadata.siteName || 'Site preview'}
            className="w-full h-32 sm:h-40 object-cover border-b border-gray-300 bg-gray-100"
            onError={(e) => {
              (e.currentTarget.style.display = 'none');
            }}
          />
        )}
        <div className="p-3">
          {metadata.title && (metadata.title !== metadata.url || metadata.description || metadata.imageUrl) && (
            <div className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-600">
              {metadata.title}
            </div>
          )}
          {metadata.siteName && metadata.siteName !== metadata.title && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">{metadata.siteName}</div>
          )}
          {metadata.description && !metadata.error && ( // Don't show generic description if it's an error message
            <p className="text-xs text-gray-600 mt-1 max-h-12 overflow-hidden leading-tight" style={{ WebkitBoxOrient: 'vertical', display: '-webkit-box', WebkitLineClamp: 2 }}>
              {metadata.description}
            </p>
          )}
          <p className={`text-xs mt-1.5 truncate ${metadata.error ? 'text-red-500' : 'text-blue-500 group-hover:underline'}`}>
            {metadata.url}
          </p>
          {metadata.error && metadata.errorMessage && (
            <p className="text-xs text-red-600 mt-1">{metadata.errorMessage}</p>
          )}
        </div>
      </div>
    </a>
  );
};

export default SiteCard;