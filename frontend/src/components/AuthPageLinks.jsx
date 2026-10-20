import { Link } from 'react-router-dom'
import './AuthPageLinks.css'

// escape routes under the Sign In / Sign Up cards, so a visitor who doesn't
// want to sign in can get back to the landing page or browse as a guest
function AuthPageLinks() {
  return (
    <nav className="auth-page-links" aria-label="Leave this page">
      <Link to="/">&larr; Back to home</Link>
      <Link to="/catalogue">Browse the catalogue</Link>
    </nav>
  )
}

export default AuthPageLinks
