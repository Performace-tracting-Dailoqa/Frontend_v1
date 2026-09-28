"use client";

import React from "react";

export default function JapaneseTab() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-[#a44100] mb-2">translate</span>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">Japanese Language Diagnostics</h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
        JLPT N5 curriculum assessments and Kanji drill monitoring modules.
      </p>
    </div>
  );
}
