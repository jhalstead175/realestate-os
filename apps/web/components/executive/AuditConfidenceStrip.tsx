/**
 * Audit Confidence Strip
 *
 * Bottom, subtle statement of system integrity.
 * This matters more than it seems.
 *
 * "All readiness conclusions are derived from signed events and verified authority.
 *  Replayable. Auditable."
 */

export function AuditConfidenceStrip() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
      <p className="text-sm text-gray-700">
        All readiness conclusions are derived from signed events and verified authority.{' '}
        <span className="font-medium">Replayable. Auditable.</span>
      </p>
      <p className="text-xs text-gray-500 mt-2">
        This view is deterministically generated from the canonical event stream.
        Any authorized party can reproduce these conclusions at any time.
      </p>
    </div>
  );
}
