"use client";

import React from "react";

export default function TeamTab() {
  return (
    <div>
      <h3 className="text-title-lg font-headline font-bold text-on-surface mb-4">My Team</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center p-4 border border-outline-variant/40 rounded-xl gap-4 bg-surface-container-lowest">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              T{i}
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-sm">Team Member {i}</h4>
              <p className="text-xs text-on-surface-variant">Developer</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
