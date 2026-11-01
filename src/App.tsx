import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Discovery from './Discovery'

const Cinema = lazy(() => import('./Cinema'))
type CameraView = 'overview' | 'front' | 'screen'

type Movie = {
  id: string
  title: string
  genre: string
  runtime: string
  rating: string
  poster: string
  backdrop: string
  tagline: string
  accent: string
}

type Ticket = {
  id: string
  movie: Movie
  date: string
  time: string
  seats: string[]
  total: number
}

const movies: Movie[] = [
  {
    id: 'afterlight', title: 'AFTERLIGHT', genre: 'SCI-FI · ADVENTURE', runtime: '2h 08m', rating: '8.7',
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85',
    backdrop: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=88',
    tagline: 'Somewhere between the stars, we found our way home.', accent: '#c39065',
  },
  {
    id: 'the-last-orbit', title: 'THE LAST ORBIT', genre: 'THRILLER · MYSTERY', runtime: '1h 54m', rating: '8.4',
    poster: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85',
    backdrop: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=2000&q=88',
    tagline: 'The signal was never meant for us.', accent: '#818cab',
  },
  {
    id: 'wild-figures', title: 'WILD FIGURES', genre: 'DRAMA · ROMANCE', runtime: '2h 02m', rating: '9.1',
    poster: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
    backdrop: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2000&q=88',
    tagline: 'A little bit lost. A long way to found.', accent: '#a67857',
  },
  {
    id: 'deep-blue', title: 'DEEP BLUE', genre: 'DOCUMENTARY · NATURE', runtime: '1h 46m', rating: '9.3',
    poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85',
    backdrop: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2000&q=88',
    tagline: 'The world beneath the surface is another world.', accent: '#668998',
  },
]

const showtimes = ['10:30 AM', '1:45 PM', '5:15 PM', '8:40 PM']
const seatPrices = [12, 12, 16, 16, 22, 22]
const seatKeys = 'ABCDEF'.split('').flatMap((row) => Array.from({ length: 10 }, (_, index) => `${row}${index + 1}`))
const STORE_KEY = 'cinerama-bookings-v1'

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function nextDates() {
  const today = new Date()
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    return { key: localDateKey(date), day: index === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' }), date: date.toLocaleDateString('en', { day: '2-digit', month: 'short' }) }
  })
}

function readBookings(): Record<string, string[]> {
  try {
    const value = localStorage.getItem(STORE_KEY)
    return value ? JSON.parse(value) as Record<string, string[]> : {}
  } catch {
    return {}
  }
}

function screeningKey(movie: Movie | null, date: string, time: string) {
  return `${movie?.id ?? 'none'}|${date}|${time}`
}

function initialOccupied(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619)
  return seatKeys.filter((seat) => {
    hash = Math.imul(hash ^ seat.charCodeAt(seat.length - 1), 16777619)
    return (hash >>> 0) % 7 === 0
  })
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function makeTicketCode() {
  return `CN-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function downloadTicket(ticket: Ticket) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 660
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = '#151411'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#c49a70'
  context.fillRect(0, 0, 18, canvas.height)
  context.fillStyle = '#eee9df'
  context.font = '700 28px Manrope, Arial'
  context.fillText('CINERAMA  /  ADMIT ONE', 70, 82)
  context.fillStyle = '#a9a197'
  context.font = '600 17px Arial'
  context.fillText('YOUR NIGHT AT THE MOVIES', 72, 118)
  context.fillStyle = '#eee9df'
  context.font = '800 52px Manrope, Arial'
  context.fillText(ticket.movie.title, 70, 210)
  context.font = '500 24px Arial'
  context.fillStyle = '#d0c8bb'
  const lines = [
    `DATE   ${new Date(`${ticket.date}T12:00:00`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    `TIME   ${ticket.time}`,
    `SEATS   ${ticket.seats.join(', ')}`,
    `TOTAL   $${ticket.total.toFixed(2)}`,
    `BOOKING CODE   ${ticket.id}`,
  ]
  lines.forEach((line, index) => context.fillText(line, 72, 292 + index * 53))
  context.setLineDash([8, 10])
  context.strokeStyle = '#625647'
  context.beginPath()
  context.moveTo(905, 40)
  context.lineTo(905, 620)
  context.stroke()
  context.setLineDash([])
  context.fillStyle = '#f3eee5'
  context.fillRect(960, 250, 170, 170)
  context.fillStyle = '#141311'
  for (let row = 0; row < 21; row += 1) {
    for (let column = 0; column < 21; column += 1) {
      const seed = ticket.id.charCodeAt((row * 7 + column * 3) % ticket.id.length)
      const inMarker = (row < 7 && column < 7) || (row < 7 && column > 13) || (row > 13 && column < 7)
      if (inMarker ? (row % 6 === 0 || column % 6 === 0 || (row % 6 > 1 && column % 6 > 1)) : (seed + row * 11 + column * 13) % 3 !== 0) {
        context.fillRect(966 + column * 7.5, 256 + row * 7.5, 6, 6)
      }
    }
  }
  context.fillStyle = '#d0c8bb'
  context.font = '600 17px Arial'
  context.textAlign = 'center'
  context.fillText('SCAN AT THE DOOR', 1045, 458)
  const link = document.createElement('a')
  link.download = `cinerama-${ticket.id.toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function App() {
  const reduceMotion = useReducedMotion()
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('cinerama-theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch { /* local storage can be unavailable */ }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const dates = useMemo(nextDates, [])
  const [movie, setMovie] = useState<Movie | null>(null)
  const [date, setDate] = useState(dates[0].key)
  const [time, setTime] = useState(showtimes[2])
  const [selected, setSelected] = useState<string[]>([])
  const [bookings, setBookings] = useState<Record<string, string[]>>(readBookings)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [view, setView] = useState<CameraView>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sceneActive, setSceneActive] = useState(false)
  const sceneHost = useRef<HTMLDivElement>(null)
  const key = screeningKey(movie, date, time)
  const reserved = useMemo(() => [...initialOccupied(key), ...(bookings[key] ?? [])], [key, bookings])
  const availableCount = seatKeys.length - new Set(reserved).size
  const total = selected.reduce((sum, seat) => {
    const row = 'ABCDEF'.indexOf(seat[0])
    return sum + seatPrices[row]
  }, 0)

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(bookings)) } catch { /* storage can be disabled in private browsing */ }
  }, [bookings])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('cinerama-theme', theme) } catch { /* keep the selected theme for this visit */ }
  }, [theme])

  useEffect(() => {
    const host = sceneHost.current
    if (!host || sceneActive) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSceneActive(true)
        observer.disconnect()
      }
    }, { rootMargin: '240px 0px' })
    observer.observe(host)
    return () => observer.disconnect()
  }, [sceneActive])

  const pickMovie = (picked: Movie) => {
    setMovie(picked)
    setSelected([])
    setTicket(null)
    window.setTimeout(() => scrollTo('booking'), 90)
  }

  const changeScreening = (next: () => void) => {
    setSelected([])
    setTicket(null)
    next()
  }

  const toggleSeat = (seat: string) => {
    if (!movie || reserved.includes(seat)) return
    setTicket(null)
    setSelected((current) => current.includes(seat) ? current.filter((item) => item !== seat) : current.length < 8 ? [...current, seat] : current)
  }

  const confirmBooking = () => {
    if (!movie || selected.length === 0) return
    const nextTicket: Ticket = { id: makeTicketCode(), movie, date, time, seats: [...selected].sort(), total }
    setBookings((current) => ({ ...current, [key]: [...new Set([...(current[key] ?? []), ...selected])] }))
    setTicket(nextTicket)
    setSelected([])
    window.setTimeout(() => scrollTo('ticket'), 120)
  }

  const fadeUp = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Cinerama home"><span className="brand-mark">C</span><span>CINERAMA</span></a>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <a href="#films" onClick={() => setMenuOpen(false)}>Now showing</a>
          <a href="#cinemas" onClick={() => setMenuOpen(false)}>Cinemas near me</a>
          <a href="#booking" onClick={() => setMenuOpen(false)}>Book seats</a>
          {ticket && <a href="#ticket" onClick={() => setMenuOpen(false)}>My ticket</a>}
        </nav>
        <button className="theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span><span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span></button>
        <button className="nav-cta" onClick={() => scrollTo('cinemas')}>Find cinemas <span aria-hidden="true">↗</span></button>
        <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
      </header>

      <main id="top">
        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(12,11,10,.95) 0%, rgba(12,11,10,.78) 39%, rgba(12,11,10,.15) 100%), linear-gradient(0deg, #100f0e 0%, transparent 32%), url("${movies[0].backdrop}")` }}>
          <div className="hero-content">
            <motion.div {...fadeUp} className="eyebrow"><span className="eyebrow-line" /> AN INDEPENDENT CINEMA EXPERIENCE</motion.div>
            <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>MAKE A NIGHT<br />OF <em>IT.</em></motion.h1>
            <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 }}>The lights go down. The rest of the world can wait.</motion.p>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="hero-actions">
              <button className="button button-primary" onClick={() => scrollTo('cinemas')}>Find a cinema <span>↗</span></button>
              <a className="text-link" href="#films">Explore films <span>↓</span></a>
            </motion.div>
          </div>
          <div className="hero-note"><span className="live-dot" /> CINERAMA PREVIEW <span className="hero-note-separator">/</span> A CINEMATIC BOOKING CONCEPT</div>
          <div className="hero-index"><span>01</span><i /> 04</div>
        </section>

        <section className="film-section section-wrap" id="films">
          <div className="section-heading">
            <motion.div {...fadeUp}>
              <div className="eyebrow"><span className="eyebrow-line" /> CINERAMA PREVIEW · SAMPLE TITLES</div>
              <h2>Stories worth<br className="mobile-break" /> <em>showing up for.</em></h2>
            </motion.div>
            <motion.p {...fadeUp} className="section-aside">These are sample titles for the booking preview.<br />Choose a city below for real mapped cinema listings.</motion.p>
          </div>
          <div className="movie-grid">
            {movies.map((item, index) => (
              <motion.article {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.06 }} className="movie-card" key={item.id}>
                <button className="poster-button" onClick={() => pickMovie(item)} aria-label={`Book ${item.title}`}>
                  <img className="poster-image" src={item.poster} alt={`${item.title} film artwork`} loading="lazy" />
                  <span className="poster-shade" />
                  <span className="poster-rating"><span>★</span> {item.rating}</span>
                  <span className="poster-play" aria-hidden="true">↗</span>
                  <span className="poster-title">{item.title}</span>
                </button>
                <div className="movie-meta"><span>{item.genre}</span><span>{item.runtime}</span></div>
                <button className="movie-book" onClick={() => pickMovie(item)}>Choose a screening <span>↗</span></button>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="booking-section" id="booking">
          <div className="section-wrap">
            <div className="section-heading booking-heading">
              <motion.div {...fadeUp}>
                <div className="eyebrow"><span className="eyebrow-line" /> YOUR EVENING, YOUR WAY</div>
                <h2>Pick your <em>perfect seat.</em></h2>
              </motion.div>
              <motion.p {...fadeUp} className="section-aside">Move around the room. Find your view.<br />This is the fun part.</motion.p>
            </div>

            <Discovery />

            <div className="booking-shell">
              <div className="booking-main">
                <div className="booking-topline"><span className="hall-label"><span className="live-dot" /> CINERAMA · SCREEN 01</span><span className="seat-count">{availableCount} seats left</span></div>
                <div className="cinema-toolbar">
                  <div className="camera-tabs" aria-label="Camera view">
                    {([['overview', 'Room view'], ['front', 'Seat view'], ['screen', 'Screen view']] as [CameraView, string][]).map(([value, label]) => <button key={value} className={view === value ? 'camera-tab active' : 'camera-tab'} onClick={() => setView(value)}>{label}</button>)}
                  </div>
                  <span className="drag-hint"><span aria-hidden="true">↔</span> DRAG TO LOOK AROUND</span>
                </div>
                <div className="scene-wrap" ref={sceneHost}>
                  {sceneActive ? <Suspense fallback={<div className="scene-loading">Preparing your room<span>·</span><span>·</span><span>·</span></div>}><Cinema selected={selected} reserved={reserved} onSelect={toggleSeat} view={view} title={movie?.title ?? 'YOUR NIGHT, YOUR WAY'} /></Suspense> : <div className="scene-loading">Your seats are waiting</div>}
                  <div className="scene-caption"><span>SCREEN</span></div>
                  <div className="scene-help">Click a seat to select · Scroll to zoom</div>
                </div>
                <div className="seat-legend">
                  <span><i className="legend-dot available" /> Available</span>
                  <span><i className="legend-dot chosen" /> Your seat</span>
                  <span><i className="legend-dot taken" /> Taken</span>
                  <span className="legend-divider" />
                  <span><i className="legend-dot standard" /> Standard $12</span>
                  <span><i className="legend-dot premium" /> Premium $16</span>
                  <span><i className="legend-dot vip" /> Lounge $22</span>
                </div>
              </div>

              <aside className="booking-aside" aria-label="Booking details">
                <div className="aside-title"><div><span className="eyebrow">YOUR SCREENING</span><h3>{movie ? movie.title : 'Choose a film'}</h3></div><span className="aside-step">01 <i /> 03</span></div>
                <div className="detail-group">
                  <div className="detail-label">PICK A DATE</div>
                  <div className="date-options">
                    {dates.map((item) => <button key={item.key} className={date === item.key ? 'date-option selected' : 'date-option'} onClick={() => changeScreening(() => setDate(item.key))}><span>{item.day}</span><strong>{item.date}</strong></button>)}
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">SHOWTIME</div>
                  <div className="time-options">
                    {showtimes.map((item) => <button key={item} className={time === item ? 'time-option selected' : 'time-option'} onClick={() => changeScreening(() => setTime(item))}>{item}</button>)}
                  </div>
                </div>
                <div className="detail-group seats-group">
                  <div className="detail-label">YOUR SEATS <span>{selected.length}/8</span></div>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {selected.length === 0 ? <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="empty-seats">{movie ? 'Choose a seat in the room to get started.' : 'Pick a film first, then choose your seats.'}</motion.div> :
                      <motion.div className="selected-seats" key="selected">{selected.map((seat) => <motion.button layout initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} key={seat} className="selected-seat" onClick={() => toggleSeat(seat)} aria-label={`Remove seat ${seat}`}>{seat}<span>×</span></motion.button>)}</motion.div>}
                  </AnimatePresence>
                </div>
                <div className="booking-total"><span>Subtotal <small>{selected.length} {selected.length === 1 ? 'ticket' : 'tickets'}</small></span><strong>${total.toFixed(2)}</strong></div>
                <button className="button button-primary confirm-button" disabled={!movie || selected.length === 0} onClick={confirmBooking}>Confirm booking <span>↗</span></button>
                <p className="demo-note">Demo booking · no payment required</p>
              </aside>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {ticket && <motion.section id="ticket" className="ticket-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div className="section-wrap">
              <div className="ticket-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> IT'S A DATE</div><h2>Your night is <em>on.</em></h2></div><p>One little ticket. One very good night.</p></div>
              <article className="ticket-card">
                <div className="ticket-art" style={{ backgroundImage: `linear-gradient(0deg, rgba(12,11,10,.92), transparent 74%), url("${ticket.movie.poster}")` }}><span className="ticket-brand">CINERAMA</span><span className="ticket-film-title">{ticket.movie.title}</span></div>
                <div className="ticket-info">
                  <div className="ticket-label">YOUR ADMISSION</div>
                  <div className="ticket-facts">
                    <div><span>DATE</span><strong>{new Date(`${ticket.date}T12:00:00`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
                    <div><span>SHOWTIME</span><strong>{ticket.time}</strong></div>
                    <div><span>SEATS</span><strong>{ticket.seats.join(', ')}</strong></div>
                    <div><span>TOTAL</span><strong>${ticket.total.toFixed(2)}</strong></div>
                  </div>
                  <div className="ticket-code"><span>BOOKING CODE</span><strong>{ticket.id}</strong></div>
                  <button className="button button-primary download-button" onClick={() => downloadTicket(ticket)}>Download ticket <span>↓</span></button>
                </div>
              </article>
            </div>
          </motion.section>}
        </AnimatePresence>

        <section className="closing-section"><div className="section-wrap closing-inner"><span className="eyebrow">GOOD FILMS. BETTER COMPANY.</span><p>See you in the <em>dark.</em></p><a href="#films">Find your next film <span>↗</span></a></div></section>
      </main>
      <footer className="footer"><a className="brand" href="#top"><span className="brand-mark">C</span><span>CINERAMA</span></a><span>Independent cinema for the love of it.</span><span>© CINERAMA 2026</span></footer>
    </>
  )
}

export default App
