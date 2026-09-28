"use client";

import React from "react";

export default function CyclesTab() {
  return (
    <div>
      <h3 className="text-title-lg font-headline font-bold text-on-surface mb-4">Performance Cycles</h3>
      <div className="grid gap-4">
        {[
          { name: "Q3 2026 Annual Review", status: "In Progress", date: "Sep 1 - Sep 30" },
          { name: "Mid-Year Check-in", status: "Completed", date: "Jun 1 - Jun 15" }
        ].map((cycle, i) => (
          <div key={i} className="flex justify-between items-center p-4 border border-outline-variant/40 rounded-xl hover:shadow-sm transition-shadow bg-surface-container-lowest">
            <div>
              <h4 className="font-bold text-on-surface">{cycle.name}</h4>
              <p className="text-sm text-on-surface-variant mt-1">{cycle.date}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${cycle.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
              {cycle.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
