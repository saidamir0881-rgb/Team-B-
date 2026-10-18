import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
export const service = 'voicetomental';
export const workspaceId = createHash('sha256').update(resolve('.')).digest('hex').slice(0,16);
