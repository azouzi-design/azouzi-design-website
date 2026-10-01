"use client";

import { useState } from "react";
import { linkClasses } from "@/lib/styles";

export function CopyEmailLink({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing sensible to fall back to.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={linkClasses}
    >
      {copied ? "Copied!" : "Copy Email"}
    </button>
  );
}
