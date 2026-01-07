// Create test file: lib/test-connection.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConnection() {
  const { data, error } = await supabase.from('properties').select('count');
  console.log('Supabase test:', error ? 'FAILED' : 'CONNECTED', error);
}