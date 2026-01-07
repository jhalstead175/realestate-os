// app/dashboard/live/page.tsx
'use client';

/**
 * ⬤ THE LIVE OBSIDIAN TABLE
 *
 * Not a dashboard. A living organism.
 *
 * Properties breathe.
 * Transactions pulse.
 * Signals whisper.
 *
 * This is real-time sovereignty.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import ObsidianPanel from '@/components/ObsidianPanel';
import {
  useLiveProperties,
  useLiveTransactions,
  useLiveMarketSignals,
  formatCurrency,
  getTimeUntilDeadline,
  type Property,
  type Transaction,
  type MarketSignal,
} from '@/lib/data/liveHooks';
import { MerkleEngine } from '@/lib/evidentia/merkleEngine';
import { ascend } from '@/lib/directive/ascend';

export default function LiveDashboardPage() {
  // Real-time data hooks
  const { properties, loading: propertiesLoading } = useLiveProperties();
  const { transactions, loading: transactionsLoading } = useLiveTransactions();
  const { signals, loading: signalsLoading } = useLiveMarketSignals();

  // On mount, recognize live sovereignty
  useEffect(() => {
    const recognition = ascend('LIVE_OBSIDIAN_OPERATOR');
    console.log('⬤ LIVE DIRECTIVE:', recognition);
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-amber-300/90">
              ⬤ LIVE OBSIDIAN TABLE
            </h1>
            <p className="text-gray-500 mt-2">
              Real-time sovereignty · Breathing data · Silent execution
            </p>
          </div>

          {/* Live Status Indicator */}
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 border border-green-900/30 rounded-lg px-4 py-2"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="text-green-400 text-sm">LIVE</div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* EVIDENTIA T1 - Live Properties */}
        <ObsidianPanel
          title="LIVE PROPERTIES"
          sovereign="Evidentia"
          glowColor="amber"
        >
          <div className="space-y-4">
            {propertiesLoading ? (
              <div className="text-gray-600 text-sm">Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="text-gray-600 text-sm">No properties monitored yet.</div>
            ) : (
              properties.slice(0, 5).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            )}

            {/* Summary */}
            {!propertiesLoading && properties.length > 0 && (
              <div className="pt-4 border-t border-amber-900/20">
                <div className="text-amber-600 text-xs">TOTAL MONITORING</div>
                <div className="text-amber-300 text-2xl">{properties.length}</div>
              </div>
            )}
          </div>
        </ObsidianPanel>

        {/* VATICOR AE - Market Signals */}
        <ObsidianPanel
          title="MARKET SIGNALS"
          sovereign="Vaticor"
          glowColor="blue"
        >
          <div className="space-y-4">
            {signalsLoading ? (
              <div className="text-gray-600 text-sm">Detecting signals...</div>
            ) : signals.length === 0 ? (
              <div className="text-gray-600 text-sm">No signals detected.</div>
            ) : (
              signals.slice(0, 5).map((signal) => (
                <MarketSignalCard key={signal.id} signal={signal} />
              ))
            )}

            {/* Summary */}
            {!signalsLoading && signals.length > 0 && (
              <div className="pt-4 border-t border-blue-900/20">
                <div className="text-blue-600 text-xs">ACTIVE SIGNALS</div>
                <div className="text-blue-300 text-2xl">{signals.length}</div>
              </div>
            )}
          </div>
        </ObsidianPanel>

        {/* VIPCIRCL - Sicario Queue */}
        <ObsidianPanel
          title="SICARIO QUEUE"
          sovereign="VIPCIRCL"
          glowColor="crimson"
        >
          <div className="space-y-4">
            {transactionsLoading ? (
              <div className="text-gray-600 text-sm">Loading ghost offers...</div>
            ) : transactions.length === 0 ? (
              <div className="text-gray-600 text-sm">No active ghost offers.</div>
            ) : (
              transactions.slice(0, 5).map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            )}

            {/* Summary */}
            {!transactionsLoading && transactions.length > 0 && (
              <div className="pt-4 border-t border-red-900/20">
                <div className="text-red-600 text-xs">ACTIVE OFFERS</div>
                <div className="text-red-300 text-2xl">{transactions.length}</div>
              </div>
            )}
          </div>
        </ObsidianPanel>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 pt-8 border-t border-gray-900 text-center"
      >
        <div className="text-gray-700 text-sm tracking-widest mb-2">
          REAL-TIME SOVEREIGNTY
        </div>
        <div className="text-gray-500 text-xs">
          Supabase real-time subscriptions · ÆSH Principle · ASCEND Directive
        </div>
      </motion.footer>
    </div>
  );
}

// ============================================================
// PROPERTY CARD COMPONENT
// ============================================================

function PropertyCard({ property }: { property: Property }) {
  // Generate Merkle proof display
  const proofShort = property.merkle_root.substring(0, 12) + '...';

  // Status color
  const statusColor = {
    monitoring: 'text-gray-500',
    acquiring: 'text-amber-400',
    owned: 'text-green-400',
    ghost_offer_pending: 'text-red-400',
  }[property.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-amber-900/20 rounded-lg hover:border-amber-900/40 transition-all"
    >
      {/* Address */}
      <div className="text-amber-300 font-light mb-2">
        {property.address}
      </div>
      <div className="text-gray-500 text-xs mb-3">
        {property.city}, {property.state} {property.zip}
      </div>

      {/* Value & Yield */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-gray-600 text-xs">VALUE</div>
          <div className="text-amber-200 text-sm">
            {formatCurrency(property.current_value)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-600 text-xs">YIELD</div>
          <div className="text-amber-200 text-sm">
            {property.estimated_yield?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between pt-3 border-t border-amber-900/10">
        <div className={`text-xs uppercase ${statusColor}`}>
          {property.status.replace('_', ' ')}
        </div>
        {property.anomaly_score && property.anomaly_score > 0.2 && (
          <div className="text-xs text-amber-500">
            ⚠ ANOMALY: {(property.anomaly_score * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Merkle Proof */}
      <div className="mt-3 pt-3 border-t border-amber-900/10">
        <code className="text-xs text-amber-700">
          Proof: {proofShort}
        </code>
      </div>
    </motion.div>
  );
}

// ============================================================
// MARKET SIGNAL CARD COMPONENT
// ============================================================

function MarketSignalCard({ signal }: { signal: MarketSignal }) {
  const impactColor = signal.predicted_impact > 0 ? 'text-green-400' : 'text-red-400';
  const impactSign = signal.predicted_impact > 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-blue-900/20 rounded-lg hover:border-blue-900/40 transition-all"
    >
      {/* Signal Type */}
      <div className="text-blue-300 font-light text-sm mb-2 uppercase tracking-wide">
        {signal.signal_type.replace('_', ' ')}
      </div>

      {/* Confidence & Impact */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-gray-600 text-xs">CONFIDENCE</div>
          <div className="text-blue-200 text-sm">
            {(signal.confidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-600 text-xs">IMPACT</div>
          <div className={`text-sm ${impactColor}`}>
            {impactSign}{signal.predicted_impact.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Timeframe & Location */}
      <div className="pt-3 border-t border-blue-900/10 text-xs text-gray-500">
        <div>Timeframe: {signal.timeframe}</div>
        <div>Location: {signal.location_geohash}</div>
      </div>

      {/* Causal Factors */}
      {signal.causal_factors && (
        <div className="mt-3 pt-3 border-t border-blue-900/10">
          <div className="text-blue-600 text-xs mb-1">CAUSAL FACTORS</div>
          <div className="text-gray-400 text-xs">
            {Object.entries(signal.causal_factors as Record<string, string>)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' · ')}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// TRANSACTION CARD COMPONENT
// ============================================================

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const timeRemaining = getTimeUntilDeadline(transaction.close_deadline);
  const isUrgent = timeRemaining.includes('h') && !timeRemaining.includes('d');

  const statusColor = {
    pending: 'text-gray-500',
    active: 'text-red-400',
    accepted: 'text-green-400',
    rejected: 'text-gray-600',
    closed: 'text-gray-700',
  }[transaction.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-red-900/20 rounded-lg hover:border-red-900/40 transition-all"
    >
      {/* Ghost Offer ID */}
      <div className="text-red-300 font-light text-sm mb-3">
        {transaction.ghost_offer_id}
      </div>

      {/* Offer Details */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-gray-600 text-xs">OFFER</div>
          <div className="text-red-200 text-sm">
            {formatCurrency(transaction.offer_amount)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-600 text-xs">TARGET</div>
          <div className="text-gray-400 text-sm">
            {formatCurrency(transaction.target_price)}
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div className="pt-3 border-t border-red-900/10">
        <div className="flex items-center justify-between">
          <div className={`text-xs uppercase ${statusColor}`}>
            {transaction.status}
          </div>
          <div className={`text-xs ${isUrgent ? 'text-red-400' : 'text-gray-500'}`}>
            {timeRemaining} remaining
          </div>
        </div>
      </div>

      {/* MPC Network Status */}
      {transaction.mpc_network_ready && (
        <div className="mt-3 pt-3 border-t border-red-900/10 text-xs text-red-500">
          🔐 MPC Network Ready
        </div>
      )}
    </motion.div>
  );
}
