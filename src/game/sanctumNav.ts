export type SanctumTab = 'gacha' | 'weapon' | 'skills' | 'bestiary' | 'daily' | 'events';
export type SanctumScope = 'character' | 'gacha' | 'weapon' | 'events' | 'daily';

export interface SanctumNavConfig {
  scope: SanctumScope;
  primaryTabs: SanctumTab[];
  sideTab: SanctumTab | null;
}

export function getScopeForSanctumTab(tab: SanctumTab): SanctumScope {
  if (tab === 'gacha') return 'gacha';
  if (tab === 'daily') return 'daily';
  if (tab === 'events') return 'events';
  if (tab === 'weapon') return 'weapon';
  return 'character';
}

export function getSanctumNavForScope(scope: SanctumScope): SanctumNavConfig {
  if (scope === 'character') {
    return {
      scope: 'character',
      primaryTabs: ['skills', 'weapon'],
      sideTab: null,
    };
  }
  if (scope === 'gacha') {
    return {
      scope: 'gacha',
      primaryTabs: ['gacha'],
      sideTab: null,
    };
  }
  if (scope === 'events') {
    return {
      scope: 'events',
      primaryTabs: ['events'],
      sideTab: null,
    };
  }
  if (scope === 'daily') {
    return {
      scope: 'daily',
      primaryTabs: ['daily'],
      sideTab: null,
    };
  }
  return {
    scope: 'weapon',
    primaryTabs: ['weapon'],
    sideTab: null,
  };
}
