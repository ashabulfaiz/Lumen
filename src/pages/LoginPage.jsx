import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconFlame } from '../components/Icons.jsx'
import api from '../lib/axiosInstance';
import { persistLoginSession } from '../lib/userSession.js'
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react'; 
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
  const [showPassword, setShowPassword] = useState(false)
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
    if (!cleanEmail.trim() || !password) { setError('Email dan password wajib diisi.'); return; }
    
    try {
      const response = await api.post('/auth/login', { email: cleanEmail, password: password });
      localStorage.setItem('lumen_token', response.data.token);
      persistLoginSession(cleanEmail);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat login");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-5 font-sans selection:bg-blue-200">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] h-[600px] w-[600px] animate-pulse rounded-full bg-blue-100/60 blur-[120px] transition-all duration-1000 ease-in-out"></div>
      <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[100px]"></div>

      {/* Floating Back Button */}
      <div className="absolute left-5 top-5 z-50 lg:left-10 lg:top-10">
        <Link to="/" className="group flex items-center gap-2.5 rounded-full border border-white/60 bg-white/50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-md">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Homepage</span>
        </Link>
      </div>

      {/* MAIN UNIFIED CARD - Diperlebar menjadi max-w-[1200px] */}
      <div className="relative z-10 mt-16 flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[32px] border border-white bg-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-2xl lg:mt-0 lg:flex-row">
        
        {/* Left Side: Info Panel (Visible on Large Screens) */}
        <div className="relative hidden w-full flex-col justify-center bg-gradient-to-br from-blue-100/40 to-indigo-50/40 p-10 xl:p-14 lg:flex lg:w-5/12 border-r border-white/50">
          
          <div className="relative z-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <IconFlame className="h-8 w-8 text-blue-600" />
            </div>
            
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-5xl">
              Learn English <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Smarter.</span>
            </h1>
            
            <p className="mt-6 text-[15px] leading-relaxed text-slate-600 xl:text-base">
              Welcome back to LUMEN! Log in to continue your personalized learning journey and track your progress.
            </p>

            {/* Social Proof Area */}
            <div className="mt-12 flex items-center gap-4 rounded-2xl border border-white/50 bg-white/50 p-4 shadow-sm backdrop-blur-md">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-xs shadow-sm">
                      <IconFlame className="h-4 w-4 text-blue-300" />
                    </div>
                  ))}
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-800">10,000+ Learners</p>
                 <p className="text-xs font-medium text-slate-500">Achieving fluency daily.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Panel */}
        <div className="flex w-full flex-col justify-center bg-white/80 p-8 sm:p-12 xl:p-16 lg:w-7/12">
          
          <div className="mb-8 lg:hidden flex flex-col items-center">
             <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <IconFlame className="h-6 w-6 text-blue-600" />
             </div>
          </div>

          {/* Petanda / Indicator Badge */}
          <div className="mb-6 flex">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Secure Portal</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 xl:text-4xl">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-500 xl:text-base">Please enter your details to access your account.</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700" role="alert">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="ml-1 text-[13px] font-semibold text-slate-700" htmlFor="login-email">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  id="login-email"
                  type="email"
                  className="w-full rounded-2xl border border-slate-200 bg-white/60 py-4 pl-12 pr-4 text-[15px] text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  value={email}
                  onChange={(e) => applyEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>
              {emailError && <p className="ml-1 text-[12px] font-medium text-red-500">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[13px] font-semibold text-slate-700" htmlFor="login-password">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 bg-white/60 py-4 pl-12 pr-12 text-[15px] text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  value={password}
                  onChange={(e) => applyPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && <p className="ml-1 text-[12px] font-medium text-red-500">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={submitBlocked}
              className="group relative mt-4 overflow-hidden rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Log In securely
              </span>
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500 lg:text-left">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
              Create account
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}