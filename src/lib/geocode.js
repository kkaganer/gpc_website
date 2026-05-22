// Convert a UK postcode to coordinates using the free api.postcodes.io service.
// Tries the full postcode first, then falls back to the outcode (e.g. "SE13").
// Returns { lat, lng } on success, or null if not found / lookup fails. Never throws.
export async function geocodePostcode(postcode) {
  const cleaned = (postcode || '').replace(/\s/g, '').toUpperCase()
  if (cleaned.length < 2) return null

  try {
    const fullRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`)
    const fullData = await fullRes.json()
    if (fullData.status === 200 && fullData.result) {
      return { lat: fullData.result.latitude, lng: fullData.result.longitude }
    }

    const partRes = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(cleaned)}`)
    const partData = await partRes.json()
    if (partData.status === 200 && partData.result) {
      return { lat: partData.result.latitude, lng: partData.result.longitude }
    }
  } catch {
    /* fall through to null */
  }

  return null
}
