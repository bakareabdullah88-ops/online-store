/**
 * Where each spot on campus sits, so the app can say how far a shop is and how
 * long the walk takes. Keyed by zone id (ids never change; see seed/campuses).
 *
 * UNILAG points come from OpenStreetMap (© OpenStreetMap contributors, ODbL).
 * The halls marked `approx` aren't on the map yet, so they're placed by hand
 * in the right part of campus; adjust them if they look off.
 */
export type LatLng = { lat: number; lng: number; approx?: true };

export const zonePoints: Record<string, LatLng> = {
  // Halls
  "unilag-z1": { lat: 6.51751, lng: 3.39676 }, // Moremi Hall
  "unilag-z2": { lat: 6.51624, lng: 3.39804 }, // Jaja Hall
  "unilag-z3": { lat: 6.51922, lng: 3.39353 }, // Eni Njoku Hall
  "unilag-z8": { lat: 6.51795, lng: 3.39804 }, // Mariere Hall
  "unilag-z9": { lat: 6.5187, lng: 3.3952, approx: true }, // Kofo Ademola Hall
  "unilag-z10": { lat: 6.5184, lng: 3.3963, approx: true }, // Fagunwa Hall
  "unilag-z11": { lat: 6.5155, lng: 3.388, approx: true }, // Sodeinde Hall
  "unilag-z12": { lat: 6.516, lng: 3.3868, approx: true }, // Makama Hall
  "unilag-z13": { lat: 6.5152, lng: 3.38723 }, // Biobaku Hall
  "unilag-z14": { lat: 6.5145, lng: 3.3889, approx: true }, // Madam Tinubu Hall
  "unilag-z15": { lat: 6.517, lng: 3.3882, approx: true }, // El-Kanemi Hall
  "unilag-z16": { lat: 6.51526, lng: 3.3857 }, // Queen Amina Hall
  // Faculties
  "unilag-z4": { lat: 6.5178, lng: 3.39965 }, // Engineering
  "unilag-z5": { lat: 6.51811, lng: 3.398 }, // Arts
  "unilag-z17": { lat: 6.51525, lng: 3.39937 }, // Science
  "unilag-z18": { lat: 6.51594, lng: 3.39107 }, // Social Sciences
  "unilag-z19": { lat: 6.52052, lng: 3.39897 }, // Law
  "unilag-z20": { lat: 6.5165, lng: 3.3897, approx: true }, // Management Sciences
  "unilag-z21": { lat: 6.51789, lng: 3.38728 }, // Environmental Sciences
  "unilag-z22": { lat: 6.51638, lng: 3.3859 }, // Education
  // Landmarks, gate, market
  "unilag-z23": { lat: 6.51971, lng: 3.39882 }, // Senate Building
  "unilag-z24": { lat: 6.52011, lng: 3.39981 }, // Main Library
  "unilag-z25": { lat: 6.51927, lng: 3.40099 }, // Lagoon Front
  "unilag-z26": { lat: 6.501, lng: 3.39289 }, // Sports Centre
  "unilag-z27": { lat: 6.51445, lng: 3.39659 }, // Medical Centre
  "unilag-z28": { lat: 6.51565, lng: 3.39246 }, // Shopping Complex
  "unilag-z6": { lat: 6.5196, lng: 3.3868, approx: true }, // Main Gate
  // "Yaba / Akoka (off campus)" (unilag-z7) is a whole district, not a spot,
  // so it has no point: distances to it are left unsaid rather than guessed.
};
