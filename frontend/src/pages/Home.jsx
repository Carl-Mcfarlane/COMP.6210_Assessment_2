import { Link } from 'react-router-dom'
import { useScpEntries } from '../data/useScpEntries.js'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import logo from '../assets/images/SCP_Foundation_Logo_White.png'
import backgroundImage from '../assets/images/background.jpg'
import './Home.css'

// landing page at "/" - just branding and a button through to the catalogue
function Home() {
  useDocumentTitle('SCP Foundation')
  const { entries, loading, error } = useScpEntries()
  const { user, signOut } = useAuth()

  return (
    <section
      className="home"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="home__overlay" aria-hidden="true" />

      {user && (
        <div className="home__account">
          <span className="home__email">{user.email}</span>
          <button type="button" className="home__sign-out" onClick={signOut}>
            Sign Out
          </button>
        </div>
      )}

      <div className="home__content">
        <img src={logo} alt="SCP Foundation" className="home__logo" />
        <p className="home__kicker">Secure. Contain. Protect.</p>
        <h1 className="home__title">SCP Foundation Database</h1>
        <p className="home__lead">
          A restricted-access catalogue of anomalous items, entities, and
          phenomena currently held in Foundation containment.
        </p>
        {/* entries can't be fetched without signing in, so this just hides
            for a signed-out visitor instead of showing an error */}
        {!loading && !error && (
          <p className="home__count">{entries.length} entries on file</p>
        )}
        {user ? (
          <Link to="/catalogue" className="home__cta">
            Browse Catalogue
          </Link>
        ) : (
          <div className="home__auth-links">
            <Link to="/login" className="home__cta">
              Sign In
            </Link>
            <Link to="/signup" className="home__cta home__cta--secondary">
              Create Account
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default Home
