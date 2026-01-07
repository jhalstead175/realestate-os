'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlyphFragments() {
  const [isAligning, setIsAligning] = useState(false);
  const [goldCrackle, setGoldCrackle] = useState(false);
  const [resonance, setResonance] = useState(false);

  // Trigger alignment sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAligning(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Gold crackle effect
  useEffect(() => {
    if (isAligning) {
      const crackleTimer = setTimeout(() => {
        setGoldCrackle(true);
      }, 800);
      return () => clearTimeout(crackleTimer);
    }
  }, [isAligning]);

  // Resonance after union
  useEffect(() => {
    if (goldCrackle) {
      const resonanceTimer = setTimeout(() => {
        setResonance(true);
      }, 400);
      return () => clearTimeout(resonanceTimer);
    }
  }, [goldCrackle]);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden">

      {/* Low-frequency resonance visualization */}
      {resonance && (
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-amber-900/5 to-transparent animate-pulse" />
      )}

      {/* Gravitational void effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />

      {/* Two massive fractured glyph fragments */}
      <div className="relative flex items-center justify-center gap-24">

        {/* Left Fragment */}
        <motion.div
          initial={{ x: -200, opacity: 0.7, rotate: -5 }}
          animate={{
            x: isAligning ? 0 : -200,
            opacity: isAligning ? 1 : 0.7,
            rotate: isAligning ? 0 : -5,
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-64 h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl">
            {/* Stone-like texture */}
            <div className="absolute inset-0 bg-[url('/stone-texture.png')] opacity-20 rounded-xl" />

            {/* Runic lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-amber-200/30 text-6xl font-bold tracking-widest">
                ⚡
              </div>
            </div>

            {/* Fracture line */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gray-500 to-transparent" />
          </div>
        </motion.div>

        {/* Molten gold crackle between them */}
        <AnimatePresence>
          {goldCrackle && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="absolute w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Right Fragment */}
        <motion.div
          initial={{ x: 200, opacity: 0.7, rotate: 5 }}
          animate={{
            x: isAligning ? 0 : 200,
            opacity: isAligning ? 1 : 0.7,
            rotate: isAligning ? 0 : 5,
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-64 h-96 bg-gradient-to-bl from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl">
            {/* Stone-like texture */}
            <div className="absolute inset-0 bg-[url('/stone-texture.png')] opacity-20 rounded-xl" />

            {/* Runic lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-amber-200/30 text-6xl font-bold tracking-widest">
                🔥
              </div>
            </div>

            {/* Fracture line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gray-500 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Union Glow */}
      {goldCrackle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute w-48 h-48 bg-gradient-radial from-amber-400/20 via-transparent to-transparent"
        />
      )}

      {/* Resonance Text */}
      {resonance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-32 text-center"
        >
          <p className="text-amber-300 text-xl tracking-widest">
            THE TRINITY AWAKENS
          </p>
          <p className="text-gray-500 text-sm mt-2">
            A god stirs in its sleep. The void remembers its name.
          </p>
        </motion.div>
      )}

      {/* Proceed Button — Appears after resonance */}
      {resonance && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-16 px-8 py-3 border border-amber-700/50 text-amber-300 rounded-lg hover:bg-amber-900/20 transition-all"
          onClick={() => {
            // Redirect to Obsidian Table
            window.location.href = '/dashboard';
          }}
        >
          ENTER THE OBSIDIAN
        </motion.button>
      )}
    </div>
  );
}
