import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconFlame } from '../components/Icons.jsx'
import api from '../lib/axiosInstance';
import {
  INVALID_EMAIL_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
  isPasswordLongEnough,
  isValidEmail,
  sanitizeEmailInput,
} from '../lib/validateEmail.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  function applyEmail(raw) {
    const v = sanitizeEmailInput(raw)
    setEmail(v)
    const t = v.trim()
    if (t === '') setEmailError('')
    else if (!isValidEmail(v)) setEmailError(INVALID_EMAIL_MESSAGE)
    else setEmailError('')
  }

  function applyPassword(next) {
    setPassword(next)
    if (next.length === 0) setPasswordError('')
    else if (!isPasswordLongEnough(next)) setPasswordError(PASSWORD_TOO_SHORT_MESSAGE)
    else setPasswordError('')
  }

  const submitBlocked = useMemo(() => {
    const t = email.trim()
    const emailBad = t !== '' && !isValidEmail(email)
    const passBad = password.length > 0 && !isPasswordLongEnough(password)
    return emailBad || passBad
  }, [email, password])

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanEmail = sanitizeEmailInput(email)
    setEmail(cleanEmail)
    
    if (!cleanEmail.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }
    if (!isValidEmail(cleanEmail)) {
      setEmailError(INVALID_EMAIL_MESSAGE)
      setError(INVALID_EMAIL_MESSAGE)
      return
    }
    if (!isPasswordLongEnough(password)) {
      setPasswordError(PASSWORD_TOO_SHORT_MESSAGE)
      setError(PASSWORD_TOO_SHORT_MESSAGE)
      return
    }
    
    setError('')
    setEmailError('')
    setPasswordError('')

    try {
      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password: password
      });

      const token = response.data.token;
      localStorage.setItem('lumen_token', token);

      navigate('/dashboard', { replace: true })
      
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan pada server saat login");
    }
  }

  const inputError = (hasErr) =>
    hasErr
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-blue-400 focus:ring-blue-200'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-50 px-5 py-12 font-sans">
      <Link to="/" className="mb-5 max-w-[420px] self-start text-sm text-slate-600 no-underline hover:text-blue-600 md:mx-auto md:w-full">
        ← Back to home
      </Link>

      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-8 w-8 text-blue-600" aria-hidden>
            <IconFlame />
          </span>
          <span className="text-[17px] font-bold tracking-wide text-slate-900">LUMEN</span>
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-slate-900">Log in</h1>
        <p className="mb-6 text-sm text-slate-600">Use your account to continue learning English.</p>

        <form className="flex flex-col gap-1.5" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700" role="alert">
              {error}
            </p>
          )}
          <label className="mt-2 text-[13px] font-semibold text-slate-600 first:mt-0" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-invalid={emailError ? 'true' : 'false'}
            aria-describedby={emailError ? 'login-email-hint' : undefined}
            className={`mb-1 rounded-[10px] border bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-900 outline-none focus:bg-white focus:ring-2 ${inputError(!!emailError)}`}
            value={email}
            onChange={(e) => {
              applyEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="nama@gmail.com"
          />
          {emailError ? (
            <p id="login-email-hint" className="mb-1 text-[13px] font-medium text-red-600" role="alert">
              {emailError}
            </p>
          ) : null}

          <label className="mt-2 text-[13px] font-semibold text-slate-600" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={passwordError ? 'true' : 'false'}
            aria-describedby={passwordError ? 'login-password-hint' : undefined}
            className={`mb-1 rounded-[10px] border bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-900 outline-none focus:bg-white focus:ring-2 ${inputError(!!passwordError)}`}
            value={password}
            onChange={(e) => {
              applyPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Minimal 6 karakter"
          />
          {passwordError ? (
            <p id="login-password-hint" className="mb-1 text-[13px] font-medium text-red-600" role="alert">
              {passwordError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitBlocked}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-blue-600 no-underline hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
