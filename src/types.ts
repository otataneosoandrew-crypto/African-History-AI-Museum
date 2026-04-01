export type Era = 'pre-colonial' | 'colonial' | 'independence' | 'modern';

export interface MuseumItem {
  id: string;
  title: string;
  era: Era;
  description: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  content?: string;
}

export const ERAS: { id: Era; title: string; period: string; description: string }[] = [
  {
    id: 'pre-colonial',
    title: 'Pre-Colonial Kingdoms',
    period: 'Ancient - 1884',
    description: 'The era of great empires like Mali, Songhai, Great Zimbabwe, and the Kingdom of Kush.'
  },
  {
    id: 'colonial',
    title: 'Colonial Resistance',
    period: '1884 - 1950s',
    description: 'A period of struggle, resilience, and the fight for sovereignty against European powers.'
  },
  {
    id: 'independence',
    title: 'The Dawn of Independence',
    period: '1950s - 1990s',
    description: 'The wave of liberation movements and the birth of modern African nations.'
  },
  {
    id: 'modern',
    title: 'Modern Africa',
    period: '1990s - Present',
    description: 'The digital revolution, cultural explosion, and the shaping of the global future.'
  }
];
