export type GeoPoint = { lat: number; lng: number }

export function parseNominatim(json: unknown): GeoPoint | null {
  if (!Array.isArray(json) || json.length === 0) return null
  const first = json[0] as Record<string, unknown>
  const lat = Number(first.lat)
  const lng = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function buildAddressQuery(a: {
  logradouro: string
  numero: string
  cidade: string
  estado: string
}): string {
  return `${a.logradouro}, ${a.numero}, ${a.cidade}, ${a.estado}, Brasil`
}

export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'pet-stop/1.0' } })
    if (!res.ok) return null
    return parseNominatim(await res.json())
  } catch {
    return null
  }
}
