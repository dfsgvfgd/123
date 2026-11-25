export type SanctumTab = 'gacha' | 'weapon' | 'skills' | 'bestiary' | 'daily' | 'events';
export type SanctumScope = 'character' | 'gacha' | 'weapon';

export interface SanctumNavConfig {
  scope: SanctumScope;
  primaryTabs: SanctumTab[];
  sideTab: SanctumTab | null;
}

export function getScopeForSanctumTab(tab: SanctumTab): SanctumScope {
  if (tab === 'gacha' || tab === 'daily') return 'gacha';
  if (tab === 'weapon') return 'weapon';
  return 'character';
}

export function getSanctumNavForScope(scope: SanctumScope): SanctumNavConfig {
  if (scope === 'character') {
    return {
      scope: 'character',
      primaryTabs: ['skills', 'weapon'],
      sideTab: 'events',
    };
  }
  if (scope === 'gacha') {
    return {
      scope: 'gacha',
      primaryTabs: ['gacha'],
      sideTab: 'daily',
    };
  }
  return {
    scope: 'weapon',
    primaryTabs: ['weapon'],
    sideTab: null,
  };
}
