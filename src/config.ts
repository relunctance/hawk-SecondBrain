/**
 * Configuration loader for hawk-secondbrain
 */

import path from 'path';
import * as dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

export interface Config {
  hawkMemoryUrl: string;
  hawkApiKey: string;
  hawkAgentId: string;
  logLevel: string;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  return {
    hawkMemoryUrl: process.env.HAWK_MEMORY_URL || 'http://127.0.0.1:18368',
    hawkApiKey: process.env.HAWK_API_KEY || '',
    hawkAgentId: process.env.HAWK_AGENT_ID || `${process.env.USER || 'user'}@${require('os').hostname()}`,
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
