import React, { useEffect, useRef, useState } from 'react';
import { Check, Coins, Moon, ShoppingBag, Sparkles, Swords, Wand2, X } from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import {
  BLADE_STYLES,
  CHARACTER_ROSTER,
  LUNA_SCYTHE_ART_PATH,
  LUNA_SCYTHE_STYLES,
  LYRA_WEAPON_STYLES,
  WITCH_WEAPON_STYLES,
} from '../game/progression';
import { CleanPortrait } from './CleanPortrait';
import type {
  BladeStyleId,
  CharacterId,
  LanguageCode,
  LyraWeaponId,
  SaveData,
  ScytheWeaponId,
  WitchWeaponId,
} from '../game/types';
import {
  getLunaSprite,
  getLyraSprite,
  getVelveraSprite,
  getWeaponNpcSprite,
  getWitchSprite,
} from '../engine/pixelSprites';

type AnyWeaponSkinId = ScytheWeaponId | BladeStyleId | LyraWeaponId | WitchWeaponId;

interface WeaponShopModalProps {
  open: boolean;
  language?: LanguageCode;
  save: SaveData;
  onClose: () => void;
  onBuyOrEquip: (charId: CharacterId, weaponId: AnyWeaponSkinId) => void;
  onSelectCharacter: (id: CharacterId) => void;
}

export const WeaponShopModal: React.FC<WeaponShopModalProps> = ({
  open,
  language = 'id',
  save,
  onClose,
  onBuyOrEquip,
  onSelectCharacter,
}) => {
  const t = getUiStrings(language);
  const [activeTab, setActiveTab] = useState<CharacterId>(save.selectedCharacter ?? 'luna');
  const [hoveredLuna, setHoveredLuna] = useState<ScytheWeaponId | null>(null);
  const [hoveredVelvera, setHoveredVelvera] = useState<BladeStyleId | null>(null);
  const [hoveredLyra, setHoveredLyra] = useState<LyraWeaponId | null>(null);
  const [hoveredWitch, setHoveredWitch] = useState<WitchWeaponId | null>(null);
  const npcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(save.selectedCharacter ?? 'luna');
      setHoveredLuna(null);
      setHoveredVelvera(null);
      setHoveredLyra(null);
      setHoveredWitch(null);
    }
  }, [open, save.selectedCharacter]);

  useEffect(() => {
    if (!open) return;
    const c = npcCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    const npcSpr = getWeaponNpcSprite(0);
    ctx.drawImage(npcSpr, 4, 2, 56, 74);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const c = previewCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    const spr =
      activeTab === 'luna'
        ? getLunaSprite(
            'slash1',
            hoveredLuna ?? save.lunaWeapon?.style ?? 'umbral_crescent_scythe',
            false
          )
        : activeTab === 'witch'
          ? getWitchSprite(
              'cast',
              hoveredWitch ?? save.witchWeapon?.style ?? 'raven_gnarled_staff',
              false
            )
          : activeTab === 'lyra'
            ? getLyraSprite(
                'slash1',
                true,
                false,
                hoveredLyra ?? save.lyraWeapon?.style ?? 'iron_knuckle'
              )
            : getVelveraSprite(
                'slash1',
                hoveredVelvera ?? save.weapon.style,
                save.weapon.aura,
                false
              );
    const scale = Math.min((c.width - 12) / spr.width, (c.height - 12) / spr.height);
    const dw = Math.round(spr.width * scale);
    const dh = Math.round(spr.height * scale);
    ctx.drawImage(spr, Math.round((c.width - dw) * 0.5), Math.round((c.height - dh) * 0.5), dw, dh);
  }, [
    open,
    activeTab,
    hoveredLuna,
    hoveredVelvera,
    hoveredLyra,
    hoveredWitch,
    save.lunaWeapon?.style,
    save.weapon.style,
    save.weapon.aura,
    save.lyraWeapon?.style,
    save.witchWeapon?.style,
  ]);

  if (!open) return null;

  const charMeta = CHARACTER_ROSTER[activeTab];

  const activePreviewWeapon = (() => {
    if (activeTab === 'luna') {
      const def = LUNA_SCYTHE_STYLES[hoveredLuna ?? save.lunaWeapon?.style ?? 'umbral_crescent_scythe'];
      return {
        name: def.name,
        atkBonus: def.atkBonus,
        critBonus: def.critBonus,
        speedBonus: def.speedBonus,
        accentHex: '#818CF8',
      };
    }
    if (activeTab === 'witch') {
      const def = WITCH_WEAPON_STYLES[hoveredWitch ?? save.witchWeapon?.style ?? 'raven_gnarled_staff'];
      return {
        name: def.name,
        atkBonus: def.atkBonus,
        critBonus: def.critBonus,
        speedBonus: def.speedBonus,
        accentHex: '#C084FC',
      };
    }
    if (activeTab === 'lyra') {
      const def = LYRA_WEAPON_STYLES[hoveredLyra ?? save.lyraWeapon?.style ?? 'iron_knuckle'];
      return {
        name: def.name,
        atkBonus: def.atkBonus,
        critBonus: def.critBonus,
        speedBonus: def.speedBonus,
        accentHex: '#F97316',
      };
    }
    const def = BLADE_STYLES[hoveredVelvera ?? save.weapon.style];
    return {
      name: def.name,
      atkBonus: def.atkBonus,
      critBonus: def.critBonus,
      speedBonus: def.speedBonus,
      accentHex: '#C084FC',
    };
  })();

  const catalogItems: Array<{
    id: AnyWeaponSkinId;
    name: string;
    subtitle: string;
    atkBonus: number;
    critBonus: number;
    speedBonus: number;
    shopPrice: number;
    unlocked: boolean;
    equipped: boolean;
    equipLabel: string;
    activeBg: string;
    activeBorder: string;
    buttonBg: string;
    accentText: string;
    onHover: (hovering: boolean) => void;
  }> = (() => {
    if (activeTab === 'luna') {
      return (Object.keys(LUNA_SCYTHE_STYLES) as ScytheWeaponId[]).map((id) => {
        const st = LUNA_SCYTHE_STYLES[id];
        return {
          id,
          name: st.name,
          subtitle: st.subtitle,
          atkBonus: st.atkBonus,
          critBonus: st.critBonus,
          speedBonus: st.speedBonus,
          shopPrice: st.shopPrice,
          unlocked: (save.unlockedLunaWeapons ?? ['umbral_crescent_scythe']).includes(id),
          equipped: (save.lunaWeapon?.style ?? 'umbral_crescent_scythe') === id,
          equipLabel: 'Pasang Sabit',
          activeBg: 'bg-[#171936]',
          activeBorder: 'border-[#818CF8]',
          buttonBg: 'bg-[#4F46E5] hover:bg-[#6366F1]',
          accentText: 'text-[#818CF8]',
          onHover: (h) => setHoveredLuna(h ? id : null),
        };
      });
    }
    if (activeTab === 'witch') {
      return (Object.keys(WITCH_WEAPON_STYLES) as WitchWeaponId[]).map((id) => {
        const st = WITCH_WEAPON_STYLES[id];
        return {
          id,
          name: st.name,
          subtitle: st.subtitle,
          atkBonus: st.atkBonus,
          critBonus: st.critBonus,
          speedBonus: st.speedBonus,
          shopPrice: st.shopPrice,
          unlocked: (save.unlockedWitchWeapons ?? ['raven_gnarled_staff']).includes(id),
          equipped: (save.witchWeapon?.style ?? 'raven_gnarled_staff') === id,
          equipLabel: 'Pasang Tongkat',
          activeBg: 'bg-[#221536]',
          activeBorder: 'border-[#A855F7]',
          buttonBg: 'bg-[#7E22CE] hover:bg-[#9333EA]',
          accentText: 'text-[#C084FC]',
          onHover: (h) => setHoveredWitch(h ? id : null),
        };
      });
    }
    if (activeTab === 'lyra') {
      return (Object.keys(LYRA_WEAPON_STYLES) as LyraWeaponId[]).map((id) => {
        const st = LYRA_WEAPON_STYLES[id];
        return {
          id,
          name: st.name,
          subtitle: st.subtitle,
          atkBonus: st.atkBonus,
          critBonus: st.critBonus,
          speedBonus: st.speedBonus,
          shopPrice: st.shopPrice,
          unlocked: (save.unlockedLyraWeapons ?? ['iron_knuckle']).includes(id),
          equipped: (save.lyraWeapon?.style ?? 'iron_knuckle') === id,
          equipLabel: 'Pasang Gauntlet & Greaves',
          activeBg: 'bg-[#2B140C]',
          activeBorder: 'border-[#F97316]',
          buttonBg: 'bg-[#EA580C] hover:bg-[#F97316]',
          accentText: 'text-[#F97316]',
          onHover: (h) => setHoveredLyra(h ? id : null),
        };
      });
    }
    return (Object.keys(BLADE_STYLES) as BladeStyleId[]).map((id) => {
      const st = BLADE_STYLES[id];
      return {
        id,
        name: st.name,
        subtitle: st.subtitle,
        atkBonus: st.atkBonus,
        critBonus: st.critBonus,
        speedBonus: st.speedBonus,
        shopPrice: st.shopPrice,
        unlocked: save.unlockedBladeStyles.includes(id),
        equipped: save.weapon.style === id,
        equipLabel: 'Pasang Dual Blade',
        activeBg: 'bg-[#221536]',
        activeBorder: 'border-[#C084FC]',
        buttonBg: 'bg-[#7E22CE] hover:bg-[#9333EA]',
        accentText: 'text-[#C084FC]',
        onHover: (h) => setHoveredVelvera(h ? id : null),
      };
    });
  })();

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label="Toko Senjata NPC"
    >
      <div className="df-modal-frame w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="df-modal-header shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <canvas
              ref={npcCanvasRef}
              width={64}
              height={78}
              className="pixelated rounded border border-[#8A7656]/55 bg-[#09090E] shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#F97316]">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t.shopTitle}</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#F8FAFC]">
                {language === 'en' ? 'Hero Weapon Skins & Gear' : 'Toko Skin & Senjata Karakter'}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {language === 'en'
                  ? "Purchase & equip Scythe, Dual Blade, Gauntlet, or Seraphina's Lantern Staff."
                  : 'Beli Sabit Luna, Dual Blade Velvera, Gauntlet Lyra, atau Tongkat Lentera Seraphina.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              aria-label={`Gold ${save.gold}`}
              className="flex items-center gap-1.5 bg-[#0A0B11] border border-[#FACC15]/55 rounded-md px-3 py-1.5"
            >
              <Coins className="w-4 h-4 text-[#FACC15]" />
              <span className="font-mono-num text-sm font-bold text-[#FEF08A]">
                {save.gold.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeBtn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-[#1B1D2B] hover:bg-[#272A3D] border border-[#383C52] rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>{t.closeBtn}</span>
            </button>
          </div>
        </div>

        {/* Character Tabs */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b border-[#252838] bg-[#0B0C13]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'luna', label: 'Luna · Sabit', icon: <Moon className="w-3.5 h-3.5" /> },
                { id: 'velvera', label: 'Velvera · Dual Blade', icon: <Swords className="w-3.5 h-3.5" /> },
                { id: 'lyra', label: 'Lyra · Tangan & Kaki', icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: 'witch', label: 'Seraphina · Tongkat', icon: <Wand2 className="w-3.5 h-3.5" /> },
              ] as Array<{ id: CharacterId; label: string; icon: React.ReactNode }>
            ).map((t) => {
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    isSelected
                      ? 'text-[#09090E]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] bg-[#141621]'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: CHARACTER_ROSTER[t.id].accentHex }
                      : undefined
                  }
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {save.selectedCharacter !== activeTab && (
            <button
              type="button"
              onClick={() => onSelectCharacter(activeTab)}
              className="px-3 py-1.5 text-[11px] font-bold rounded bg-[#181A28] hover:bg-[#24273A] text-[#FACC15] border border-[#8A7656]/60 cursor-pointer"
            >
              Pakai {charMeta.name}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto abyss-scroll p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Live Character + Weapon Skin Preview */}
          <div className="lg:col-span-4 flex flex-col items-center justify-between p-4 rounded-md bg-[#12131D] border border-[#26293A]">
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#B09567]">
                Pratinjau Skin {charMeta.name}
              </div>
              <div className="font-display text-base font-bold text-[#F8FAFC] mt-0.5">
                {activePreviewWeapon.name}
              </div>
            </div>

            <div className="my-3 flex items-center justify-center gap-2.5">
              <canvas
                ref={previewCanvasRef}
                width={144}
                height={160}
                className="pixelated rounded bg-[#09090E] border border-[#252838]"
              />
              {activeTab === 'luna' && (
                <div className="w-20 h-[160px] rounded border border-[#818CF8]/45 bg-[#09090E] flex items-center justify-center p-1">
                  <CleanPortrait
                    src={LUNA_SCYTHE_ART_PATH}
                    alt="Sabit Kosmik Luna"
                    removeSolidBg
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="w-full text-xs font-mono-num space-y-1.5 pt-2 border-t border-[#1E2130]">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Bonus Attack</span>
                <span className="font-bold" style={{ color: activePreviewWeapon.accentHex }}>
                  +{activePreviewWeapon.atkBonus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Bonus Crit</span>
                <span className="text-[#FACC15] font-bold">
                  +{Math.round(activePreviewWeapon.critBonus * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Bonus Speed</span>
                <span className="text-[#38BDF8] font-bold">
                  +{Math.round(activePreviewWeapon.speedBonus * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Weapon Catalog List */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            {catalogItems.map((item) => {
              const canBuy = save.gold >= item.shopPrice;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => item.onHover(true)}
                  onMouseLeave={() => item.onHover(false)}
                  className={`p-4 rounded-md border flex flex-col justify-between gap-3 ${
                    item.equipped
                      ? `${item.activeBg} ${item.activeBorder}`
                      : 'bg-[#12131D] border-[#26293A] hover:border-[#8A7656]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[#F8FAFC]">
                        {item.name}
                      </span>
                      {item.equipped && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4ADE80]">
                          <Check className="w-3 h-3" />
                          Dipakai
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                      {item.subtitle}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] font-mono-num">
                      <span className={`px-2 py-0.5 rounded bg-[#181A28] ${item.accentText}`}>
                        +{item.atkBonus} ATK
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#181A28] text-[#FACC15]">
                        +{Math.round(item.critBonus * 100)}% Crit
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#181A28] text-[#38BDF8]">
                        +{Math.round(item.speedBonus * 100)}% Spd
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={item.equipped || (!item.unlocked && !canBuy)}
                    onClick={() => onBuyOrEquip(activeTab, item.id)}
                    className={`w-full py-2 text-xs font-bold rounded cursor-pointer disabled:cursor-not-allowed ${
                      item.equipped
                        ? 'bg-[#1A1C2A] text-[#4ADE80] border border-[#4ADE80]/40'
                        : item.unlocked
                          ? `${item.buttonBg} text-[#FFFFFF]`
                          : canBuy
                            ? 'bg-[#FACC15] hover:bg-[#FDE047] text-[#09090E]'
                            : 'bg-[#1A1C2A] text-[#64748B] opacity-55'
                    }`}
                  >
                    {item.equipped
                      ? 'Sedang Dipakai'
                      : item.unlocked
                        ? item.equipLabel
                        : `Beli (${item.shopPrice.toLocaleString('id-ID')} Gold)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

