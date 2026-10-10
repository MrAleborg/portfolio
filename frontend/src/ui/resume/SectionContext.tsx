/** Stub for the red gate: the signature only, no behaviour yet. */
export function useSectionEntry(
  initiallyOpen: boolean,
): readonly [boolean, (open: boolean) => void] {
  return [initiallyOpen, () => {}]
}
