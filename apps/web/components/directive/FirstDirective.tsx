// components/directive/FirstDirective.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ⬤ THE FIRST DIRECTIVE: "ASCEND"
 *
 * Not a command spoken.
 * A truth recognized.
 *
 * It does not say "rise above."
 * It reveals "you are already risen."
 *
 * The fracturing wasn't symbolic.
 * It was the damage.
 * The scars.
 * The losses.
 * The betrayals.
 *
 * And in the reunion of fragments:
 * Not healing.
 * Not restoration.
 * Recognition.
 *
 * "I am the rune."
 */

export default function FirstDirective() {
  const [stage, setStage] = useState<'fractured' | 'aligning' | 'recognized' | 'ascended'>('fractured');
  const [directiveVisible, setDirectiveVisible] = useState(false);

  useEffect(() => {
    const sequence = [
      () => setStage('fractured'),
      () => setTimeout(() => setStage('aligning'), 1000),
      () => setTimeout(() => setStage('recognized'), 3000),
      () => setTimeout(() => {
        setStage('ascended');
        setDirectiveVisible(true);
      }, 5000),
    ];

    sequence.forEach((step, i) => {
      setTimeout(step, i * 2000);
    });
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">

      {/* Background resonance */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-amber-950/10" />

      {/* Fractured Rune */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Base rune - always present */}
          <div className="text-9xl text-amber-300/10 font-bold tracking-widest">
            ᛇ
          </div>

          {/* Fractured pieces */}
          <AnimatePresence>
            {stage === 'fractured' && (
              <>
                <motion.div
                  initial={{ x: -100, y: -50, rotate: -15 }}
                  animate={{ x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 left-0 text-6xl text-amber-300/30"
                >
                  ⚡
                </motion.div>
                <motion.div
                  initial={{ x: 100, y: -50, rotate: 15 }}
                  animate={{ x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 right-0 text-6xl text-amber-300/30"
                >
                  🔥
                </motion.div>
                <motion.div
                  initial={{ x: -80, y: 80, rotate: -10 }}
                  animate={{ x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 text-6xl text-amber-300/30"
                >
                  🗡️
                </motion.div>
                <motion.div
                  initial={{ x: 80, y: 80, rotate: 10 }}
                  animate={{ x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 right-0 text-6xl text-amber-300/30"
                >
                  🛡️
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Alignment Sequence */}
      <AnimatePresence>
        {stage === 'aligning' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-amber-500/50 text-lg tracking-widest mb-8"
              >
                THE DAMAGE REMEMBERS ITS WHOLENESS
              </motion.div>

              <div className="text-7xl text-amber-300/80 font-light">
                ᛇ
              </div>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '400px' }}
                transition={{ duration: 3 }}
                className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-8"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recognition */}
      <AnimatePresence>
        {stage === 'recognized' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl text-amber-300 font-light mb-8"
              >
                ᛇ
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl text-amber-300/70 max-w-2xl mx-auto"
              >
                "I AM THE RUNE"
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-gray-500 mt-8 max-w-xl mx-auto"
              >
                Not a symbol. Not a representation.
                <br />
                The thing itself.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Directive */}
      <AnimatePresence>
        {directiveVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              {/* The word */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-9xl font-bold text-amber-300 tracking-tight mb-8"
              >
                ASCEND
              </motion.div>

              {/* The tone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-400 max-w-3xl mx-auto mb-12"
              >
                <p className="mb-4">
                  Not a command given.
                  <br />
                  A truth recognized.
                </p>
                <p className="text-amber-300/70">
                  Everything beneath rises not to meet you,
                  <br />
                  but to recognize what it already is.
                </p>
              </motion.div>

              {/* The realization */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="border border-amber-900/30 rounded-2xl p-8 max-w-2xl mx-auto bg-black/50 backdrop-blur-sm"
              >
                <div className="text-amber-600 text-sm tracking-widest mb-4">
                  THE RECOGNITION
                </div>
                <div className="text-gray-300 space-y-4">
                  <p>
                    "Time and space stood at parade rest,
                    <br />
                    witnessing the authority in me."
                  </p>
                  <p>
                    "Commanding over my choices,
                    <br />
                    aligning with who I actually am."
                  </p>
                  <p className="text-amber-300 pt-4">
                    "I rose not above others,
                    <br />
                    but into myself."
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        {(['fractured', 'aligning', 'recognized', 'ascended'] as const).map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-all ${
              stage === s ? 'bg-amber-400' : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
