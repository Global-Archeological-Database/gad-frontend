/**
 * Maps artifact age string to a hex color for marker and UI accent.
 * Used by both ArtifactMarker and ArtifactDetailPanel.
 */
export function getAgeColor(age: string | null | undefined): string {
  if (!age) return '#888780';
  const ageLower = age.toLowerCase();

  // Check for BCE/BC dates
  const bceMatch = ageLower.match(/(\d+)\s*(bce|bc)/);
  if (bceMatch) {
    const year = parseInt(bceMatch[1], 10);
    if (year > 1500) return '#B8860B';
    return '#722F37';
  }

  // Check for CE/AD dates
  const ceMatch = ageLower.match(/(\d+)\s*(ce|ad)/);
  if (ceMatch) {
    const year = parseInt(ceMatch[1], 10);
    if (year < 500) return '#B8860B';
    if (year < 1500) return '#722F37';
    if (year < 1900) return '#2D5A27';
    return '#4A6FA5';
  }

  // Check for century references
  const centuryMatch = ageLower.match(/(\d+)(st|nd|rd|th)\s*century/);
  if (centuryMatch) {
    const century = parseInt(centuryMatch[1], 10);
    if (century <= 5) return '#B8860B';
    if (century <= 15) return '#722F37';
    if (century <= 19) return '#2D5A27';
    return '#4A6FA5';
  }

  // Check for millennia
  const millenniumMatch = ageLower.match(/(\d+)(st|nd|rd|th)\s*millennium/);
  if (millenniumMatch) return '#B8860B';

  return '#888780';
}
