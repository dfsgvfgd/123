import { getLobbyPropTitle } from './i18n';
import type { LanguageCode, LobbyInteractableKind, LobbyRoomId } from './types';

export const LOBBY_MAIN_W = 2400;
export const LOBBY_ENCHANT_W = 2200;
export const LOBBY_H = 680;
export const LOBBY_GROUND_Y = 530;

export interface LobbyPropConfig {
  kind: LobbyInteractableKind;
  x: number;
  y: number;
  label: string;
  subLabel: string;
  accent: string;
  facing: 1 | -1;
}

export function getLobbyRoomWidth(room: LobbyRoomId): number {
  return room === 'enchant' ? LOBBY_ENCHANT_W : LOBBY_MAIN_W;
}

export function getLobbyRoomSpawnX(room: LobbyRoomId): number {
  return room === 'enchant' ? 440 : 370;
}

export function getLobbyRoomProps(
  room: LobbyRoomId,
  lang: LanguageCode = 'id'
): LobbyPropConfig[] {
  if (room === 'enchant') {
    return [
      {
        kind: 'return_portal',
        x: 240,
        y: LOBBY_GROUND_Y,
        label: getLobbyPropTitle('return_portal', lang),
        subLabel: '',
        accent: '#C084FC',
        facing: 1,
      },
      {
        kind: 'enchant_altar',
        x: 920,
        y: LOBBY_GROUND_Y,
        label: getLobbyPropTitle('enchant_altar', lang),
        subLabel: '',
        accent: '#38BDF8',
        facing: 1,
      },
      {
        kind: 'weapon_shop',
        x: 1185,
        y: LOBBY_GROUND_Y,
        label: getLobbyPropTitle('weapon_shop', lang),
        subLabel: '',
        accent: '#F97316',
        facing: -1, // Pedagang faces LEFT toward center of Enchant Room & Altar
      },
      {
        kind: 'training_dummy',
        x: 1940,
        y: LOBBY_GROUND_Y,
        label: getLobbyPropTitle('training_dummy', lang),
        subLabel: '',
        accent: '#FACC15',
        facing: 1,
      },
    ];
  }

  return [
    {
      kind: 'gacha_statue',
      x: 190,
      y: LOBBY_GROUND_Y,
      label: getLobbyPropTitle('gacha_statue', lang),
      subLabel: '',
      accent: '#C084FC',
      facing: 1,
    },
    {
      kind: 'training_dummy',
      x: 560,
      y: LOBBY_GROUND_Y,
      label: getLobbyPropTitle('training_dummy', lang),
      subLabel: '',
      accent: '#FACC15',
      facing: 1,
    },
    {
      kind: 'stage_portal',
      x: 840,
      y: LOBBY_GROUND_Y,
      label: getLobbyPropTitle('stage_portal', lang),
      subLabel: '',
      accent: '#A855F7',
      facing: 1,
    },
    {
      kind: 'enchant_portal',
      x: 1720,
      y: LOBBY_GROUND_Y,
      label: getLobbyPropTitle('enchant_portal', lang),
      subLabel: '',
      accent: '#38BDF8',
      facing: 1,
    },
  ];
}
