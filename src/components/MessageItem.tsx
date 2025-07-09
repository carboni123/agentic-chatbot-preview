// src/components/MessageItem.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Message, BackendConfig, CustomizationOptions } from '../types';
import SiteCard, { SiteMetadata } from './SiteCard';

const URL_REGEX_FOR_PREVIEW = /(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:?!]*[^\s<>"'`.,;:?!])/;
const URL_SPLIT_REGEX = /(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:?!]*[^\s<>"'`.,;:?!])/g;

export function isDomainAllowedForPreview(url: string | null, allowedDomains: string[]): boolean {
  if (!url || allowedDomains.length === 0) {
    return false;
  }
  if (allowedDomains.includes('*')) {
    return true;
  }
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return allowedDomains.some(domain => hostname === domain || hostname.endsWith("." + domain));
  } catch (e) {
    console.warn("Could not parse URL for domain check:", url, e);
    return false;
  }
}


const formatWhatsAppMarkdownSegment = (text: string, keyPrefix: string): React.ReactNode[] => {
  const markdownPatterns = /(\*[^* \s][^*]*?\*)|(_[^_ \s][^_]*?_)|(~[^~ \s][^~]*?~)|(`[^` \s][^`]*?`)/g;
  const parts = text.split(markdownPatterns);
  let partIndex = 0;

  return parts.map((part) => {
    if (!part) return null;
    const key = `${keyPrefix}-${partIndex++}`;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <strong className="font-bold" key={`bold-${key}`}>{part.substring(1, part.length - 1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em className="italic" key={`italic-${key}`}>{part.substring(1, part.length - 1)}</em>;
    }
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return <del className="line-through" key={`strike-${key}`}>{part.substring(1, part.length - 1)}</del>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" key={`code-${key}`}>{part.substring(1, part.length - 1)}</code>;
    }
    return part;
  }).filter(Boolean);
};

const renderMessageContent = (text: string): React.ReactNode => {
  const segments = text.split(URL_SPLIT_REGEX);
  return segments.map((segment, index) => {
    if (!segment) return null;
    URL_REGEX_FOR_PREVIEW.lastIndex = 0;
    if (URL_REGEX_FOR_PREVIEW.test(segment) && (index % 2 !== 0 || segments.length === 1)) {
      return (
        <a href={segment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" key={`url-${index}`}>
          {segment}
        </a>
      );
    } else {
      return formatWhatsAppMarkdownSegment(segment, `text-${index}`);
    }
  }).filter(Boolean);
};

async function fetchMetadata(pageUrl: string, metadataEndpoint: string): Promise<SiteMetadata> {
  const backendUrl = `${metadataEndpoint}?url=${encodeURIComponent(pageUrl)}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(backendUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);

    const data: SiteMetadata = await response.json();
    if (!response.ok) {
      const errMsg = data.errorMessage || `Preview service returned ${response.status}`;
      return { url: pageUrl, title: pageUrl, error: true, errorMessage: errMsg };
    }
    if (!data.url) data.url = pageUrl;
    if (!data.title) data.title = data.siteName || pageUrl;
    return data;
  } catch (error: unknown) {
    let errorMessage = "Preview request failed";
    if (error && typeof error === 'object' && 'name' in error && (error as Error).name === 'AbortError') {
      errorMessage = "Preview request timed out.";
    } else if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
      errorMessage = "Network error: Could not reach preview service.";
    } else if (error instanceof SyntaxError) {
      errorMessage = "Error parsing response from preview service.";
    } else if (error instanceof Error) {
      errorMessage = error.message.substring(0, 100);
    }
    return { url: pageUrl, title: pageUrl, error: true, errorMessage };
  }
}

interface MessageItemProps {
  message: Message;
  backendConfig: BackendConfig;
  customizationOptions?: CustomizationOptions;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, backendConfig, customizationOptions }) => {
  const isSent = message.type === 'sent';
  const isReceived = message.type === 'received';
  const isSystem = message.type === 'system';

  const [metadata, setMetadata] = useState<SiteMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(false);
  const currentPreviewUrlRef = useRef<string | null>(null);
  const allowedDomains = customizationOptions?.allowedPreviewDomains || ['*'];

  useEffect(() => {
    URL_REGEX_FOR_PREVIEW.lastIndex = 0;
    const match = message.text.match(URL_REGEX_FOR_PREVIEW);
    const firstUrlInMessage = match ? match[0] : null;

    // Use the allowedDomains from props
    const isEligibleForPreview = isDomainAllowedForPreview(firstUrlInMessage, allowedDomains);
    const targetUrlForPreview = isEligibleForPreview ? firstUrlInMessage : null;

    if (targetUrlForPreview !== currentPreviewUrlRef.current) {
      setMetadata(null);
      setLoadingMetadata(false);
      currentPreviewUrlRef.current = targetUrlForPreview;
    }

    if (targetUrlForPreview && currentPreviewUrlRef.current === targetUrlForPreview) {
      const needsFetching = !metadata || metadata.url !== targetUrlForPreview || (metadata.error && !loadingMetadata);
      if (needsFetching) {
        setLoadingMetadata(true);
        // Pass the metadata URL from the backendConfig prop
        fetchMetadata(targetUrlForPreview, backendConfig.urlMetadataUrl)
          .then(data => {
            if (currentPreviewUrlRef.current === targetUrlForPreview) {
              setMetadata(data);
            }
          })
          .finally(() => {
            if (currentPreviewUrlRef.current === targetUrlForPreview) {
              setLoadingMetadata(false);
            }
          });
      }
    }
  }, [message.sid, message.text, metadata, loadingMetadata, backendConfig.urlMetadataUrl, allowedDomains]);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2 px-2">
        <div className="max-w-[90%] sm:max-w-[80%]">
          <div className="px-3 py-1.5 text-xs text-whatsapp-time bg-[#E2FFC7] rounded-lg shadow-sm text-center break-words">
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  const messageAlignment = isSent ? 'justify-end' : 'justify-start';
  const bubbleStyles = isSent
    ? 'bg-whatsapp-sent-bg text-gray-800 rounded-br-none'
    : 'bg-white text-gray-800 rounded-bl-none relative';

  const processedMessageContent = renderMessageContent(message.text);

  return (
    <div className={`flex ${messageAlignment} px-2 group relative`}>
      <div className={`max-w-[80%] sm:max-w-[70%] min-w-[80px] relative`}>
        {currentPreviewUrlRef.current && loadingMetadata && !metadata && (
          <div className="mb-2 p-3 border border-gray-200 rounded-lg bg-gray-50 animate-pulse shadow-sm">
            <div className="h-24 bg-gray-200 rounded-md mb-2.5"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        )}
        {currentPreviewUrlRef.current && metadata && (!loadingMetadata || metadata) && <SiteCard metadata={metadata} />}

        <div className={`px-3 pt-2 pb-6 rounded-lg shadow-md relative ${bubbleStyles}`}>
          {isReceived && message.senderName && (
            <p className="text-xs font-semibold text-purple-600 mb-0.5">{message.senderName}</p>
          )}
          <div className="text-sm whitespace-pre-wrap mb-3 break-words min-h-[1.5em]">
            {processedMessageContent}
          </div>
          <span className="text-xs text-whatsapp-time absolute bottom-1 right-2">
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;