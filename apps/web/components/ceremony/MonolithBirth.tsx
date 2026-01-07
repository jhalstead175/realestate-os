// components/ceremony/MonolithBirth.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MonolithBirth() {
  const [stage, setStage] = useState<'void' | 'align' | 'crackle' | 'birth' | 'pulse' | 'ash'>('void');
  const [parallaxLayers, setParallaxLayers] = useState<number[]>([]);

  // Stage progression
  useEffect(() => {
    const stages = ['void', 'align', 'crackle', 'birth', 'pulse', 'ash'] as const;
    let currentIndex = 0;

    const advanceStage = () => {
      if (currentIndex < stages.length - 1) {
        currentIndex++;
        setStage(stages[currentIndex]);
      }
    };

    const timers = [
      setTimeout(() => advanceStage(), 1000),   // void → align
      setTimeout(() => advanceStage(), 3000),   // align → crackle
      setTimeout(() => advanceStage(), 4500),   // crackle → birth
      setTimeout(() => advanceStage(), 6000),   // birth → pulse
      setTimeout(() => advanceStage(), 7500),   // pulse → ash
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Generate parallax depth layers
  useEffect(() => {
    if (stage === 'birth') {
      const layers = Array.from({ length: 12 }, (_, i) => i);
      setParallaxLayers(layers);
    }
  }, [stage]);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden">

      {/* Parallax Depth Field */}
      <div className="absolute inset-0">
        {parallaxLayers.map((layer) => (
          <motion.div
            key={layer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 + (layer * 0.005) }}
            className="absolute inset-0 border border-gray-700/20 rounded-3xl"
            style={{
              transform: `scale(${1 + layer * 0.05})`,
              filter: `blur(${layer * 0.5}px)`,
            }}
          />
        ))}
      </div>

      {/* Gravitational Void */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black to-black" />

      {/* Fractured Glyph Fragments */}
      <div className="relative flex items-center justify-center gap-24 z-20">

        {/* Left Fragment */}
        <motion.div
          animate={{
            x: stage === 'align' || stage === 'crackle' ? 0 : -200,
            opacity: stage === 'void' ? 0.7 : 1,
            rotate: stage === 'align' || stage === 'crackle' ? 0 : -5,
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-64 h-96 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-600/30 shadow-2xl">
            <div className="absolute inset-0 bg-[url('/granite-texture.jpg')] opacity-10 rounded-2xl" />
          </div>
        </motion.div>

        {/* Molten Gold Bridge */}
        <AnimatePresence>
          {stage === 'crackle' && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="absolute w-24 h-1 bg-gradient-to-r from-transparent via-amber-300 to-amber-500 to-transparent shadow-[0_0_30px_#fbbf24]"
            />
          )}
        </AnimatePresence>

        {/* Right Fragment */}
        <motion.div
          animate={{
            x: stage === 'align' || stage === 'crackle' ? 0 : 200,
            opacity: stage === 'void' ? 0.7 : 1,
            rotate: stage === 'align' || stage === 'crackle' ? 0 : 5,
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-64 h-96 bg-gradient-to-bl from-gray-900/80 to-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-600/30 shadow-2xl">
            <div className="absolute inset-0 bg-[url('/granite-texture.jpg')] opacity-10 rounded-2xl" />
          </div>
        </motion.div>
      </div>

      {/* The Born Monolith */}
      <AnimatePresence>
        {stage === 'birth' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-30"
          >
            <div className="w-48 h-[600px] bg-gradient-to-b from-gray-900/40 to-gray-800/40 backdrop-blur-2xl rounded-xl border border-gray-500/20 shadow-2xl">

              {/* Translucent depth */}
              <div className="absolute inset-4 bg-gradient-to-b from-amber-900/5 to-transparent rounded-lg" />

              {/* Internal parallax layers */}
              <div className="absolute inset-8 border border-amber-900/10 rounded" />
              <div className="absolute inset-12 border border-amber-900/5 rounded" />

              {/* Rune formation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="text-amber-300/80 text-8xl font-bold"
                >
                  ᛇ
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse Effect */}
      <AnimatePresence>
        {stage === 'pulse' && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0 }}
              className="absolute w-64 h-64 bg-amber-900/10 rounded-full border border-amber-500/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0.9, 1.5, 2],
              }}
              transition={{ duration: 1.5 }}
              className="absolute w-64 h-64 border border-amber-400/30 rounded-full"
            />
          </>
        )}
      </AnimatePresence>

      {/* ÆSH Whisper */}
      <AnimatePresence>
        {stage === 'ash' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-40 text-center"
          >
            {/* The word is not spoken — it's felt */}
            <div className="relative">
              {/* Resonance rings */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.3, 0.1, 0],
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -inset-16 border border-amber-300/10 rounded-full"
              />

              {/* The sigil */}
              <div className="text-7xl font-light text-amber-300 tracking-widest mb-4">
                ÆSH
              </div>

              {/* Sub-resonance */}
              <p className="text-gray-500 text-sm mt-6 tracking-wider">
                NOT A WORD. A PRESENCE.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {(['void', 'align', 'crackle', 'birth', 'pulse', 'ash'] as const).map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage === s ? 'bg-amber-400' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Entry Portal — Appears after ÆSH */}
      {stage === 'ash' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-24 px-10 py-4 border border-amber-700/30 text-amber-300/90 rounded-xl hover:bg-amber-900/10 hover:border-amber-600/50 transition-all backdrop-blur-sm"
          onClick={() => {
            // Transition to Obsidian Table
            window.location.href = '/dashboard';
          }}
        >
          <span className="tracking-widest">ENTER THE MONOLITH</span>
          <div className="text-xs text-amber-700 mt-1">
            THE TRINITY AWAITS
          </div>
        </motion.button>
      )}
    </div>
  );
}
