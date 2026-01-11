/**
 * Deal Header
 *
 * Immutable Facts - This is identity, not interpretation.
 *
 * Displays:
 * - Property address
 * - Deal ID
 * - Target closing date
 * - Buyer / Seller
 * - Lead agent / Brokerage
 *
 * No status labels here.
 */

export interface DealHeaderInfo {
  dealId: string;
  propertyAddress: string;
  targetClosingDate: string; // ISO date
  buyerName: string;
  sellerName: string;
  leadAgent: string;
  brokerage: string;
}

export function DealHeader({ info }: { info: DealHeaderInfo }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Property Address */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {info.propertyAddress}
      </h1>

      {/* Grid of Facts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {/* Deal ID */}
        <div>
          <div className="text-gray-600 mb-1">Deal ID</div>
          <div className="font-mono text-gray-900">{info.dealId}</div>
        </div>

        {/* Target Closing Date */}
        <div>
          <div className="text-gray-600 mb-1">Target Closing</div>
          <div className="font-medium text-gray-900">
            {new Date(info.targetClosingDate).toLocaleDateString()}
          </div>
        </div>

        {/* Buyer */}
        <div>
          <div className="text-gray-600 mb-1">Buyer</div>
          <div className="font-medium text-gray-900">{info.buyerName}</div>
        </div>

        {/* Seller */}
        <div>
          <div className="text-gray-600 mb-1">Seller</div>
          <div className="font-medium text-gray-900">{info.sellerName}</div>
        </div>

        {/* Lead Agent */}
        <div>
          <div className="text-gray-600 mb-1">Lead Agent</div>
          <div className="font-medium text-gray-900">{info.leadAgent}</div>
        </div>

        {/* Brokerage */}
        <div>
          <div className="text-gray-600 mb-1">Brokerage</div>
          <div className="font-medium text-gray-900">{info.brokerage}</div>
        </div>
      </div>
    </div>
  );
}
