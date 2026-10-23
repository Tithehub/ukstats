import { RESTORE_MEDIA, type RestoreMediaItem } from './restore-media.data';

export function filterRestoreMedia(kind: 'all' | RestoreMediaItem['kind'], query: string) {
  const needle = query.trim().toLocaleLowerCase('en-GB');
  return RESTORE_MEDIA.filter(item => (kind === 'all' || item.kind === kind) && (!needle || item.title.toLocaleLowerCase('en-GB').includes(needle)));
}