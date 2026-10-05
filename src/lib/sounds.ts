import { defineSound, ensureReady, getMasterBus } from "@web-kits/audio";
import { click, send, tap } from "@/audio/minimal";

// The "Minimal" patch from @web-kits/audio: quiet sine blips for UI feedback.
let voices:
  | Record<"send" | "click" | "tap", ReturnType<typeof defineSound>>
  | undefined;

function voice() {
  return (voices ??= {
    send: defineSound(send),
    click: defineSound(click),
    tap: defineSound(tap),
  });
}

// Like the page's other motion, sound is skipped for visitors who asked for
// less movement.
function quiet() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * "Send", for the page-load sequence. Plays only if the browser already lets
 * this page make sound: browsers keep audio locked until a visitor has
 * interacted, and a sound started then would pile up and play all at once on
 * their first click. Otherwise it is simply skipped.
 */
export function playSend() {
  if (typeof window === "undefined" || quiet()) return;
  if (getMasterBus().context.state !== "running") return;
  voice().send();
}

/** "Click" (mouse, pen, keyboard) or "Tap" (touch), from a user's click. */
export function playPress(kind: "click" | "tap") {
  if (typeof window === "undefined" || quiet()) return;
  // A click is a user gesture, so this unlocks audio on the first one.
  ensureReady()
    .then(() => voice()[kind]())
    .catch(() => {});
}
