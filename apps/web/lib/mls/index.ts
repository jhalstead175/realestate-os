/**
 * MLS Module - Public API
 *
 * MLS Coexistence & Gradual Displacement Strategy
 * "Win by outgrowing, not fighting"
 *
 * Core Principles:
 * - MLS is a read-only, untrusted, periodic data source
 * - MLS data is contextual, advisory, informative — never authoritative
 * - RealEstate-OS is the system of record for transactions
 * - MLS never becomes authoritative
 *
 * Architectural Separation:
 * - MLS: Listings, photos, agent attribution (read-only)
 * - RealEstate-OS: Contracts, readiness, compliance, automation, audit (canonical)
 */

// Types
export type {
  MLSSnapshot,
  MLSSource,
  MLSAttribution,
  InterpretedMLSSnapshot,
} from './types';

// Interpretation
export {
  interpretMLSSnapshot,
  compareMLSWithInternal,
} from './interpretSnapshot';

// TODO: Add when implemented:
// - MLS ingestion functions
// - MLS snapshot database access
// - MLS attribution management
