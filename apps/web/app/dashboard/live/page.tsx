// app/dashboard/live/page.tsx - Add this component
function SyncControlPanel() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await fetch('/api/sync/rentcast', {
        method: 'POST',
      });
      const data = await result.json();
      setSyncResult(data);
      console.log('⬤ SYNC RESULT:', data);
    } catch (error) {
      console.error('⬤ SYNC ERROR:', error);
      setSyncResult({ error: error.message });
    }
    setSyncing(false);
  };

  return (
    <div className="border border-amber-900/30 rounded-xl p-6 mb-8 bg-gradient-to-r from-black to-amber-950/5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-amber-300 mb-2">MLS DATA SYNC</h3>
          <p className="text-gray-500 text-sm">
            Pull live RentCast MLS data into Obsidian Table
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {syncResult && (
            <div className="text-sm">
              <div className="text-amber-600">LAST SYNC</div>
              <div className="text-amber-300">
                {syncResult.total || 0} properties loaded
              </div>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSync}
            disabled={syncing}
            className="px-6 py-3 border border-amber-700/50 text-amber-400 rounded-lg 
                     hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-amber-400" />
                SYNCING...
              </>
            ) : (
              'SYNC LIVE MLS DATA'
            )}
          </motion.button>
        </div>
      </div>
      
      {syncResult?.markets && (
        <div className="mt-6 pt-6 border-t border-amber-900/20">
          <div className="text-amber-600 text-sm mb-3">SYNC RESULTS</div>
          <div className="grid grid-cols-4 gap-4">
            {syncResult.markets.map((market: any, i: number) => (
              <div key={i} className={`p-3 rounded border ${
                market.success 
                  ? 'border-green-900/30 bg-green-900/10' 
                  : 'border-red-900/30 bg-red-900/10'
              }`}>
                <div className="text-sm font-medium">{market.market}</div>
                <div className="text-xs text-gray-500">
                  {market.upserted} properties
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Then add to your dashboard:
<SyncControlPanel />