import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import logo from '../assets/images/SCP_Foundation_Logo_White.png'
import './SCPForm.css'

function Login() {
  useDocumentTitle('Sign In · SCP Catalogue')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: signInError } = await signIn(email.trim(), password)
    if (signInError) {
      setError(signInError)
      setSubmitting(false)
      return
    }

    navigate(location.state?.from?.pathname ?? '/catalogue', { replace: true })
  }

  return (
    <section className="scp-form-page scp-form-page--auth">
      <Link to="/" className="scp-form-page__logo-link">
        <img src={logo} alt="SCP Foundation" className="scp-form-page__logo" />
      </Link>

      <form className="scp-form" onSubmit={handleSubmit}>
        <p className="scp-form__kicker">Foundation Personnel</p>
        <h1 className="scp-form__title">Sign In</h1>

        <label className="scp-form__field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="scp-form__field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="scp-form__error">{error.message}</p>}

        <div className="scp-form__actions">
          <Link to="/signup" className="scp-form__cancel">
            Sign Up
          </Link>
          <button type="submit" className="scp-form__submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default Login
