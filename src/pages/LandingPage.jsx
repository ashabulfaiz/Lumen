import { Link } from 'react-router-dom'
import { IconFlame } from '../components/Icons.jsx'

export default function LandingPage() {
  return (
    <div className="min-h-svh flex-col bg-white font-sans text-slate-600 selection:bg-indigo-200 selection:text-indigo-800 overflow-x-hidden scroll-smooth">
      
      {/* ================= 0. HEADER ================= */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 md:px-12">
          <Link to="/" className="inline-flex items-center gap-3 no-underline text-inherit group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md transition-transform group-hover:scale-105">
              <IconFlame className="w-6 h-6" />
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-800">LUMEN</span>
          </Link>
          
          {/* Menu Navigasi */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-[14px] text-slate-500">
            <a href="#about" className="hover:text-indigo-600 transition-colors">Platform</a>
            <a href="#why-lumen" className="hover:text-indigo-600 transition-colors">Why Us</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-to-use" className="hover:text-indigo-600 transition-colors">Workflow</a>
            <a href="#roleplay" className="text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> AI Lab
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block text-[15px] font-bold text-slate-600 hover:text-indigo-600 transition-colors px-3 py-2">Log in</Link>
            <Link to="/register" className="rounded-xl bg-indigo-500 px-6 py-2.5 text-[15px] font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-600 hover:-translate-y-0.5">Start Free</Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full flex flex-col">

        {/* ================= 1. WHAT IS LUMEN (Background Putih Bersih) ================= */}
        <section id="about" className="relative w-full bg-white py-16 md:py-28 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 to-transparent pointer-events-none z-0"></div>
          
          <div className="mx-auto max-w-7xl px-6 md:px-12 flex flex-col lg:flex-row items-center gap-12 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 mb-6 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest">Intelligent Learning Engine</span>
              </div>
              <h1 className="mb-6 text-5xl font-black leading-[1.15] tracking-tight text-slate-800 md:text-6xl lg:text-7xl">
                Fluent English. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
                  Gentle Learning.
                </span>
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600">
                LUMEN is a welcoming, AI-powered sanctuary for mastering English. We blend structured lessons with friendly artificial intelligence to help you communicate naturally and professionally.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-8 py-4 text-[16px] font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-600">
                  Begin Your Journey
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <div className="relative rounded-[2rem] p-2 bg-slate-100 border border-slate-200 shadow-inner">
                 <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80" alt="Students learning" className="w-full h-[400px] rounded-2xl object-cover shadow-sm" />
                 <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-800 m-0">Advanced Level</p>
                      <p className="text-[13px] text-slate-500 m-0">Module Completed!</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. WHY LUMEN (Background Soft Rose Solid) ================= */}
        <section id="why-lumen" className="w-full bg-rose-50 border-y border-rose-200 py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Why Choose LUMEN?</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">See the clear difference between frustrating traditional methods and our refreshing, supportive approach.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* The Old Way Card */}
              <div className="bg-white border border-rose-200 rounded-[2rem] p-8 shadow-md">
                <div className="text-rose-600 font-bold text-[14px] mb-6 flex items-center gap-2 bg-rose-50 w-fit px-4 py-2 rounded-xl border border-rose-100 uppercase tracking-wide">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Traditional Methods
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-600 items-center">
                    <span className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></span>
                    <p className="m-0 text-[15px]">Rigid, textbook-based memorization that feels extremely boring and outdated.</p>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-600 items-center">
                    <span className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></span>
                    <p className="m-0 text-[15px]">No immediate feedback. You never know if your grammar or pronunciation is correct.</p>
                  </div>
                </div>
              </div>

              {/* The LUMEN Way Card */}
              <div className="bg-white border border-indigo-200 rounded-[2rem] p-8 shadow-xl shadow-indigo-100/50">
                <div className="text-indigo-600 font-bold text-[14px] mb-6 flex items-center gap-2 bg-indigo-50 w-fit px-4 py-2 rounded-xl border border-indigo-100 uppercase tracking-wide">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                  The LUMEN Way
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-700 items-center">
                    <span className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
                    <p className="m-0 text-[15px] font-medium">Adaptive, soft curriculum tailored specifically for modern professional needs.</p>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-700 items-center">
                    <span className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
                    <p className="m-0 text-[15px] font-medium">24/7 friendly AI Tutor for gentle, instant corrections and personal guidance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: ADVANTAGES (Background Putih) --- */}
        <section id="benefits" className="w-full bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">The Gentle Advantage</h2>
              <p className="text-slate-600 text-lg">What you achieve when learning feels completely natural.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-[2rem] bg-cyan-50 border border-cyan-200 flex flex-col text-left hover:-translate-y-1 transition-transform shadow-sm">
                <div className="w-16 h-16 bg-white text-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-cyan-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Accelerate Career</h3>
                <p className="text-slate-600 leading-relaxed text-[15px] m-0">Mastering business English opens gentle doors to promotions, global networking, and international opportunities.</p>
              </div>

              <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-200 flex flex-col text-left hover:-translate-y-1 transition-transform shadow-sm">
                <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Flawless Confidence</h3>
                <p className="text-slate-600 leading-relaxed text-[15px] m-0">Speak and write gracefully without ever second-guessing your grammar or vocabulary choices in meetings.</p>
              </div>

              <div className="p-8 rounded-[2rem] bg-teal-50 border border-teal-200 flex flex-col text-left hover:-translate-y-1 transition-transform shadow-sm">
                <div className="w-16 h-16 bg-white text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-teal-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Save Precious Time</h3>
                <p className="text-slate-600 leading-relaxed text-[15px] m-0">Skip the irrelevant fluff. Focus strictly on high-impact language skills tailored to your daily needs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: FEATURES (Background Slate Solid) --- */}
        <section id="features" className="w-full bg-slate-100 border-y border-slate-200 py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Everything You Need</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">A seamless blend of pedagogy and soft, supportive technology.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1: Large */}
              <div className="md:col-span-2 bg-white rounded-[2rem] p-10 border border-slate-200 relative overflow-hidden flex flex-col justify-center shadow-md">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-bl-full z-0"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 border border-indigo-100">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-4">LUMEN AI Tutor</h3>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-xl m-0">Experience 1-on-1 coaching with our friendly AI. Ask for grammar corrections, refine your sentence structure, or request translations seamlessly.</p>
                </div>
              </div>

              {/* Feature 2: Small */}
              <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-md">
                <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-6 border border-cyan-100">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Visual Analytics</h3>
                <p className="text-slate-600 leading-relaxed text-[15px] m-0">Track your proficiency through elegant charts, module completion rates, and daily consistency.</p>
              </div>

              {/* Feature 3: Small */}
              <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-md">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 border border-amber-100">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Verified Certificate</h3>
                <p className="text-slate-600 leading-relaxed text-[15px] m-0">Complete milestone assessments to earn verifiable LUMEN Certificates to strengthen your CV.</p>
              </div>

              {/* Feature 4: Large */}
              <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-[2rem] p-10 border border-indigo-200 flex flex-col justify-center shadow-md">
                <div className="w-14 h-14 bg-white text-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-4">Structured Syllabus</h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-xl m-0">From foundational rules to complex conversational nuances. Our syllabus is mapped perfectly so you never have to guess what to study next.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: HOW TO USE (Background Soft Emerald Solid) --- */}
        <section id="how-to-use" className="w-full bg-emerald-50 border-b border-emerald-100 py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Your Path to Mastery</h2>
              <p className="text-slate-600 text-lg">Four simple steps to elevate your communication softly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { num: 1, title: 'Create Account', text: 'Register securely to access your bespoke dashboard.', color: 'indigo' },
                { num: 2, title: 'Select Tier', text: 'Begin at your true skill level, from Beginner to Advanced.', color: 'cyan' },
                { num: 3, title: 'Engage & Learn', text: 'Complete lessons and consult the AI Tutor freely.', color: 'purple' },
                { num: 4, title: 'Claim Certificate', text: 'Pass the final test and validate your proficiency.', color: 'emerald' },
              ].map((step, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl border border-emerald-200 flex flex-col items-center text-center shadow-md hover:-translate-y-1 transition-transform">
                  <div className={`w-14 h-14 bg-${step.color}-50 text-${step.color}-600 font-black rounded-2xl flex items-center justify-center border border-${step.color}-200 mb-6 text-xl`}>
                    {step.num}
                  </div>
                  <h3 className="font-bold text-xl text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed m-0">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 6: AI ROLEPLAY (Background Soft Purple Solid) --- */}
        <section id="roleplay" className="w-full bg-purple-50 border-b border-purple-100 py-20 overflow-hidden relative">
          <div className="mx-auto max-w-7xl px-6 md:px-12 flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 mb-6 shadow-sm">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                <span className="text-[12px] font-bold text-purple-600 uppercase tracking-widest">Simulation Lab</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">Immersive AI <br/>Roleplay.</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-xl">
                Step into our Simulation Lab to practice high-stakes scenarios. Negotiate a salary, pitch to a demanding client, or lead a boardroom meeting in a zero-risk environment with a gentle AI counterpart.
              </p>
              <Link to="/register" className="inline-flex rounded-xl bg-purple-500 text-white px-8 py-3.5 text-[15px] font-bold shadow-md shadow-purple-200 transition-all hover:-translate-y-0.5 hover:bg-purple-600 no-underline">
                Try Simulation Lab
              </Link>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="bg-white border border-purple-200 rounded-3xl p-8 shadow-xl shadow-purple-100">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-slate-700 font-bold text-[15px]">Live Scenario: Salary Negotiation</span>
                  </div>
                  <span className="text-purple-700 font-bold bg-purple-50 px-3 py-1.5 rounded-lg text-[12px] border border-purple-200 uppercase">AI Interviewer</span>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tl-sm text-slate-700 text-[14px] leading-relaxed max-w-[85%] flex gap-4 items-start shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 shrink-0"></div>
                    <p className="m-0 pt-1">"We are impressed with your portfolio, but our budget for this role is capped at $80,000. Would you be open to accepting this offer?"</p>
                  </div>
                  <div className="bg-purple-500 border border-purple-600 p-5 rounded-2xl rounded-tr-sm text-white text-[14px] leading-relaxed max-w-[85%] ml-auto shadow-md flex gap-4 items-start flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-purple-300 border border-purple-400 shrink-0"></div>
                    <p className="m-0 pt-1 text-right">"Thank you for the offer. However, considering my extensive experience and the market rate, I was expecting a figure closer to $95,000."</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                   <span className="text-slate-500 text-[15px] pl-4">Type your soft response...</span>
                   <button className="bg-purple-500 text-white p-3 rounded-xl shadow-md hover:bg-purple-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 7: ENTERPRISE (Background Soft Orange Solid) --- */}
        <section id="sales-marketing" className="w-full bg-orange-50 border-b border-orange-100 py-20 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 relative z-10">
            <div className="flex-1 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80"
                alt="Executive Boardroom"
                className="w-full h-[400px] object-cover rounded-[2.5rem] border border-white shadow-xl shadow-orange-200/60"
              />
            </div>
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 mb-6 shadow-sm">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span className="text-[12px] font-bold text-orange-600 uppercase tracking-widest">Enterprise Track</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-[1.15] mb-6">
                Specialized in <br/><span className="text-orange-500">Sales & Marketing.</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-lg">
                Your communication is your greatest asset. Our Enterprise module is engineered to help professionals close deals, write high-converting pitches, and command boardrooms with soft yet absolute authority.
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="flex items-center gap-5 bg-white p-4 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="m-0 font-bold text-slate-800 text-[16px]">Persuasive Product Pitching</p>
                </div>
                <div className="flex items-center gap-5 bg-white p-4 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="m-0 font-bold text-slate-800 text-[16px]">Drafting Executive Emails</p>
                </div>
              </div>

              <Link to="/register" className="inline-block bg-orange-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200 text-[16px]">
                Unlock Enterprise Modules
              </Link>
            </div>
          </div>
        </section>

        {/* --- SECTION 8: FEEDBACK (Background Putih) --- */}
        <section id="feedback" className="w-full bg-white py-24 border-b border-slate-200">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Shape the Future of LUMEN</h2>
            <p className="text-slate-600 mb-12 text-lg">We build for you. Have a brilliant feature request? Let us know in the gentlest way possible.</p>
            
            <form className="bg-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 text-left shadow-md" onSubmit={(e) => e.preventDefault()}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">Your Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-indigo-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <input type="text" placeholder="John Doe" className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white shadow-sm text-[15px]" />
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-3">Your Insight</label>
                <textarea rows="4" placeholder="I think LUMEN would be even better if..." className="w-full px-5 py-4 rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none bg-white shadow-sm text-[15px]"></textarea>
              </div>
              <button className="w-full bg-indigo-500 text-white font-bold py-4 rounded-2xl hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 text-[16px]">
                Submit Insight
              </button>
            </form>
          </div>
        </section>

        {/* --- SECTION 9: CONTACT & FOOTER (Background Soft Slate) --- */}
        <footer id="contact" className="w-full bg-slate-100 pt-20 pb-12">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-16 mb-12">
              
              {/* Brand */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-500 border border-slate-200 shadow-sm">
                    <IconFlame className="w-8 h-8" />
                  </span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight">LUMEN</span>
                </div>
                <p className="text-slate-600 text-[16px] max-w-sm leading-relaxed">
                  The premier EdTech platform bridging the gap between basic English and soft, elegant professional fluency.
                </p>
              </div>

              {/* Contact Person */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
                <h3 className="text-slate-800 text-xl font-bold mb-6">Contact & Inquiries</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-[16px] m-0">Ziddan Azzahra</p>
                      <p className="text-[14px] text-slate-600 m-0 mt-0.5">Lead Developer & Visionary</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-[16px] m-0">Headquarters</p>
                      <p className="text-[14px] text-slate-600 m-0 mt-0.5">Jakarta Global University, Depok</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-300 pt-8 text-[14px] text-slate-500">
              <p className="m-0 font-medium">© {new Date().getFullYear()} LUMEN Capstone Project. All rights reserved.</p>
              <div className="flex gap-8 font-medium">
                <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}