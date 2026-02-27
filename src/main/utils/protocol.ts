import { protocol, net } from 'electron';
import { pathToFileURL } from 'url';

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
  protocol.handle('media', (req) => {
    const url = req.url.replace(/^media:\/\//, '');
    const decodedUrl = decodeURIComponent(url);
    
    // Handle Windows drive letters (e.g., /C:/... -> C:/...)
    // But pathToFileURL handles it if we pass the correct path?
    // Usually req.url for media://C:/foo is media://C:/foo
    // sliced: C:/foo.
    // pathToFileURL('C:/foo') -> file:///C:/foo.
    
    // However, if the path starts with /, remove it?
    // On Windows, URL might be media:///C:/... -> /C:/...
    let filePath = decodedUrl;
    if (process.platform === 'win32' && filePath.startsWith('/') && !filePath.startsWith('//')) {
        filePath = filePath.slice(1);
    }
    
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
