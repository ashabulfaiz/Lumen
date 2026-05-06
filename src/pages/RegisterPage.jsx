import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconFlame } from '../components/Icons.jsx'
import api from '../lib/axiosInstance';
import { persistRegisterSession } from '../lib/userSession.js'
import { 
  User, 
  Mail, 
  Lock, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
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

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  
  // State untuk visibilitas password
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')

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
    
    // Validasi panjang password
    if (next.length === 0) setPasswordError('')
    else if (!isPasswordLongEnough(next)) setPasswordError(PASSWORD_TOO_SHORT_MESSAGE)
    else setPasswordError('')

    // Cek real-time jika confirm password sudah diisi dan password utamanya berubah
    if (confirm.length > 0) {
      if (next !== confirm) setConfirmError('Password tidak cocok')
      else setConfirmError('')
    }
  }

  function handleConfirmChange(val) {
    setConfirm(val)
    // Validasi real-time untuk kecocokan password
    if (val.length > 0 && val !== password) {
      setConfirmError('Password tidak cocok')
    } else {
      setConfirmError('')
    }
  }

  const submitBlocked = useMemo(() => {
    const t = email.trim()
    const emailBad = t !== '' && !isValidEmail(email)
    const passBad = password.length > 0 && !isPasswordLongEnough(password)
    const confirmBad = confirm.length > 0 && confirm !== password
    return emailBad || passBad || confirmBad
  }, [email, password, confirm])

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanEmail = sanitizeEmailInput(email)
    if (!name.trim() || !cleanEmail.trim() || !password) { setError('Nama, email, dan password wajib diisi.'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok.'); return; }

    try {
      await api.post('/auth/register', { nama_lengkap: name, email: cleanEmail, password: password, current_level: "Beginner" });
      persistRegisterSession(name, cleanEmail)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan pada server saat registrasi.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-5 font-sans selection:bg-blue-200">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[10%] left-[-5%] h-[500px] w-[500px] animate-pulse rounded-full bg-blue-100/50 blur-[120px] transition-all duration-1000 ease-in-out"></div>
      <div className="absolute bottom-[-5%] right-[-5%] h-[600px] w-[600px] rounded-full bg-indigo-100/40 blur-[120px]"></div>

      {/* Floating Back Button */}
      <div className="absolute left-5 top-5 z-50 lg:left-10 lg:top-10">
        <Link to="/" className="group flex items-center gap-2.5 rounded-full border border-white/60 bg-white/50 px-5 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-md">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Homepage</span>
        </Link>
      </div>

      {/* MAIN UNIFIED CARD */}
      <div className="relative z-10 mt-12 flex w-full max-w-[1200px] min-h-[580px] flex-col overflow-hidden rounded-[32px] border border-white bg-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-2xl lg:mt-0 lg:flex-row">
        
        {/* Left Side: Info Panel */}
        <div className="relative hidden w-full flex-col justify-center bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-10 lg:flex lg:w-5/12 border-r border-white/50">
          <div className="relative z-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <IconFlame className="h-7 w-7 text-blue-600" />
            </div>
            
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-5xl">
              Start Your <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Mastery.</span>
            </h1>
            
            <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
              Join LUMEN today to build your English skills from the ground up and achieve fluency.
            </p>

            <div className="mt-8 flex flex-col gap-3.5">
               <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/40 p-3.5 shadow-sm backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span className="text-[13px] font-bold text-slate-700">Personalized Learning Paths</span>
               </div>
               <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/40 p-3.5 shadow-sm backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span className="text-[13px] font-bold text-slate-700">AI-Driven Assessments</span>
               </div>
               <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/40 p-3.5 shadow-sm backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span className="text-[13px] font-bold text-slate-700">Progress Tracking Dashboard</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form Panel */}
        <div className="flex w-full flex-col justify-center bg-white/80 p-8 sm:p-10 lg:p-12 lg:w-7/12">

          <div className="mb-6 lg:hidden flex flex-col items-center">
             <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <IconFlame className="h-6 w-6 text-blue-600" />
             </div>
          </div>
            
          <div className="mb-5 flex">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">New Registration</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Account</h2>
            <p className="mt-1.5 text-sm text-slate-500">Sign up below to start your learning adventure.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700" role="alert">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="ml-1 text-[13px] font-semibold text-slate-700">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white/60 py-3.5 pl-12 pr-4 text-[15px] text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[13px] font-semibold text-slate-700">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-white/60 py-3.5 pl-12 pr-4 text-[15px] text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  value={email}
                  onChange={(e) => applyEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>
              {emailError && <p className="ml-1 text-[12px] font-medium text-red-500">{emailError}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="ml-1 text-[13px] font-semibold text-slate-700">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 py-3.5 pl-10 pr-10 text-[15px] text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                    value={password}
                    onChange={(e) => applyPassword(e.target.value)}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="ml-1 text-[12px] font-medium text-red-500">{passwordError}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[13px] font-semibold text-slate-700">Confirm</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 py-3.5 pl-10 pr-10 text-[15px] text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                    value={confirm}
                    onChange={(e) => handleConfirmChange(e.target.value)}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmError && <p className="ml-1 text-[12px] font-medium text-red-500">{confirmError}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitBlocked}
              className="group relative mt-2 overflow-hidden rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Create My Account
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-slate-500 lg:text-left">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}