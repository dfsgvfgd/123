import React, { useEffect, useState } from 'react';
import {
  Globe,
  Home,
  Keyboard,
  Move,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import {
  DEFAULT_KEYBINDINGS,
  DEFAULT_MOBILE_CONTROLS,
  formatKeyCodeLabel,
} from '../game/storage';
import type {
  AudioSettings,
  KeyActionId,
  Keybindings,
  LanguageCode,
  MobileControlsSettings,
} from '../game/types';
import { MobileLayoutEditor } from './MobileLayoutEditor';

interface SettingsModalProps {
  open: boolean;
  context: 'title' | 'lobby' | 'playing';
  language: LanguageCode;
  settings: AudioSettings;
  mobileControls: MobileControlsSettings;
  keybindings: Keybindings;
  onChangeLanguage: (lang: LanguageCode) => void;
  onChange: (next: AudioSettings) => void;
  onChangeMobileControls: (next: MobileControlsSettings) => void;
  onChangeKeybindings: (next: Keybindings) => void;
  onSaveAndClose: () => void;
  onResumeGame?: () => void;
  onGoToMainMenu?: () => void;
  onTestSfx: () => void;
}

const KEY_ACTION_LIST: Array<{ id: KeyActionId; labelId: string; labelEn: string }> = [
  { id: 'left', labelId: 'Gerak Kiri', labelEn: 'Move Left' },
  { id: 'right', labelId: 'Gerak Kanan', labelEn: 'Move Right' },
  { id: 'jump', labelId: 'Lompat', labelEn: 'Jump' },
  { id: 'down', labelId: 'Turun Platform', labelEn: 'Drop Down' },
  { id: 'dash', labelId: 'Dash', labelEn: 'Dash' },
  { id: 'skill1', labelId: 'Skill Karakter 1', labelEn: 'Hero Skill 1' },
  { id: 'skill2', labelId: 'Skill Karakter 2', labelEn: 'Hero Skill 2' },
  { id: 'skill3', labelId: 'Skill Karakter 3', labelEn: 'Hero Skill 3' },
  { id: 'interact', labelId: 'Interaksi', labelEn: 'Interact' },
  { id: 'inventory', labelId: 'Tas Stage', labelEn: 'Stage Bag' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  context,
  language,
  settings,
  mobileControls,
  keybindings,
  onChangeLanguage,
  onChange,
  onChangeMobileControls,
  onChangeKeybindings,
  onSaveAndClose,
  onResumeGame,
  onGoToMainMenu,
  onTestSfx,
}) => {
  const [capturingAction, setCapturingAction] = useState<KeyActionId | null>(null);
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
  const t = getUiStrings(language);

  useEffect(() => {
    if (!open || !capturingAction) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setCapturingAction(null);
        return;
      }
      onChangeKeybindings({
        ...keybindings,
        [capturingAction]: e.code,
      });
      setCapturingAction(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, capturingAction, keybindings, onChangeKeybindings]);

  useEffect(() => {
    if (!open) {
      setCapturingAction(null);
      setLayoutEditorOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const updateAudioField = (key: 'masterVolume' | 'bgmVolume' | 'sfxVolume', value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    onChange({
      ...settings,
      [key]: clamped,
    });
  };

  const updateMobileField = (key: keyof MobileControlsSettings, value: number) => {
    onChangeMobileControls({
      ...mobileControls,
      [key]: Math.round(value),
    });
  };

  const handleHeaderClose = () => {
    setCapturingAction(null);
    if (context === 'playing' && onResumeGame) {
      onResumeGame();
    } else {
      onSaveAndClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label={t.settingsTitle}
    >
      <div className="df-modal-frame w-full max-w-xl max-h-[85vh] flex flex-col rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="df-modal-header shrink-0 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sliders className="w-5 h-5 text-[#C084FC] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-[#F8FAFC] truncate">
                {t.settingsTitle}
              </h2>
              <p className="text-[11px] text-[#94A3B8] truncate">{t.settingsSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleHeaderClose}
            aria-label={t.closeBtn}
            className="p-1.5 text-[#CBD5E1] hover:text-[#FFFFFF] bg-[#181A28] border border-[#2F3347] rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 min-h-0 overflow-y-auto abyss-scroll p-5 space-y-6">
          {/* Language Switcher (ID / EN) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C084FC]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                {t.settingsLangTitle}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="lang-id"
                onClick={() => onChangeLanguage('id')}
                className={`py-2 px-3 rounded border text-xs font-bold cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#7E22CE] border-[#E9D5FF] text-[#FFFFFF]'
                    : 'bg-[#131521] border-[#252838] text-[#CBD5E1] hover:border-[#8A7656]'
                }`}
              >
                {t.settingsLangId}
              </button>
              <button
                type="button"
                data-testid="lang-en"
                onClick={() => onChangeLanguage('en')}
                className={`py-2 px-3 rounded border text-xs font-bold cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#7E22CE] border-[#E9D5FF] text-[#FFFFFF]'
                    : 'bg-[#131521] border-[#252838] text-[#CBD5E1] hover:border-[#8A7656]'
                }`}
              >
                {t.settingsLangEn}
              </button>
            </div>
          </div>

          {/* Audio Sliders */}
          <div className="pt-4 border-t border-[#252838] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              {t.settingsAudioTitle}
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <label htmlFor="slider-master" className="text-[#E2E8F0]">
                  {t.settingsMasterVol}
                </label>
                <span className="font-mono-num text-[#C084FC] font-bold">
                  {settings.muted ? '0%' : `${settings.masterVolume}%`}
                </span>
              </div>
              <input
                id="slider-master"
                type="range"
                min={0}
                max={100}
                value={settings.masterVolume}
                aria-label={t.settingsMasterVol}
                onChange={(e) => updateAudioField('masterVolume', Number(e.target.value))}
                className="w-full accent-[#C084FC] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <label htmlFor="slider-bgm" className="text-[#E2E8F0]">
                  {t.settingsBgmVol}
                </label>
                <span className="font-mono-num text-[#FACC15] font-bold">
                  {settings.bgmVolume}%
                </span>
              </div>
              <input
                id="slider-bgm"
                type="range"
                min={0}
                max={100}
                value={settings.bgmVolume}
                aria-label={t.settingsBgmVol}
                onChange={(e) => updateAudioField('bgmVolume', Number(e.target.value))}
                className="w-full accent-[#FACC15] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <label htmlFor="slider-sfx" className="text-[#E2E8F0]">
                  {t.settingsSfxVol}
                </label>
                <span className="font-mono-num text-[#38BDF8] font-bold">
                  {settings.sfxVolume}%
                </span>
              </div>
              <input
                id="slider-sfx"
                type="range"
                min={0}
                max={100}
                value={settings.sfxVolume}
                aria-label={t.settingsSfxVol}
                onChange={(e) => updateAudioField('sfxVolume', Number(e.target.value))}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onChange({ ...settings, muted: !settings.muted })}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border cursor-pointer ${
                  settings.muted
                    ? 'bg-[#7F1D1D]/60 border-[#EF4444] text-[#FECACA]'
                    : 'bg-[#181A28] border-[#2F3347] text-[#E2E8F0] hover:border-[#8A7656]'
                }`}
              >
                {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{settings.muted ? t.settingsUnmuteAll : t.settingsMuteAll}</span>
              </button>

              <button
                type="button"
                onClick={onTestSfx}
                className="px-3 py-2 text-xs font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#38BDF8] border border-[#2F3347] cursor-pointer"
              >
                {t.settingsTestSfx}
              </button>
            </div>
          </div>

          {/* Mobile Touch Layout Settings ("Kostum Tombol" Drag-and-Drop) */}
          <div className="pt-4 border-t border-[#252838] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Move className="w-4 h-4 text-[#F97316] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                    {t.settingsMobileLayoutTitle}
                  </h3>
                  <p className="text-[10px] text-[#94A3B8]">{t.settingsMobileLayoutHint}</p>
                </div>
              </div>
              <button
                type="button"
                data-testid="reset-mobile-layout"
                onClick={() => onChangeMobileControls({ ...DEFAULT_MOBILE_CONTROLS })}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#FACC15] border border-[#2F3347] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.settingsResetDefault}</span>
              </button>
            </div>

            <div className="p-3 rounded bg-[#131521] border border-[#252838] space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#CBD5E1]">{t.settingsOpacity}</span>
                  <span className="font-mono-num text-[#FACC15] font-bold">
                    {mobileControls.opacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={mobileControls.opacity}
                  aria-label={t.settingsOpacity}
                  onChange={(e) => updateMobileField('opacity', Number(e.target.value))}
                  className="w-full accent-[#FACC15] cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E2130]">
                <div className="text-[11px] font-mono-num text-[#94A3B8]">
                  D-Pad ({mobileControls.dpadOffsetX},{mobileControls.dpadOffsetY}) · Skill ({mobileControls.skillsOffsetX},{mobileControls.skillsOffsetY}) · Aksi ({mobileControls.actionOffsetX},{mobileControls.actionOffsetY})
                </div>
                <button
                  type="button"
                  data-testid="open-kostum-tombol"
                  onClick={() => setLayoutEditorOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded bg-[#F97316] hover:bg-[#FB923C] text-[#09090E] cursor-pointer"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>{t.settingsCustomButtonsBtn}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Keybindings Section (No manual attack keybind) */}
          <div className="pt-4 border-t border-[#252838] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#C084FC]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  {t.settingsKeysTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCapturingAction(null);
                  onChangeKeybindings({ ...DEFAULT_KEYBINDINGS });
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#CBD5E1] border border-[#2F3347] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.settingsResetKeys}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KEY_ACTION_LIST.map(({ id, labelId, labelEn }) => {
                const label = language === 'en' ? labelEn : labelId;
                const isCapturing = capturingAction === id;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-[#131521] border border-[#252838]"
                  >
                    <span className="text-xs text-[#CBD5E1] truncate">{label}</span>
                    <button
                      type="button"
                      onClick={() => setCapturingAction(isCapturing ? null : id)}
                      aria-label={label}
                      className={`min-w-[68px] px-2 py-1 text-[11px] font-mono-num font-bold rounded border cursor-pointer ${
                        isCapturing
                          ? 'bg-[#7E22CE] border-[#E9D5FF] text-[#FFFFFF]'
                          : 'bg-[#1D2033] hover:bg-[#282C45] border-[#383C52] text-[#FACC15]'
                      }`}
                    >
                      {isCapturing
                        ? t.settingsPressKey
                        : formatKeyCodeLabel(keybindings[id] ?? DEFAULT_KEYBINDINGS[id])}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation & Save Actions */}
        <div className="shrink-0 p-4 border-t border-[#252838] bg-[#11131E] flex flex-col gap-2">
          {context === 'playing' && onResumeGame && (
            <button
              type="button"
              onClick={onResumeGame}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#2F3347] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>{t.pauseResume}</span>
            </button>
          )}

          {context !== 'title' && onGoToMainMenu && (
            <button
              type="button"
              onClick={onGoToMainMenu}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded bg-[#181A28] hover:bg-[#241B2F] text-[#E9D5FF] border border-[#8A7656]/60 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>{language === 'en' ? 'Main Menu' : 'Menu Utama'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveAndClose}
            className="w-full py-2.5 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] text-[#09090E] cursor-pointer"
          >
            {context === 'playing'
              ? language === 'en'
                ? 'Save & Return to Lobby'
                : 'Simpan & Ke Lobi'
              : language === 'en'
                ? 'Save & Close'
                : 'Simpan & Tutup'}
          </button>
        </div>
      </div>

      <MobileLayoutEditor
        open={layoutEditorOpen}
        language={language}
        initialSettings={mobileControls}
        onSave={(next) => onChangeMobileControls(next)}
        onClose={() => setLayoutEditorOpen(false)}
      />
    </div>
  );
};
