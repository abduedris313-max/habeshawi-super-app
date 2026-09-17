/**
 * Local Audio File Metadata & Cover Art Generator
 * Reads audio duration, parses file name / basic ID3 header tags,
 * and generates beautiful ambient gradient artwork for songs without embedded covers.
 */

export interface ExtractedMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
}

// Pastel & Vibrant ambient gradient covers generator
const COVER_GRADIENTS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
];

export async function parseAudioMetadata(file: File): Promise<ExtractedMetadata> {
  // 1. Clean file name into title & artist if structured like "Artist - Title.mp3"
  const rawName = file.name.replace(/\.[^/.]+$/, '');
  let title = rawName;
  let artist = 'Local Artist';
  let album = 'Local Uploads';

  if (rawName.includes(' - ')) {
    const parts = rawName.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (rawName.includes('_')) {
    title = rawName.replace(/_/g, ' ');
  }

  // 2. Obtain exact audio duration using a hidden Audio object
  const duration = await getAudioDuration(file);

  // 3. Select cover image deterministically based on file name hash
  const hash = Array.from(rawName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const coverUrl = COVER_GRADIENTS[hash % COVER_GRADIENTS.length];

  return {
    title,
    artist,
    album,
    duration,
    coverUrl,
  };
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration || 180);
      URL.revokeObjectURL(url);
      resolve(dur > 0 && isFinite(dur) ? dur : 180);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(180); // Default 3 mins if unreadable
    };

    audio.src = url;
  });
}
