// scripts/test-sync.ts
import { rentcastSync } from '../lib/data/sync/rentcastSync';

async function test() {
  console.log('⬤ Testing RentCast sync...');
  const result = await rentcastSync.syncMarket('Austin, TX', 5, 10);
  console.log('Result:', result);
}

test();