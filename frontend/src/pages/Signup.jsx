import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import logo from '../assets/images/SCP_Foundation_Logo_White.png'
import './SCPForm.css'

function Signup() {
  useDocumentTitle('Create Account · SCP Catalogue')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const { data, error: signUpError } = await signUp(email.trim(), password)
    if (signUpError) {
      setError(signUpError)
      setSubmitting(false)
      return
    }

    // if email confirmation is required, Supabase returns a user but no
    // live session yet - send them to sign in once they've confirmed
    if (data.session) {
      navigate('/catalogue', { replace: true })
    } else {
      setConfirmationSent(true)
      setSubmitting(false)
    }
  }

  return (
    <section className="scp-form-page scp-form-page--auth">
      <Link to="/" className="scp-form-page__logo-link">
        <img src={logo} alt="SCP Foundation" className="scp-form-page__logo" />
      </Link>

      {confirmationSent ? (
        <div className="scp-form">
          <p className="scp-form__kicker">Foundation Personnel</p>
          <h1 className="scp-form__title">Check Your Email</h1>
          <p className="scp-form__status">
            We've sent a confirmation link to {email}. Confirm your address, then{' '}
            <Link to="/login">sign in</Link>.
          </p>
        </div>
      ) : (
        <form className="scp-form" onSubmit={handleSubmit}>
          <p className="scp-form__kicker">Foundation Personnel</p>
          <h1 className="scp-form__title">Create Account</h1>

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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {error && <p className="scp-form__error">{error.message}</p>}

          <div className="scp-form__actions">
            <Link to="/login" className="scp-form__cancel">
              Sign In
            </Link>
            <button type="submit" className="scp-form__submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default Signup
