import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Volume2,
  VolumeX,
  Zap,
  Crosshair,
  Wind,
  Cpu,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ArenaLayerId, PlayerStats } from '../engine/types';
import { ARENA_CATALOG } from '../engine/arenas';
import { soundEngine } from '../engine/audio';

interface ArchitectDockProps {
  stats: PlayerStats;
  onSwitchArena: (layerId: ArenaLayerId) => void;
  onAttackSword: () => void;
  onFireCannon: () => void;
  onTeleport: () => void;
  onToggleOverclock: () => void;
  onPurgeCoolant: () => void;
}

export const ArchitectDock: React.FC<ArchitectDockProps> = ({
  stats,
  onSwitchArena,
  onAttackSword,
  onFireCannon,
  onTeleport,
  onToggleOverclock,
  onPurgeCoolant,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'arenas' | 'controls'>('telemetry');

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const currentArenaInfo = ARENA_CATALOG[stats.currentArena];
  const heatRatio = (stats.temperature - 25) / 75;

  return (
    <>
      {/* Top Header Badge (Minimal top-left signature & spec badge) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-cyan-400 rotate-45" />
          <span className="font-orbitron font-extrabold text-sm tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">
            OVERCLOCKED: KERNEL SLAYER
          </span>
          <span className="text-[10px] bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
            x86-64 / ARM64 ASM ENGINE
          </span>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono tracking-tight">
          Yazar & Baş Mimar: <span className="text-neutral-200 font-semibold">Enes Öztürk</span>
        </div>
      </div>

      {/* Top Right Quick Toggles */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowGuide(!showGuide)}
          aria-label="Toggle Guide"
          className="p-2 rounded bg-neutral-900/80 border border-neutral-700/80 hover:border-cyan-400 text-neutral-300 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMute}
          aria-label="Toggle Audio"
          className={`p-2 rounded bg-neutral-900/80 border transition-colors cursor-pointer ${
            isMuted
              ? 'border-red-500/50 text-red-400'
              : 'border-neutral-700/80 hover:border-cyan-400 text-neutral-300 hover:text-cyan-300'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 p-6 rounded-lg text-neutral-200 font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h3 className="font-orbitron text-sm font-bold text-cyan-400">
                ENES ÖZTÜRK // SİBER-KİNETİK SAVAŞ PROTOKOLÜ
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-cyan-300 font-bold">KONTROLLER & KISAYOLLAR:</div>
              <ul className="space-y-1.5 text-neutral-300">
                <li><span className="text-neutral-400 font-bold">[W A S D]:</span> Siber-Kinetik Hareket</li>
                <li><span className="text-neutral-400 font-bold">[BOŞLUK / SPACE]:</span> Zıplama & Dikey Kaçış</li>
                <li><span className="text-cyan-400 font-bold">[SOL TIK / J]:</span> Monolitik Kinetik Kılıç (The Bus-Blade)</li>
                <li><span className="text-red-400 font-bold">[SAĞ TIK / K]:</span> Derleyici Topu (The Compiler Cannon)</li>
                <li><span className="text-amber-400 font-bold">[Q]:</span> İşaretçi Işınlanması (*ptr=&Enes) + Bullet-Time</li>
                <li><span className="text-rose-400 font-bold">[SHIFT / F]:</span> Overclock Modu (Aşırı Hızlandırma)</li>
                <li><span className="text-blue-400 font-bold">[E]:</span> Soğutma Vanası Boşaltımı (Coolant Purge)</li>
              </ul>
            </div>
            <div className="border-t border-neutral-800 pt-2 text-[11px] text-neutral-400">
              * Ekranda yapay can barı veya mermi sayacı yoktur. Zırhınızın omurga kanalları mavi iken serin, turuncu/kırmızı iken aşırı ısınmış durumdadır.
            </div>
          </div>
        </div>
      )}

      {/* Unified Ergonomic Bottom Dock (Three.js skill directive) */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-transform duration-300 ease-out"
        style={{
          width: 'min(940px, 94vw)',
          transform: isCollapsed ? 'translate(-50%, calc(100% - 32px))' : 'translate(-50%, 0)',
        }}
      >
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-md bg-neutral-900 border-t border-x border-neutral-700 hover:border-cyan-500/80 text-[11px] font-mono font-medium text-neutral-300 hover:text-cyan-300 cursor-pointer shadow-lg transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>▴ SİSTEM TELEMETRİSİ & KONTROL PANELİ</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>▾ ZERO-UI SİNEMA MODU (PANELLERİ GİZLE)</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div className="w-full bg-neutral-950/95 border border-neutral-800 rounded-lg p-3 shadow-2xl flex flex-col gap-2.5">
          {/* Top Bar: Tabs & Quick Action Triggers */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  activeTab === 'telemetry'
                    ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ASM TELEMETRİ
              </button>
              <button
                onClick={() => setActiveTab('arenas')}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  activeTab === 'arenas'
                    ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                5 DONANIM ARENASI
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  activeTab === 'controls'
                    ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                DOKUNMATİK SAVAŞ
              </button>
            </div>

            {/* Tactical Battle Triggers */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onAttackSword}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-cyan-950 border border-neutral-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Kılıç Darbesi (Sol Tık)"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>KILIÇ</span>
              </button>
              <button
                onClick={onFireCannon}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-rose-950 border border-neutral-700 hover:border-rose-400 text-rose-300 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Derleyici Topu (Sağ Tık)"
              >
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                <span>TOP</span>
              </button>
              <button
                onClick={onTeleport}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-purple-950 border border-neutral-700 hover:border-purple-400 text-purple-300 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="İşaretçi Işınlanması (*ptr=&Enes)"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>IŞINLAN [Q]</span>
              </button>
              <button
                onClick={onToggleOverclock}
                className={`px-2.5 py-1 rounded font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  stats.overclocked
                    ? 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_10px_#ef4444]'
                    : 'bg-neutral-800 hover:bg-amber-950 border border-neutral-700 hover:border-amber-400 text-amber-300'
                }`}
                title="Aşırı Hızlandırma Modu"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>OVERCLOCK</span>
              </button>
              <button
                onClick={onPurgeCoolant}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-blue-950 border border-neutral-700 hover:border-blue-400 text-blue-300 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Soğutma Vanası Boşaltımı"
              >
                <Wind className="w-3.5 h-3.5 text-blue-400" />
                <span>SOĞUT [E]</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Real-Time Assembly Registers & Hardware Status */}
          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-xs">
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[10px] text-neutral-400">RAX // MİMAR</div>
                <div className="text-cyan-400 font-bold truncate">0xENES_OZTURK</div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[10px] text-neutral-400">RBX // FREKANS</div>
                <div className="text-amber-400 font-bold">
                  {stats.clockFrequency.toFixed(1)} GHz {stats.overclocked && '(VOLT OVERRIDE)'}
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[10px] text-neutral-400">RCX // SICAKLIK (ISI)</div>
                <div className={`font-bold ${heatRatio > 0.7 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {stats.temperature.toFixed(0)}°C {heatRatio > 0.8 && 'THROTTLING!'}
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[10px] text-neutral-400">RDX // KILIÇ ŞARJI</div>
                <div className="text-blue-400 font-bold">
                  {Math.round(stats.bladeCharge * 100)}% (CRYSTAL EMIT)
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[10px] text-neutral-400">RIP // İŞARETÇİ KONUMU</div>
                <div className="text-purple-400 font-bold truncate">
                  *ptr = &Enes
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 5 Seamless Arenas Switcher */}
          {activeTab === 'arenas' && (
            <div className="flex flex-col gap-2 font-mono">
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>AKTİF KATMAN: <strong className="text-neutral-200">{currentArenaInfo.codename}</strong></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-xs">
                {([1, 2, 3, 4, 5] as ArenaLayerId[]).map((layerId) => {
                  const info = ARENA_CATALOG[layerId];
                  const isSelected = stats.currentArena === layerId;
                  return (
                    <button
                      key={layerId}
                      onClick={() => onSwitchArena(layerId)}
                      className={`p-2 rounded text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                      }`}
                    >
                      <div className="text-[10px] text-neutral-400">KATMAN {layerId}</div>
                      <div className="truncate text-xs">{info.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Tactical Quick Controls Info */}
          {activeTab === 'controls' && (
            <div className="text-xs font-mono text-neutral-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800">
                <span className="text-cyan-400 font-bold">SOL TIK:</span> 3 Vuruşlu Kılıç Kombosu
              </div>
              <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800">
                <span className="text-rose-400 font-bold">SAĞ TIK:</span> Bozuk Paket Mermisi
              </div>
              <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800">
                <span className="text-purple-400 font-bold">Q TUŞU:</span> Bellek Düğümüne Işınlan
              </div>
              <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800">
                <span className="text-amber-400 font-bold">SHIFT / F:</span> Overclock (2x Hız)
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
