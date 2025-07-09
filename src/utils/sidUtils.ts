// src/utils/sidUtils.ts
import { md5 } from 'js-md5'; // Import the md5 function

/**
 * Generates a trackable unique identifier (SID) for a message,
 * matching the format: <prefix><32_char_md5_hash><role_initial>.
 * 
 * @param messageText The text content of the message.
 * @param roleInitial The initial of the role (e.g., 'U' for User, 'B' for Backend/Bot, 'S' for System).
 * @param prefix The prefix for the SID (e.g., "WS" for Web Sent, "BR" for Backend Received, "SY" for System).
 * @returns The generated SID (e.g., WS + 32_hex_chars + U).
 */
export function generateMessageSid(
    messageText: string,
    roleInitial: string,
    prefix: string = "WS" 
): string {
    // Create the string to be hashed, similar to the Python example.
    // Adding a millisecond timestamp and a random number ensures higher uniqueness
    // even if messages are sent very close together with identical text.
    const messageToEncode = new Date().toISOString() + messageText + Math.random();
    
    // Generate MD5 hash and get its hexadecimal representation
    const hash = md5(messageToEncode); // This will be a 32-character hex string

    return `${prefix}${hash}${roleInitial.toUpperCase()}`;
}

// Example of how it would be used (for testing in console or other parts of the app):
// const exampleSid = generateMessageSid("Hello there!", "U", "WS");
// console.log(exampleSid); // e.g., WS + 32_hex_chars + U