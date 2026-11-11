/** Local public assets — each path should appear in at most one primary UI slot. */
export const LOCAL_MEDIA = {
  logo: "/logo.png",
  heroDoctor: "/doctor.png",
  excellenceDoctor: "/doctors-9.png",
  researchBg:
    "/digital-health-medical-research-background-with-heartbeat-line.avif",
  femaleDoctor:
    "/10-109014_female-doctor-transparent-images-medical-assistant.png",
  teamPortrait: "/people-01.jpg",
} as const;

export type LocalMediaKey = keyof typeof LOCAL_MEDIA;

/** Unique fallback portraits for lists (no repeats within a single list). */
export const PORTRAIT_POOL = [
  LOCAL_MEDIA.teamPortrait,
  LOCAL_MEDIA.excellenceDoctor,
  LOCAL_MEDIA.femaleDoctor,
  LOCAL_MEDIA.heroDoctor,
] as const;

export function uniquePortrait(index: number, used = new Set<string>()) {
  for (let i = 0; i < PORTRAIT_POOL.length; i += 1) {
    const candidate = PORTRAIT_POOL[(index + i) % PORTRAIT_POOL.length];
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  return LOCAL_MEDIA.teamPortrait;
}
