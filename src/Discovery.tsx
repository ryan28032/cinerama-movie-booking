import { useState } from 'react'

type CinemaPlace = {
  id: number
  name: string
  lat: number
  lon: number
  tags: Record<string, string>
}

type Screening = {
  id: string
  title: string
  theater: string
  time: string
  format?: string
  url?: string
  address?: string
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const CINEMA_API = 'https://opencinemaproject.com/api/v1/public'

function safeWebsite(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

function normalizeScreening(value: Record<string, unknown>, index: number): Screening {
  const id = String(value.id ?? value.screening_id ?? index)
  return {
    id,
    title: String(value.film_title ?? value.title ?? 'Film screening'),
    theater: String(value.theater_name ?? value.venue_name ?? 'Local cinema'),
    time: String(value.start_time ?? value.datetime ?? value.showtime ?? 'Time not listed'),
    format: value.format ? String(value.format) : value.screening_format ? String(value.screening_format) : undefined,
    url: safeWebsite(String(value.purchase_url ?? value.booking_url ?? value.ticket_url ?? '')),
    address: value.theater_address ? String(value.theater_address) : value.address ? String(value.address) : undefined,
  }
}

export default function Discovery() {
  const [places, setPlaces] = useState<CinemaPlace[]>([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Use your location to find nearby cinema listings.')
  const [error, setError] = useState('')

  const findNearby = () => {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser. You can still browse films above.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('Finding cinemas nearby…')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const point = { lat: coords.latitude, lon: coords.longitude }
      const radius = 25000
      const query = `[out:json][timeout:20];(node[amenity=cinema](around:${radius},${point.lat},${point.lon});way[amenity=cinema](around:${radius},${point.lat},${point.lon});relation[amenity=cinema](around:${radius},${point.lat},${point.lon}););out center tags;`
      try {
        let response: Response | undefined
        for (const endpoint of OVERPASS_ENDPOINTS) {
          try {
            response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: query })
            if (response.ok) break
          } catch { /* try the next public Overpass mirror */ }
        }
        if (!response?.ok) throw new Error('Cinema directory is temporarily unavailable.')
        const payload = await response.json() as { elements?: Array<Record<string, unknown>> }
        const found = (payload.elements ?? []).map((element) => {
          const tags = (element.tags ?? {}) as Record<string, string>
          const center = (element.center ?? {}) as Record<string, number>
          return {
            id: Number(element.id),
            name: tags.name || tags['name:en'] || 'Cinema',
            lat: Number(element.lat ?? center.lat),
            lon: Number(element.lon ?? center.lon),
            tags,
          }
        }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
        setPlaces(found)
        setMessage(found.length ? `${found.length} cinema ${found.length === 1 ? 'listing' : 'listings'} within 25 km` : 'No mapped cinemas found within 25 km. Try a larger city or check again later.')
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not load cinema listings right now.')
        setMessage('Nearby listings could not be loaded.')
      }

      if (apiKey.trim()) {
        try {
          const params = new URLSearchParams({ lat: String(point.lat), lon: String(point.lon), radius_km: '50' })
          const showResponse = await fetch(`${CINEMA_API}/screenings?${params}`, { headers: { Authorization: `Bearer ${apiKey.trim()}` } })
          if (!showResponse.ok) throw new Error(showResponse.status === 401 ? 'The Open Cinema API key was not accepted.' : 'Live showtimes could not be loaded right now.')
          const result = await showResponse.json() as { screenings?: Array<Record<string, unknown>> }
          setScreenings((result.screenings ?? []).map(normalizeScreening))
        } catch (reason) {
          setScreenings([])
          setError(reason instanceof Error ? reason.message : 'Live showtimes could not be loaded.')
        }
      } else {
        setScreenings([])
      }
      setBusy(false)
    }, (reason) => {
      setBusy(false)
      setError(reason.code === reason.PERMISSION_DENIED ? 'Location permission was declined. Allow it in your browser to discover nearby cinemas.' : 'Your location could not be determined. Please try again.')
      setMessage('Location needed for nearby listings.')
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 })
  }

  return (
    <section className="discovery-section" id="cinemas">
      <div className="section-wrap">
        <div className="section-heading discovery-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> OUT THERE, ON THE BIG SCREEN</div>
            <h2>Your neighborhood,<br className="mobile-break" /> <em>in the picture.</em></h2>
          </div>
          <p className="section-aside">Find independent cinemas and showtimes around you.<br />Listings link straight to the venue for ticket checkout.</p>
        </div>

        <div className="discovery-panel">
          <div className="discovery-topline">
            <div className="discovery-live"><span className="live-dot" /> LOCAL CINEMA GUIDE <span className="source-chip">OPEN MAP DATA</span></div>
            <button className="button button-primary locate-button" onClick={findNearby} disabled={busy}>{busy ? 'Finding nearby…' : '⌖  Find cinemas near me'}</button>
          </div>
          <div className="discovery-status" aria-live="polite">{message}</div>
          {error && <p className="discovery-error" role="status">{error}</p>}

          {screenings.length > 0 && <div className="showtime-list">
            <div className="discover-subheading"><span>LIVE SHOWTIMES</span><span>Open Cinema Project</span></div>
            {screenings.slice(0, 6).map((show) => <article className="showtime-card" key={show.id}>
              <div className="showtime-poster" aria-hidden="true">✦</div>
              <div className="showtime-info"><strong>{show.title}</strong><span>{show.theater}{show.address ? ` · ${show.address}` : ''}</span></div>
              <div className="showtime-time">{new Date(show.time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
              {show.url ? <a className="venue-link" href={show.url} target="_blank" rel="noreferrer">Tickets ↗</a> : <span className="listing-only">Venue checkout</span>}
            </article>)}
          </div>}

          {places.length > 0 && <div className="cinema-grid">
            {places.slice(0, 9).map((place) => {
              const website = safeWebsite(place.tags.website || place.tags['contact:website'])
              const map = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=17/${place.lat}/${place.lon}`
              return <article className="cinema-card" key={`${place.id}`}>
                <div className="cinema-card-mark">C</div>
                <div className="cinema-card-info"><strong>{place.name}</strong><span>{place.tags['addr:city'] || place.tags['addr:suburb'] || 'Nearby'}{place.tags.operator ? ` · ${place.tags.operator}` : ''}</span></div>
                <div className="cinema-card-actions">{website && <a href={website} target="_blank" rel="noreferrer">Venue ↗</a>}<a href={map} target="_blank" rel="noreferrer">Map ↗</a></div>
              </article>
            })}
          </div>}

          <details className="showtime-access">
            <summary>Connect free indie cinema showtimes</summary>
            <p>Open Cinema Project shares listings from participating independent cinemas. Get a free key, paste it here, then search nearby. The key stays in this browser tab and is sent only to Open Cinema Project.</p>
            <div className="key-row"><input aria-label="Open Cinema Project API key" type="password" autoComplete="off" placeholder="oc_live_… API key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /><button className="button button-primary" onClick={findNearby} disabled={busy || !apiKey.trim()}>Load showtimes</button><a href="https://opencinemaproject.com/developers" target="_blank" rel="noreferrer">Get a free key ↗</a></div>
          </details>
          <div className="data-footnote">Cinema locations © OpenStreetMap contributors · Showtimes by Open Cinema Project. Availability is provided by each venue; purchases and seat holds happen on its own ticketing site.</div>
        </div>
      </div>
    </section>
  )
}
