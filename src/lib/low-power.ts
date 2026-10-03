// Decides, once per visit, whether this device can afford the expensive bits
// of motion (animated blur, the badge's full-quality shadows). Rather than
// guessing from the device or browser, it watches how smoothly the first
// second of the page actually renders; the intro's card reveal is playing
// then, so it's a fair sample of the work the animations will add.

// A frame slower than this missed a 40fps budget.
const SLOW_FRAME_MS = 25;
// Low power once more than this share of frames are slow. A share (not an
// average) so the odd long task, like hydration, doesn't count against a
// device that otherwise keeps up.
const SLOW_SHARE = 0.3;
const PROBE_MS = 1000;
// Below this many frames there isn't enough to judge.
const MIN_FRAMES = 10;

let hinted = false;
let frames = 0;
let slowFrames = 0;

/** Cheap signals that a device is low-end or the user wants to save data. */
function lowPowerHints() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return (
    nav.connection?.saveData === true ||
    (nav.deviceMemory ?? Infinity) <= 2 ||
    (nav.hardwareConcurrency ?? Infinity) <= 2
  );
}

function probeFrames() {
  const start = performance.now();
  let last = start;
  const tick = (now: number) => {
    frames++;
    if (now - last > SLOW_FRAME_MS) slowFrames++;
    last = now;
    if (now - start < PROBE_MS) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (typeof window !== "undefined") {
  hinted = lowPowerHints();
  if (!hinted) probeFrames();
}

/**
 * True when this device should get the lighter motion. Before the probe ends
 * it answers from the frames seen so far, so early callers still get a read.
 */
export function isLowPower() {
  return hinted || (frames >= MIN_FRAMES && slowFrames / frames > SLOW_SHARE);
}
