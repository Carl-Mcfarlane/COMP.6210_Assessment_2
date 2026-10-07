import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useScpEntries } from '../data/useScpEntries.js'
import { useAuth } from '../hooks/useAuth.js'
import { filterEntries } from '../utils/filterEntries.js'
import ObjectClassBadge from './ObjectClassBadge.jsx'
import logo from '../assets/images/SCP_Foundation_Logo_White.png'
import './DetailHeader.css'

const MAX_SUGGESTIONS = 6

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" role="presentation" aria-hidden="true">
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
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" role="presentation" aria-hidden="true">
      <line
        x1="5"
        y1="5"
        x2="15"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="5"
        x2="5"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// fixed bar at the top of the detail page - back button, logo, and a
// search box with its own dropdown of matching entries as you type
function DetailHeader() {
  const { entries } = useScpEntries()
  const { user, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    return filterEntries(entries, query).slice(0, MAX_SUGGESTIONS)
  }, [entries, query])

  const showDropdown = isFocused && query.trim() !== ''

  useEffect(() => {
    if (isMobileSearchOpen) {
      inputRef.current?.focus()
    }
  }, [isMobileSearchOpen])

  function handleSubmit(event) {
    event.preventDefault()
    navigate(`/catalogue?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSelect() {
    setQuery('')
    setIsFocused(false)
    setIsMobileSearchOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setIsFocused(false)
      setIsMobileSearchOpen(false)
      event.currentTarget.blur()
    }
  }

  return (
    <div className="detail-header">
      <div
        className={`detail-header__inner ${isMobileSearchOpen ? 'detail-header__inner--search-open' : ''}`}
      >
        <Link to="/catalogue" className="detail-header__back">
          &larr; Back
        </Link>

        <img
          src={logo}
          alt="SCP Foundation"
          className="detail-header__logo"
        />

        <div className="detail-header__right">
          <form
            className={`detail-header__search ${isMobileSearchOpen ? 'detail-header__search--open' : ''}`}
            onSubmit={handleSubmit}
          >
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              aria-label="Search by ID or object class"
              autoComplete="off"
            />

            {showDropdown && (
              <div className="detail-header__suggestions">
                {suggestions.length === 0 ? (
                  <p className="detail-header__suggestion-empty">
                    No matches for “{query}”.
                  </p>
                ) : (
                  suggestions.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/scp/${entry.id}`}
                      className="detail-header__suggestion"
                      // without this the input's onBlur fires first and
                      // hides the dropdown before the click/navigation
                      // actually registers
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleSelect}
                    >
                      <span>{entry.id}</span>
                      <ObjectClassBadge objectClass={entry.objectClass} />
                    </Link>
                  ))
                )}
                <Link
                  to={`/catalogue?q=${encodeURIComponent(query.trim())}`}
                  className="detail-header__suggestions-footer"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleSelect}
                >
                  See all matches in catalogue
                </Link>
              </div>
            )}
          </form>

          <button
            type="button"
            className="detail-header__search-toggle"
            onClick={() => setIsMobileSearchOpen((open) => !open)}
            aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
          >
            {isMobileSearchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>

          {user && (
            <div className="detail-header__account">
              <button
                type="button"
                className="detail-header__sign-out"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailHeader
