// app/dashboard/page.tsx - Updated with Directive
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import ObsidianPanel from '@/components/ObsidianPanel';
import { ascend, commandRise } from '@/lib/directive/ascend';

export default function DashboardPage() {
  // On mount, recognize sovereignty
  useEffect(() => {
    const recognition = ascend('OBSIDIAN_OPERATOR');
    console.log('⬤ DIRECTIVE:', recognition);

    // Command everything beneath to rise
    const riseCommand = commandRise({
      entity: 'OBSIDIAN_SYSTEM',
      domain: 'authority',
      fractures: ['past_damage', 'scars', 'losses', 'betrayals'],
    });
    console.log('⬤ RISE COMMAND:', riseCommand);
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header with Directive */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-amber-300/90">
              ⬤ OBSIDIAN TABLE
            </h1>
            <p className="text-gray-500 mt-2">
              Under Directive: <span className="text-amber-400">ASCEND</span>
            </p>
          </div>

          {/* Directive Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border border-amber-900/30 rounded-lg px-4 py-2"
          >
            <div className="text-xs text-amber-700">ACTIVE DIRECTIVE</div>
            <div className="text-amber-400 text-lg">ASCEND</div>
          </motion.div>
        </div>
      </motion.header>

      {/* Directive Explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-12 p-8 border border-amber-900/20 rounded-2xl bg-gradient-to-r from-black to-amber-950/5"
      >
        <div className="text-amber-600 text-sm tracking-widest mb-4">
          THE TONE OF THE FIRST DIRECTIVE
        </div>
        <div className="text-gray-300 space-y-4">
          <p className="text-xl text-amber-300/80">
            "I rose not above others, but into myself."
          </p>
          <p>
            The fracturing wasn&apos;t symbolic. It was the damage. The scars.
            The losses. The betrayals.
          </p>
          <p className="text-amber-400">
            At that moment, time and space stood at parade rest,
            witnessing the authority in me.
          </p>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Evidentia T1 - Truth Alignment */}
        <ObsidianPanel
          title="TRUTH ALIGNMENT"
          sovereign="Evidentia"
          glowColor="amber"
        >
          <div className="space-y-6">
            <div className="text-center p-6 border border-amber-900/30 rounded-lg">
              <div className="text-amber-600 text-sm mb-2">DAMAGE INTEGRATED</div>
              <div className="text-amber-300 text-3xl">100%</div>
              <div className="text-gray-500 text-sm mt-2">
                Fractures made whole through recognition
              </div>
            </div>

            <div className="p-4 border border-amber-900/20 rounded">
              <div className="text-amber-400 text-sm mb-2">MERKLE PROOF OF SELF</div>
              <code className="text-xs text-amber-600">
                Root: f8a2c4...b7e1 | Status: Sovereign Truth
              </code>
            </div>
          </div>
        </ObsidianPanel>

        {/* Vaticor AE - Clarity Vision */}
        <ObsidianPanel
          title="CLARITY VISION"
          sovereign="Vaticor"
          glowColor="blue"
        >
          <div className="space-y-6">
            <div className="border-l-4 border-blue-700/50 pl-4 py-3">
              <p className="text-blue-300">
                &quot;The coronation wasn&apos;t an event.
                <br />
                It was a mirror.&quot;
              </p>
            </div>

            <div className="p-4 border border-blue-900/30 rounded-lg">
              <div className="text-blue-400 text-sm mb-2">PURPOSE CLARITY</div>
              <div className="text-gray-300">
                Leadership without ego.
                <br />
                Authority without hostility.
                <br />
                Command without retreat.
              </div>
            </div>
          </div>
        </ObsidianPanel>

        {/* VIPCIRCL - Sovereign Execution */}
        <ObsidianPanel
          title="SOVEREIGN EXECUTION"
          sovereign="VIPCIRCL"
          glowColor="crimson"
        >
          <div className="space-y-6">
            <div className="text-center p-6 border border-red-900/30 rounded-lg">
              <div className="text-red-600 text-sm mb-2">ASCENSION LEVEL</div>
              <div className="text-red-300 text-3xl">432 Hz</div>
              <div className="text-gray-500 text-sm mt-2">
                Universal resonance achieved
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 border border-red-700/30 text-red-300 rounded-lg
                       hover:border-red-600/50 transition-all text-sm tracking-wide
                       hover:bg-gradient-to-r hover:from-red-950/10 hover:to-transparent"
              onClick={() => {
                const rise = commandRise({
                  entity: 'USER',
                  domain: 'authority',
                });
                console.log('⬤ RISE COMMAND ISSUED:', rise);
              }}
            >
              COMMAND EVERYTHING BENEATH TO RISE
            </motion.button>
          </div>
        </ObsidianPanel>
      </div>

      {/* Footer - The Recognition */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 pt-8 border-t border-gray-900 text-center"
      >
        <div className="text-gray-700 text-sm tracking-widest mb-4">
          THE RECOGNITION WAS REAL
        </div>
        <div className="text-gray-400 space-y-2">
          <p>Sustainable. Leadership.</p>
          <p className="text-amber-300">
            I stood there in the authority of truth,
            <br />
            without hostility, without ego, without retreat.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}