import { protocol } from 'electron';
import fs from 'fs';

export function registerSchemes() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'media',
      privileges: {
        secure: true,
        supportFetchAPI: true,
        standard: true,
        bypassCSP: true,
        stream: true,
      },
    },
  ]);
}

export function registerProtocols() {
  protocol.registerFileProtocol('media', (request, callback) => {
    let filePath = decodeURIComponent(request.url.replace(/^media:\/\//, ''));

    // Handle Windows paths - convert URL format to proper path
    if (process.platform === 'win32') {
      // Handle case where URL loses the colon: media://g/... instead of media://G:/...
      if (/^[a-zA-Z]\//.test(filePath) && !filePath.includes(':')) {
        const driveLetter = filePath[0]?.toUpperCase() || 'C';
        const restOfPath = filePath.substring(2);
        filePath = `${driveLetter}:/${restOfPath}`;
      }

      // Remove leading slash if present (e.g., /C:/path -> C:/path)
      if (filePath.startsWith('/') && filePath[2] === ':') {
        filePath = filePath.substring(1);
      }
      // Convert forward slashes to backslashes for Windows
      filePath = filePath.replace(/\//g, '\\');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('[Protocol] File not found:', filePath);
      callback({ error: -6 });
      return;
    }

    callback({ path: filePath });
  });
}
