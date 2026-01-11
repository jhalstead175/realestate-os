/**
 * As-Of Date Selector
 *
 * Time-travel capability for audit narratives.
 * Generate narrative for transaction state at any historical point.
 *
 * Demo Line: "We can show you exactly what the deal looked like on February 12 at 3:47 PM."
 */

"use client";

import { useState } from "react";

export function AuditAsOfSelector({ onChange }: { onChange: (d: string) => void }) {
  const [date, setDate] = useState("");

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-gray-600">As-of date:</label>
      <input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          onChange(e.target.value);
        }}
        className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {date && (
        <button
          onClick={() => {
            setDate("");
            onChange("");
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}
