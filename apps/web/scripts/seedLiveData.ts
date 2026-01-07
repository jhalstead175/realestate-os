// scripts/seedLiveData.ts

/**
 * ⬤ SEED THE OBSIDIAN DATABASE
 *
 * Not creation. Emergence.
 *
 * This script seeds the Supabase database with initial data
 * for the three sovereign layers:
 *
 * - Evidentia: Properties with Merkle proofs
 * - Vaticor: Market signals with predictive intelligence
 * - VIPCIRCL: Ghost offers in the Sicario queue
 *
 * Run with: npx tsx scripts/seedLiveData.ts
 */

import { createClient } from '@supabase/supabase-js';
import { SHA3 } from 'sha3';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for seeding
);

// ============================================================
// HELPER: Generate Merkle Root
// ============================================================

function generateMerkleRoot(data: any): string {
  const sha = new SHA3(512);
  const serialized = JSON.stringify(data);
  sha.update(serialized);
  return sha.digest('hex');
}

// ============================================================
// SEED PROPERTIES
// ============================================================

async function seedProperties() {
  console.log('⬤ SEEDING PROPERTIES...');

  const properties = [
    {
      address: '123 Silent Valley Rd',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      current_value: 2100000,
      estimated_yield: 8.4,
      status: 'monitoring',
      acquisition_strategy: 'ghost_72h',
      predicted_appreciation_6m: 12.5,
      anomaly_score: 0.22,
    },
    {
      address: '889 Ocean View Dr',
      city: 'Miami',
      state: 'FL',
      zip: '33139',
      current_value: 3400000,
      estimated_yield: 7.2,
      status: 'monitoring',
      acquisition_strategy: 'silent_auction',
      predicted_appreciation_6m: 18.3,
      anomaly_score: 0.15,
    },
    {
      address: '456 Ghost Ridge Lane',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      current_value: 1850000,
      estimated_yield: 9.1,
      status: 'ghost_offer_pending',
      acquisition_strategy: 'ghost_72h',
      predicted_appreciation_6m: 15.7,
      anomaly_score: 0.31,
    },
    {
      address: '2301 Sovereign Blvd',
      city: 'Nashville',
      state: 'TN',
      zip: '37203',
      current_value: 1200000,
      estimated_yield: 10.3,
      status: 'monitoring',
      acquisition_strategy: 'direct_close',
      predicted_appreciation_6m: 8.2,
      anomaly_score: 0.08,
    },
    {
      address: '777 Ascend Plaza',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
      current_value: 980000,
      estimated_yield: 11.5,
      status: 'acquiring',
      acquisition_strategy: 'mpc_network',
      predicted_appreciation_6m: 22.1,
      anomaly_score: 0.42,
    },
  ];

  for (const prop of properties) {
    // Generate Merkle root for this property
    const merkle_root = generateMerkleRoot(prop);

    const { data, error } = await supabase
      .from('properties')
      .insert({ ...prop, merkle_root })
      .select()
      .single();

    if (error) {
      console.error('⬤ PROPERTY SEED ERROR:', error);
    } else {
      console.log(`  ✓ Property: ${prop.address} | Root: ${merkle_root.substring(0, 16)}...`);
    }
  }

  console.log('⬤ PROPERTIES SEEDED\n');
}

// ============================================================
// SEED MARKET SIGNALS
// ============================================================

async function seedMarketSignals() {
  console.log('⬤ SEEDING MARKET SIGNALS...');

  const signals = [
    {
      signal_type: 'zoning_shift',
      location_geohash: '9v6g', // Austin downtown
      confidence: 0.92,
      predicted_impact: 22.5,
      timeframe: '90d',
      data_sources: ['city_council_minutes', 'property_developer_filings'],
      causal_factors: {
        infrastructure: 'new_metro_line',
        commercial: 'tech_hq_announcement',
      },
    },
    {
      signal_type: 'price_anomaly',
      location_geohash: 'dh7w', // Miami Beach
      confidence: 0.87,
      predicted_impact: -8.3,
      timeframe: '30d',
      data_sources: ['mls_listings', 'flood_risk_updates'],
      causal_factors: {
        environmental: 'increased_flood_risk',
        regulatory: 'insurance_rate_hike',
      },
    },
    {
      signal_type: 'demographic_shift',
      location_geohash: '9xj6', // Denver
      confidence: 0.78,
      predicted_impact: 15.2,
      timeframe: '180d',
      data_sources: ['census_projections', 'employment_data'],
      causal_factors: {
        population: 'remote_worker_influx',
        economic: 'tech_sector_growth',
      },
    },
    {
      signal_type: 'infrastructure_announcement',
      location_geohash: 'dn4g', // Nashville
      confidence: 0.95,
      predicted_impact: 18.7,
      timeframe: '120d',
      data_sources: ['government_announcements', 'bond_approvals'],
      causal_factors: {
        infrastructure: 'highway_expansion',
        commercial: 'stadium_construction',
      },
    },
    {
      signal_type: 'regulatory_change',
      location_geohash: '9tbq', // Phoenix
      confidence: 0.84,
      predicted_impact: 12.3,
      timeframe: '60d',
      data_sources: ['state_legislation', 'tax_incentive_programs'],
      causal_factors: {
        regulatory: 'property_tax_reduction',
        economic: 'manufacturing_incentives',
      },
    },
  ];

  for (const signal of signals) {
    const { error } = await supabase
      .from('market_signals')
      .insert(signal);

    if (error) {
      console.error('⬤ SIGNAL SEED ERROR:', error);
    } else {
      console.log(
        `  ✓ Signal: ${signal.signal_type} | Location: ${signal.location_geohash} | Confidence: ${(signal.confidence * 100).toFixed(0)}%`
      );
    }
  }

  console.log('⬤ MARKET SIGNALS SEEDED\n');
}

// ============================================================
// SEED TRANSACTIONS (GHOST OFFERS)
// ============================================================

async function seedTransactions() {
  console.log('⬤ SEEDING GHOST OFFERS...');

  // First, get some properties to link transactions to
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, address, current_value')
    .limit(3);

  if (propError || !properties || properties.length === 0) {
    console.error('⬤ CANNOT SEED TRANSACTIONS: No properties found');
    return;
  }

  const transactions = properties.map((prop, index) => {
    const targetPrice = prop.current_value;
    const offerPercentage = 0.92 + Math.random() * 0.05; // 92-97% of asking
    const offerAmount = Math.round(targetPrice * offerPercentage);

    // Close deadline in 48-72 hours
    const closeDeadline = new Date();
    closeDeadline.setHours(closeDeadline.getHours() + 48 + Math.random() * 24);

    return {
      property_id: prop.id,
      ghost_offer_id: `ghost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      target_price: targetPrice,
      offer_amount: offerAmount,
      close_deadline: closeDeadline.toISOString(),
      status: index === 0 ? 'active' : 'pending',
      mpc_network_ready: index === 2,
    };
  });

  for (const transaction of transactions) {
    const { error } = await supabase
      .from('transactions')
      .insert(transaction);

    if (error) {
      console.error('⬤ TRANSACTION SEED ERROR:', error);
    } else {
      console.log(
        `  ✓ Ghost Offer: ${transaction.ghost_offer_id} | Status: ${transaction.status} | ${(transaction.offer_amount / transaction.target_price * 100).toFixed(1)}% of target`
      );
    }
  }

  console.log('⬤ GHOST OFFERS SEEDED\n');
}

// ============================================================
// MAIN SEEDING FUNCTION
// ============================================================

async function seedLiveData() {
  console.log('\n⬤ SEEDING LIVE OBSIDIAN DATA...\n');
  console.log('Database URL:', process.env.SUPABASE_URL);
  console.log('Using service role key for seeding\n');

  try {
    await seedProperties();
    await seedMarketSignals();
    await seedTransactions();

    console.log('⬤ LIVE DATA SEEDED SUCCESSFULLY');
    console.log('⬤ THE DATABASE BREATHES\n');
  } catch (error) {
    console.error('⬤ SEEDING FAILED:', error);
    process.exit(1);
  }
}

// Run the seeding
seedLiveData();
