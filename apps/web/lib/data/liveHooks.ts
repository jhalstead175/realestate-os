// lib/data/liveHooks.ts
'use client';

/**
 * ⬤ LIVE OBSIDIAN HOOKS
 *
 * Not polling. Not fetching. Breathing.
 *
 * These hooks don't ask for data.
 * They listen for it.
 *
 * Supabase real-time subscriptions create a living connection
 * to the three sovereigns:
 *
 * - Evidentia: Properties anchored in Merkle truth
 * - Vaticor: Market signals detected before they're spoken
 * - VIPCIRCL: Ghost offers moving in silence
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================
// TYPES
// ============================================================

export interface Property {
  id: string;
  merkle_root: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  current_value: number;
  estimated_yield: number;
  status: 'monitoring' | 'acquiring' | 'owned' | 'ghost_offer_pending';
  acquisition_strategy?: string;
  predicted_appreciation_6m?: number;
  anomaly_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  ghost_offer_id: string;
  target_price: number;
  offer_amount: number;
  close_deadline: string;
  status: 'pending' | 'active' | 'accepted' | 'rejected' | 'closed';
  mpc_network_ready: boolean;
  created_at: string;
  closed_at?: string;
}

export interface MarketSignal {
  id: string;
  signal_type: string;
  location_geohash: string;
  confidence: number;
  predicted_impact: number;
  timeframe: string;
  data_sources?: any;
  causal_factors?: any;
  detected_at: string;
  expires_at?: string;
}

// ============================================================
// HOOK: useLiveProperties
// ============================================================
// Evidentia Layer: Live property monitoring

export function useLiveProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('anomaly_score', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();

    // Real-time subscription
    const channel = supabase
      .channel('properties-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
        },
        (payload) => {
          // Handle INSERT
          if (payload.eventType === 'INSERT') {
            setProperties((prev) => [payload.new as Property, ...prev]);
          }

          // Handle UPDATE
          if (payload.eventType === 'UPDATE') {
            setProperties((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Property) : p
              )
            );
          }

          // Handle DELETE
          if (payload.eventType === 'DELETE') {
            setProperties((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { properties, loading, error };
}

// ============================================================
// HOOK: useLiveTransactions
// ============================================================
// VIPCIRCL Layer: Live ghost offer tracking

export function useLiveTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .in('status', ['pending', 'active'])
          .order('close_deadline', { ascending: true });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Real-time subscription
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          // Handle INSERT
          if (payload.eventType === 'INSERT') {
            const newTransaction = payload.new as Transaction;
            // Only add if pending or active
            if (['pending', 'active'].includes(newTransaction.status)) {
              setTransactions((prev) => [newTransaction, ...prev]);
            }
          }

          // Handle UPDATE
          if (payload.eventType === 'UPDATE') {
            const updatedTransaction = payload.new as Transaction;
            setTransactions((prev) => {
              // If status changed to closed/rejected, remove from list
              if (!['pending', 'active'].includes(updatedTransaction.status)) {
                return prev.filter((t) => t.id !== updatedTransaction.id);
              }
              // Otherwise update
              return prev.map((t) =>
                t.id === updatedTransaction.id ? updatedTransaction : t
              );
            });
          }

          // Handle DELETE
          if (payload.eventType === 'DELETE') {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { transactions, loading, error };
}

// ============================================================
// HOOK: useLiveMarketSignals
// ============================================================
// Vaticor Layer: Live market intelligence

export function useLiveMarketSignals() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch - only recent signals (last 30 days)
    const fetchSignals = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
          .from('market_signals')
          .select('*')
          .gte('detected_at', thirtyDaysAgo.toISOString())
          .order('confidence', { ascending: false })
          .limit(10);

        if (error) throw error;
        setSignals(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();

    // Real-time subscription
    const channel = supabase
      .channel('market-signals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_signals',
        },
        (payload) => {
          // Handle INSERT
          if (payload.eventType === 'INSERT') {
            setSignals((prev) => [payload.new as MarketSignal, ...prev].slice(0, 10));
          }

          // Handle UPDATE
          if (payload.eventType === 'UPDATE') {
            setSignals((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as MarketSignal) : s
              )
            );
          }

          // Handle DELETE
          if (payload.eventType === 'DELETE') {
            setSignals((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { signals, loading, error };
}

// ============================================================
// HELPER: Format currency
// ============================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// HELPER: Time until deadline
// ============================================================

export function getTimeUntilDeadline(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff < 0) return 'EXPIRED';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 24) {
    return `${hours}h ${minutes}m`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
