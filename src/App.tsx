import React, { useRef, useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { DiegeticVisorOverlay } from './components/DiegeticVisorOverlay';
import { ArchitectDock } from './components/ArchitectDock';
import { KernelSlayerGame } from './engine/game';
import { ArenaLayerId, PlayerStats } from './engine/types';
import { soundEngine } from './engine/audio';
import { Flame, Play, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const gameRef = useRef<KernelSlayerGame | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    temperature: 25,
    maxTemperature: 100,
    overclocked: false,
    clockFrequency: 5.2,
    comboCount: 0,
    comboTimer: 0,
    bladeCharge: 0.3,
    compilerAmmo: 12,
    maxCompilerAmmo: 12,
    isTeleporting: false,
    bulletTimeRemaining: 0,
    visorCracks: 0,
    score: 0,
    enemiesKilled: 0,
    currentArena: 1,
  });

  const handleStatsUpdate = useCallback((newStats: PlayerStats) => {
    setStats({ ...newStats });
  }, []);

  const handleStartGame = () => {
    soundEngine.init();
    soundEngine.ensureContext();
    setHasStarted(true);
  };

  const handleSwitchArena = (layerId: ArenaLayerId) => {
    if (gameRef.current) {
      gameRef.current.switchArena(layerId);
    }
  };

  const handleAttackSword = () => {
    if (gameRef.current) {
      gameRef.current.attackSword();
    }
  };

  const handleFireCannon = () => {
    if (gameRef.current) {
      gameRef.current.fireCompilerCannon();
    }
  };

  const handleTeleport = () => {
    if (gameRef.current) {
      gameRef.current.triggerTeleport();
    }
  };

  const handleToggleOverclock = () => {
    if (gameRef.current) {
      gameRef.current.toggleOverclock();
    }
  };

  const handlePurgeCoolant = () => {
    if (gameRef.current) {
      gameRef.current.purgeCoolant();
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-neutral-100 select-none">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas onStatsUpdate={handleStatsUpdate} gameRef={gameRef} />

      {/* Diegetic In-World Visor Overlay */}
      <DiegeticVisorOverlay
        stats={stats}
        isBulletTime={stats.bulletTimeRemaining > 0}
        isOverclocked={stats.overclocked}
      />

      {/* Ergonomic Collapsible Bottom Control Dock */}
      {hasStarted && (
        <ArchitectDock
          stats={stats}
          onSwitchArena={handleSwitchArena}
          onAttackSword={handleAttackSword}
          onFireCannon={handleFireCannon}
          onTeleport={handleTeleport}
          onToggleOverclock={handleToggleOverclock}
          onPurgeCoolant={handlePurgeCoolant}
        />
      )}

      {/* Initial Epic Launch Screen */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
            {/* Header Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 font-mono text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>ENES-OVERCLOCK ENGINE // SAF C++26 & ASM MİMARİSİ</span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-orbitron text-4xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-400 drop-shadow-[0_0_25px_rgba(0,240,255,0.6)]">
                OVERCLOCKED
              </h1>
              <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold tracking-widest text-neutral-300">
                KERNEL SLAYER
              </h2>
              <p className="text-xs sm:text-sm font-mono text-cyan-400/90 tracking-widest uppercase">
                Yazar, Baş Mimar & Sistem Tasarımcısı: <strong className="text-white">Enes Öztürk</strong>
              </p>
            </div>

            {/* Description & Pillars */}
            <div className="text-xs font-mono text-neutral-400 max-w-lg leading-relaxed bg-neutral-900/60 p-4 rounded border border-neutral-800 text-left space-y-2">
              <p className="text-neutral-300">
                Küresel süper bilgisayar ağını istila eden kötücül yapay zeka çekirdeklerine karşı Baş Çekirdek Savaşçısı Enes Öztürk olarak savaşın.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                <div className="text-cyan-400">⚔️ Monolitik Kinetik Kılıç (The Bus-Blade)</div>
                <div className="text-rose-400">💥 Derleyici Topu (Compiler Cannon)</div>
                <div className="text-purple-400">⚡ *ptr = &Enes Işınlanması</div>
                <div className="text-amber-400">🔥 Aşırı Hızlandırma & Isı Riski</div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStartGame}
              className="px-8 py-3 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-extrabold tracking-wider text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.5)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>BAŞLAT: SİSTEM ÇEKİRDEĞİNE GİRİŞ</span>
            </button>

            <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-neutral-400" />
              <span>Mutlak Diegetik Sıfır-UI: Can ve mermiler zırh omurgası ve kılıç tüpünden okunur.</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
