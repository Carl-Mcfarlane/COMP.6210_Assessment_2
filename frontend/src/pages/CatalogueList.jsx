import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useScpEntries } from '../data/useScpEntries.js'
import { useAuth } from '../hooks/useAuth.js'
import { filterEntries } from '../utils/filterEntries.js'
import { getObjectClassKey } from '../utils/objectClassBadge.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import ObjectClassBadge from '../components/ObjectClassBadge.jsx'
import Skeleton from '../components/Skeleton.jsx'
import logo from '../assets/images/SCP_Foundation_Logo_White.png'
import './CatalogueList.css'

const SKELETON_CARD_COUNT = 6

// same shape as a real card, just grey blocks - keeps the grid from
// jumping around once the actual entries load in
function CardSkeleton() {
  return (
    <div className="scp-card" aria-hidden="true">
      <div className="scp-card__thumb">
        <Skeleton className="scp-card__thumb-skeleton" />
      </div>
      <div className="scp-card__body">
        <Skeleton style={{ width: '72px', height: '18px' }} />
        <Skeleton style={{ width: '64px', height: '22px' }} />
      </div>
    </div>
  )
}

// generic image icon for entries that don't have a photo yet
function PlaceholderIcon() {
  return (
    <svg
      className="scp-card__placeholder"
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"
      />
      <circle
        cx="9"
        cy="10"
        r="1.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 17 4.5-4.5a1.5 1.5 0 0 1 2.12 0L15 16m-1.5-1.5 1.29-1.29a1.5 1.5 0 0 1 2.12 0L19 15.5"
      />
    </svg>
  )
}

// main browse page - search bar plus the grid of cards
function CatalogueList() {
  useDocumentTitle('SCP Catalogue')
  const { entries, loading } = useScpEntries()
  const { role, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  // if you search from the detail page it lands here as /catalogue?q=...,
  // so read that in as the starting value
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')

  const filteredEntries = useMemo(
    () => filterEntries(entries, query),
    [entries, query],
  )

  return (
    <section className="catalogue">
      <button type="button" className="catalogue__sign-out" onClick={signOut}>
        Sign Out
      </button>

      <h1 className="catalogue__title">
        <img
          src={logo}
          alt="SCP Foundation"
          className="catalogue__logo"
        />
      </h1>
      <div className="catalogue__search-wrap">
        <svg
          className="catalogue__search-icon"
          viewBox="0 0 20 20"
          role="presentation"
          aria-hidden="true"
        >
          <circle
            cx="9"
            cy="9"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="13.75"
            y1="13.75"
            x2="18"
            y2="18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          className="catalogue__search"
          placeholder="Search by ID or object class…"
          aria-label="Search by ID or object class"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {role === 'admin' && (
        <div className="catalogue__toolbar">
          <Link to="/scp/new" className="catalogue__new">
            + New Entry
          </Link>
        </div>
      )}

      {loading ? (
        <div className="catalogue__grid">
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <p className="catalogue__empty">No entries match “{query}”.</p>
      ) : (
        <div className="catalogue__grid">
          {filteredEntries.map((entry) => {
            return (
              <Link
                key={entry.id}
                to={`/scp/${entry.id}`}
                className="scp-card"
                data-class={getObjectClassKey(entry.objectClass)}
              >
                <div className="scp-card__thumb">
                  {entry.image ? (
                    <img src={entry.image} alt="" loading="lazy" />
                  ) : (
                    <PlaceholderIcon />
                  )}
                </div>
                <div className="scp-card__body">
                  <span className="scp-card__id">{entry.id}</span>
                  <ObjectClassBadge objectClass={entry.objectClass} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default CatalogueList
