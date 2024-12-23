"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function Install() {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("npx languine@latest");
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="text-sm font-mono">
      <p>Install Languine CLI</p>

      <div className="flex items-center mt-4 space-x-2">
        <span className="text-primary">$ npx languine@latest</span>
        <button
          type="button"
          onClick={copyCommand}
          className="active:scale-90 transition-transform"
        >
          {copied ? (
            <Check className="size-4 transition-colors" />
          ) : (
            <Copy className="size-4 hover:text-primary transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
