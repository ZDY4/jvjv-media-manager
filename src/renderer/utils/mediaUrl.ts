export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  
  // Replace file:// with media://
  if (path.startsWith('file://')) {
    return path.replace('file://', 'media://');
  }
  
  // If path has no protocol, assume it's a local file path and prepend media://
  if (!path.includes('://')) {
    // Ensure we don't have double slashes at start if path already has them (e.g. //server/share)
    // But for local windows path C:\...
    return `media://${path}`;
  }
  
  return path;
}
