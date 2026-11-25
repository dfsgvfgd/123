import React from 'react';
import type { RunItemId, SubSkillId } from '../game/types';

interface RunItemIconProps {
  itemId: RunItemId;
  color?: string;
  className?: string;
}

export const RunItemIcon: React.FC<RunItemIconProps> = ({
  itemId,
  color = '#F8FAFC',
  className = 'w-5 h-5',
}) => {
  switch (itemId) {
    case 'boots_double_jump':
      // Winged Boots (Double Jump)
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M5 12V17.5C5 18.6 5.9 19.5 7 19.5H16.5C17.6 19.5 18.5 18.7 18.5 17.6C18.5 16.5 17.6 15.6 16.5 15.6H12.5V8.5H6.5V12H5Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M12.5 9.5C15.5 7.5 18.5 5 20.5 4C19.8 6.8 18 9 15 10.5M13.5 12.2C16.2 11 18.6 9.6 20 8.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'boots_swift':
      // Lightning Wind Boots
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M6 7H12V14.5H17.5C18.6 14.5 19.5 15.4 19.5 16.5C19.5 17.6 18.6 18.5 17.5 18.5H6V7Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M3 10H9M2.5 13.5H7.5M15.5 4.5L13.5 8.5H16.5L14.5 12"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'boots_shadow_step':
      // Shadow Step Boots with Crescent
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M5.5 6.5L11.5 5.5V14.5H17.5C18.6 14.5 19.5 15.4 19.5 16.5C19.5 17.6 18.6 18.5 17.5 18.5H5.5V6.5Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 4.5A4 4 0 0 0 15 10.5A3.2 3.2 0 0 1 17.5 4.5Z"
            fill="currentColor"
          />
          <path d="M3 16.5H4.5M3 13H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'ring_crimson':
      // Crimson Ruby Ring
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <circle
            cx="12"
            cy="14"
            r="6.2"
            stroke="currentColor"
            strokeWidth="2.1"
          />
          <path
            d="M9.5 8L12 4.2L14.5 8L12 10.4L9.5 8Z"
            fill="currentColor"
            fillOpacity="0.45"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'ring_storm_spark':
      // Storm Spark Lightning Ring
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <circle
            cx="12"
            cy="14.2"
            r="5.8"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12.8 3.5L9.8 8.2H12.5L10.8 11.8L15 7H12.2L12.8 3.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'charm_crit':
      // Eagle Eye Crit Talisman
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M3.5 12C6 7.5 9 5.8 12 5.8C15 5.8 18 7.5 20.5 12C18 16.5 15 18.2 12 18.2C9 18.2 6 16.5 3.5 12Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 9.8V14.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'amulet_arcane':
      // Kalung Mana Suci — Necklace chain + glowing arcane crystal pendant (STRICTLY Necklace, never Shield!)
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          {/* Necklace Cord / Chain around neck */}
          <path
            d="M5.5 4.2C5.5 9.2 8.4 11.8 12 11.8C15.6 11.8 18.5 9.2 18.5 4.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeDasharray="1.8 1.4"
          />
          {/* Bail / Clasp Ring */}
          <circle cx="12" cy="12.2" r="1.4" fill="currentColor" />
          {/* Ornate Arcane Crystal Pendant Drop */}
          <path
            d="M12 13.6L16 17L12 21.2L8 17L12 13.6Z"
            fill="currentColor"
            fillOpacity="0.32"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 15.2V19.6M10.2 17.2H13.8" stroke="#F8FAFC" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );

    case 'tome_starlight':
      // Starlight Grimoire Open Book
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M3.5 6.5C6.5 5.5 9.5 6 12 7.5C14.5 6 17.5 5.5 20.5 6.5V18.5C17.5 17.5 14.5 18 12 19.5C9.5 18 6.5 17.5 3.5 18.5V6.5Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 7.5V19.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M16.2 9.8L16.8 11.3L18.3 11.8L16.8 12.3L16.2 13.8L15.6 12.3L14.1 11.8L15.6 11.3L16.2 9.8Z"
            fill="currentColor"
          />
        </svg>
      );

    case 'fang_vampire':
      // Twin Vampire Fangs
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M5 6.5H19M7 6.5L8.8 19.2L11.2 6.5M12.8 6.5L15.2 19.2L17 6.5"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.8" cy="20.6" r="1.1" fill="currentColor" />
        </svg>
      );

    case 'orb_frost_heart':
      // Frost Heart Crystal Orb
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="7.5"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M12 7.2V16.8M7.8 9.6L16.2 14.4M16.2 9.6L7.8 14.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'crest_berserker':
      // Titan Berserker Horned Helm / War Crest
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M4.5 5.5C4.5 9.2 6.8 11 9 11.5L12 20L15 11.5C17.2 11 19.5 9.2 19.5 5.5C17.8 7.5 16.2 8.2 14.5 8.2L12 5.2L9.5 8.2C7.8 8.2 6.2 7.5 4.5 5.5Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 9.5V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'cloak_vitality':
      // Iron-Blood Vitality Mantle / Cloak
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M8.5 5.2C10.5 3.8 13.5 3.8 15.5 5.2L19.5 18.8L15 17.5L12 20L9 17.5L4.5 18.8L8.5 5.2Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M9.5 8.5L12 10.5L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
};

interface SubSkillIconProps {
  skillId: SubSkillId;
  color?: string;
  className?: string;
}

export const SubSkillIcon: React.FC<SubSkillIconProps> = ({
  skillId,
  color = '#C084FC',
  className = 'w-5 h-5',
}) => {
  switch (skillId) {
    case 'sub_fireball':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M12.5 3.5C12.5 7 9.5 8.5 9.5 12.2C9.5 13.7 10.7 15 12.2 15C13.8 15 15 13.6 15 12C15 10.5 14 9.5 14 9.5C16.8 10.5 18.5 12.8 18.5 15.2C18.5 18.4 15.8 20.5 12 20.5C8.2 20.5 5.5 18 5.5 14.2C5.5 9.6 9.2 6.8 12.5 3.5Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'sub_firetrap':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M4 17.5H20M6 17.5L7.5 11.5L10 15L12 8.5L14 15L16.5 11.5L18 17.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="5.2" r="1.4" fill="currentColor" />
        </svg>
      );

    case 'sub_icearrow':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M4.5 19.5L18.5 5.5M12.5 5.5H18.5V11.5M4.5 15.5L7.5 16.5L8.5 19.5"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'sub_poison':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M9.5 4.2H14.5M10.5 4.2V8.2L6.2 15.5C5.5 16.8 6.4 19.2 8.2 19.2H15.8C17.6 19.2 18.5 16.8 17.8 15.5L13.5 8.2V4.2"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10.2" cy="15.2" r="1" fill="currentColor" />
          <circle cx="13.8" cy="13.6" r="1.2" fill="currentColor" />
        </svg>
      );

    case 'sub_lightning':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M13.5 3.5L6.5 13H12L10.5 20.5L17.5 11H12L13.5 3.5Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'sub_shadow_kunai':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M17.5 5.5L10.5 10.5L13.5 13.5L18.5 6.5L17.5 5.5Z"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M12 12L8.2 15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="6.5" cy="17.5" r="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );

    case 'sub_meteor':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <circle
            cx="8.5"
            cy="15.5"
            r="4.2"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M11.5 12.2L19.5 4.2M14.5 14.5L20 9M9.5 9.8L15 4.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'sub_frost_nova':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M12 3.5V20.5M4.6 7.8L19.4 16.2M19.4 7.8L4.6 16.2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path d="M9.8 5.5L12 7.5L14.2 5.5M9.8 18.5L12 16.5L14.2 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'sub_shadow_blades':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M12 4.5C16.8 4.5 19.5 7.5 19.5 11.5C17.2 9 14.8 8 12 8.2V4.5Z"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 19.5C7.2 19.5 4.5 16.5 4.5 12.5C6.8 15 9.2 16 12 15.8V19.5Z"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );

    case 'sub_dark_chains':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <rect
            x="4.5"
            y="10.5"
            width="7.5"
            height="4.5"
            rx="2.2"
            transform="rotate(-35 8.25 12.75)"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="11.5"
            y="8.5"
            width="7.5"
            height="4.5"
            rx="2.2"
            transform="rotate(-35 15.25 10.75)"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );

    case 'sub_abyss_spear':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M4.5 19.5L14.5 9.5M14.5 9.5L19.5 4.5L17.5 11.5L12.5 6.5L19.5 4.5"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'sub_blood_scythe':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M5.5 19.5L15 10M15 10C18 6 20 6.8 19.5 13C17.8 9.2 15.5 8.8 12.2 11.2L15 10Z"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17.8" cy="17.2" r="1.4" fill="currentColor" />
        </svg>
      );

    case 'sub_violet_thunder':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path d="M5.5 7.5H18.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path
            d="M13 7.5L9.5 13.5H13.5L10.5 20.5L16.5 12H12.5L13 7.5Z"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'sub_shadow_spikes':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M3.5 19H20.5M5.5 19L7.8 9.5L10 19M10.2 19L12.5 5.2L14.8 19M15 19L17.2 10.5L19.5 19"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'sub_razor_aura':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3.2 1.8" />
          <path
            d="M12 3.2L13.5 6.5M20.8 12L17.5 13.5M12 20.8L10.5 17.5M3.2 12L6.5 10.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'sub_crescent_boomerang':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M18.2 5.2C11.5 5.2 6.8 9.8 6.8 16.5C8.5 12.5 12 10 17.5 9.8L18.2 5.2Z"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 17.5A6.5 6.5 0 0 0 18.8 13.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="2.2 2"
          />
        </svg>
      );

    case 'sub_vertical_shockwave':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M9.5 19.5L12 4L14.5 19.5H9.5Z"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M5.5 19.5H18.5M7 14H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'sub_cosmic_needles':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color }} aria-hidden="true">
          <path
            d="M5 9.5L10.5 4M8.5 15.5L18.5 5.5M14.5 19.5L20 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="18.5" cy="5.5" r="1.4" fill="currentColor" />
          <circle cx="10.5" cy="4" r="1.1" fill="currentColor" />
        </svg>
      );
  }
};

export const SilverCoinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" fill="#475569" stroke="#E2E8F0" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5.5" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="2.5 1.8" />
    <path d="M12 8.2L14.2 12L12 15.8L9.8 12L12 8.2Z" fill="#F8FAFC" />
  </svg>
);
