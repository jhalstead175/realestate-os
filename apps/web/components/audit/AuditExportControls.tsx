/**
 * Audit Export Controls
 *
 * One-click regulator-grade PDF export button
 *
 * Demo Moment: "We can hand this to a regulator. Today."
 */

"use client";

import { useState } from "react";

export function AuditExportControls({ dealId }: { dealId: string }) {
  const [loading, setLoading] = useState(false);

  async function exportPDF() {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit/${dealId}/export-pdf`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("PDF export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit-Narrative-${dealId}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function exportJSON() {
    setLoading(true);
    try {
      const res = await fetch(`/api/narrative/${dealId}?format=json`);

      if (!res.ok) {
        throw new Error("JSON export failed");
      }

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.narrative, null, 2)], {
        type: "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit-Narrative-${dealId}.json`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("JSON export failed:", error);
      alert("Failed to export JSON. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3 justify-end">
      <button
        onClick={exportJSON}
        disabled={loading}
        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        Export JSON
      </button>
      <button
        onClick={exportPDF}
        disabled={loading}
        className="px-4 py-2 text-sm rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Preparing PDF…" : "Export Regulator Packet (PDF)"}
      </button>
    </div>
  );
}
