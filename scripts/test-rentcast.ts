// scripts/test-rentcast.ts
import { rentcastAPI } from '../lib/data/mls/rentcastAPI';

async function testRentCast() {
  console.log('⬤ TESTING RENTCAST API...');
  
  // Test search in Austin, TX
  const properties = await rentcastAPI.searchProperties({
    location: 'Austin, TX',
    status: 'for_sale',
    limit: 5,
  });
  
  console.log(`⬤ FOUND ${properties.length} PROPERTIES:`);
  properties.forEach((prop, i) => {
    console.log(`${i + 1}. ${prop.address} - $${prop.current_value.toLocaleString()} (${prop.estimated_yield}% yield)`);
  });
  
  // Test detailed view
  if (properties.length > 0) {
    const detail = await rentcastAPI.getPropertyDetail(properties[0].external_id.replace('rentcast_', ''));
    console.log('⬤ DETAILED VIEW:', {
      address: detail?.address,
      strategy: detail?.acquisition_strategy,
      anomaly: detail?.anomaly_score,
    });
  }
}

testRentCast();