import { describe, expect, it } from 'vitest';
import { RESTORE_MEDIA } from './restore-media.data';
import { filterRestoreMedia } from './restore-media';

describe('Restore Britain official archive', () => {
  it('includes only official-site stories and verified-channel video links', () => {
    expect(RESTORE_MEDIA.length).toBe(293);
    for (const item of RESTORE_MEDIA) {
      const url = new URL(item.url);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe(item.kind === 'story' ? 'www.restorebritain.org.uk' : 'www.youtube.com');
      if (item.kind !== 'story') expect(url.searchParams.get('v')).toBe(item.id);
    }
    expect(new Set(RESTORE_MEDIA.map(item => item.id)).size).toBe(293);
  });
  it('keeps stories and videos separate when selected', () => {
    expect(filterRestoreMedia('story', '').length).toBe(14);
    expect(filterRestoreMedia('video', '').length).toBe(125);
    expect(filterRestoreMedia('short', '').length).toBe(154);
    expect(filterRestoreMedia('story', 'e-bikes').map(item => item.title)).toEqual(['Regulating e-bikes for commercial use']);
  });
});