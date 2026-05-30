import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, CheckCircle, Download, Lock, X } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../lib/axiosInstance'
import { useUser } from '../lib/useUser'

export default function CertificatePage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [claimedCertificates, setClaimedCertificates] = useState([])
  const [levelProgress, setLevelProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeCert, setActiveCert] = useState(null)

  const levels = [
    { id: 1, slug: 'beginner', title: 'Beginner' },
    { id: 2, slug: 'intermediate', title: 'Intermediate' },
    { id: 3, slug: 'advanced', title: 'Advanced' }
  ]

  const fetchCertificatesAndProgress = async () => {
    setLoading(true)
    try {
      const certRes = await api.get('/certificates')
      setClaimedCertificates(certRes.data.data || [])

      const progressData = {}
      for (const lvl of levels) {
        try {
          const courseRes = await api.get(`/learning/courses/${lvl.id}`)
          const courses = courseRes.data.data || []
          
          if (courses.length === 0) {
            progressData[lvl.id] = { completed: 0, total: 0, percentage: 0, isEligible: false }
            continue
          }

          let totalLessons = 0
          let completedLessonsCount = 0

          const completedRes = await api.get(`/progress/completed/${lvl.id}`)
          const completedLessonIds = completedRes.data.data || []

          for (const course of courses) {
            const lessonRes = await api.get(`/learning/lessons/${course.id}`)
            const lessons = lessonRes.data.data || []
            totalLessons += lessons.length
            lessons.forEach(l => {
              if (completedLessonIds.includes(l.id)) {
                completedLessonsCount++
              }
            })
          }

          const percentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0
          const isEligible = totalLessons > 0 && completedLessonsCount >= totalLessons

          progressData[lvl.id] = {
            completed: completedLessonsCount,
            total: totalLessons,
            percentage,
            isEligible
          }
        } catch (err) {
          console.error(`Failed to load level progress ${lvl.title}:`, err)
          progressData[lvl.id] = { completed: 0, total: 0, percentage: 0, isEligible: false }
        }
      }
      setLevelProgress(progressData)
    } catch (error) {
      console.error('Failed to retrieve certificate data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificatesAndProgress()
  }, [])

  const handleClaimCertificate = async (levelId, levelTitle) => {
    try {
      Swal.fire({
        title: 'Preparing Certificate...',
        text: 'Please wait a moment.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      await api.post('/certificates/claim', { level_id: levelId })
      
      Swal.fire({
        icon: 'success',
        title: 'Congratulations!',
        text: `Certificate for level ${levelTitle} has been successfully claimed.`,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Great!'
      })

      fetchCertificatesAndProgress()
    } catch (error) {
      console.error('Failed to claim certificate:', error)
      const errMsg = error.response?.data?.message || 'Failed to issue certificate. Please ensure you have passed all quizzes with a score of >= 70.'
      Swal.fire({
        icon: 'error',
        title: 'Claim Failed',
        text: errMsg,
        confirmButtonColor: '#ef4444'
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('certificate-modal-content')
    if (!element) return

    const originalZoom = element.style.zoom
    element.style.zoom = '1'

    Swal.fire({
      title: 'Preparing PDF...',
      text: 'Please wait, your certificate is being downloaded.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    try {
      const html2pdf = (await importtml('html2pdf.js')).default
      const opt = {
        margin:       0,
        filename:     `Certificate_${activeCert.levelTitle}_${user?.name || 'Lumen'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1122,
          windowHeight: 794
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }

      await html2pdf().set(opt).from(element).save()
      Swal.close()
    } catch (error) {
      console.error('Failed to create PDF:', error)
      Swal.close()
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'An error occurred while exporting the PDF. Please contact the administrator or try printing manually.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      element.style.zoom = originalZoom
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[880px] pb-12 pt-2 font-sans">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-amber-200 opacity-60 duration-1000"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-inner">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          </div>
          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Verifying credentials...</h2>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-slate-500">
            Checking our secure database for your official LUMEN certificates.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[880px] pb-12 pt-2 font-sans space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8 space-y-6">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
          
          .font-cinzel {
            font-family: 'Cinzel', Georgia, serif;
          }
          .font-montserrat {
            font-family: 'Montserrat', sans-serif;
          }
          .font-playfair {
            font-family: 'Playfair Display', Georgia, serif;
          }

          /* Style untuk preview sertifikat normal di modal (agar pas di layar screen) */
          #certificate-modal-content {
            zoom: 0.72;
            margin: 0 auto;
          }

          @media (max-width: 1024px) {
            #certificate-modal-content {
              zoom: 0.60;
            }
          }

          @media (max-width: 768px) {
            #certificate-modal-content {
              zoom: 0.45;
            }
          }

          @media (max-width: 480px) {
            #certificate-modal-content {
              zoom: 0.30;
            }
          }

          @media print {
            #certificate-modal-content {
              zoom: 1 !important;
            }
            body * {
              visibility: hidden;
            }
            #certificate-modal-content, #certificate-modal-content * {
              visibility: visible;
            }
            #certificate-modal-content {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              padding: 60px !important;
              border: none !important;
              box-shadow: none !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              background: #FAF9F5 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* HEADER (Sama seperti LearningPage & ProgressPage) */}
        <header className="mb-6 px-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">General English</p>
          <h1 className="mb-3 text-[clamp(1.5rem,3vw,1.875rem)] font-bold tracking-tight text-slate-900">
            Certifications
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-slate-600">
            Claim your official certificate after successfully completing all learning modules and quizzes for each level.
          </p>
        </header>

        {/* LIST KARTU SERTIFIKAT (Sederhana & Konsisten seperti ProgressPage) */}
        <div className="flex flex-col gap-4">
          {levels.map((lvl) => {
            const claimed = claimedCertificates.find(c => c.nama_level.toLowerCase() === lvl.slug)
            const prog = levelProgress[lvl.id] || { completed: 0, total: 0, percentage: 0, isEligible: false }
            
            return (
              <section 
                key={lvl.id} 
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Header Kartu */}
                <div className="border-b border-slate-100 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[18px] font-bold text-slate-900">{lvl.title} Level Certificate</h2>
                    
                    {/* Status Badge */}
                    {claimed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[12px] font-semibold text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" /> Claimed
                      </span>
                    ) : prog.total === 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-500">
                        Coming Soon
                      </span>
                    ) : prog.isEligible ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[12px] font-semibold text-indigo-700">
                        Ready to Claim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-500">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Official English proficiency certificate for {lvl.title} level from LUMEN Academy.
                  </p>
                </div>

                {/* Detail & Action Area (Seragam seperti di ProgressPage) */}
                <div className="bg-slate-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Bagian Progres / Keterangan */}
                  <div className="flex-1 min-w-0">
                    {claimed ? (
                      <div className="text-sm font-semibold text-slate-700">
                        Certificate issued: <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 ml-1">{claimed.certificate_code}</span>
                      </div>
                    ) : prog.total === 0 ? (
                      <span className="text-sm text-slate-500 font-medium">Curriculum materials for this level are currently being prepared.</span>
                    ) : (
                      <div className="space-y-1.5 max-w-xs">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Module Progress:</span>
                          <span>{prog.completed} / {prog.total} ({prog.percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div 
                            className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${prog.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bagian Tombol Aksi */}
                  <div className="flex items-center gap-2 shrink-0">
                    {claimed ? (
                      <button
                        type="button"
                        className="cursor-pointer rounded-[10px] border border-indigo-200 bg-indigo-50 px-4 py-2 text-[13px] font-bold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 active:translate-y-px"
                        onClick={() => setActiveCert({ ...claimed, levelTitle: lvl.title })}
                      >
                        View Certificate
                      </button>
                    ) : prog.total === 0 ? (
                      <button
                        disabled
                        className="rounded-[10px] border border-slate-200 bg-slate-100 px-4 py-2 text-[13px] font-bold text-slate-400 cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </button>
                    ) : prog.isEligible ? (
                      <button
                        type="button"
                        className="cursor-pointer rounded-[10px] border border-indigo-600 bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-indigo-700 active:translate-y-px"
                        onClick={() => handleClaimCertificate(lvl.id, lvl.title)}
                      >
                        Claim Certificate
                      </button>
                    ) : (
                      <button
                        disabled
                        className="rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-bold text-slate-400 cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </button>
                    )}
                  </div>

                </div>
              </section>
            )
          })}
        </div>

        {/* BACK TO DASHBOARD */}
        <p className="mt-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex cursor-pointer rounded-xl border-2 border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            Back to dashboard
          </button>
        </p>

        {/* MODAL PREVIEW SERTIFIKAT */}
        {activeCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto">
              {/* Close Button */}
              <button
                type="button"
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                onClick={() => setActiveCert(null)}
              >
                <X className="h-6 w-6" />
              </button>

              {/* Header Modal */}
              <div className="text-left border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-950">Completion Certificate</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Official completion certificate for level <strong>{activeCert.levelTitle}</strong>.
                </p>
              </div>

              {/* Sertifikat Printable */}
              <div className="border border-slate-200 rounded-xl bg-slate-100 p-4 overflow-x-auto flex justify-center">
                <div 
                  id="certificate-modal-content"
                  className="w-[1122px] h-[794px] relative bg-[#FAF9F5] p-20 shadow-inner flex flex-col justify-between shrink-0 select-none overflow-hidden"
                >
                  {/* L-shaped dark navy accent block - Top Left */}
                  <div className="absolute left-[42px] top-[42px] w-[266px] h-[26px] bg-[#0c2b5c] pointer-events-none" />
                  <div className="absolute left-[42px] top-[42px] w-[26px] h-[200px] bg-[#0c2b5c] pointer-events-none" />

                  {/* L-shaped dark navy accent block - Bottom Right */}
                  <div className="absolute right-[42px] bottom-[42px] w-[266px] h-[26px] bg-[#0c2b5c] pointer-events-none" />
                  <div className="absolute right-[42px] bottom-[42px] w-[26px] h-[200px] bg-[#0c2b5c] pointer-events-none" />

                  {/* Golden Border Frame */}
                  <div className="absolute left-[64px] top-[64px] right-[64px] bottom-[64px] border-[3.5px] border-[#f0a93d] pointer-events-none" />

                  {/* Thin navy line ornament with corner curves - Top Left */}
                  <svg className="absolute top-[80px] left-[80px] pointer-events-none" width="320" height="266" viewBox="0 0 240 200" fill="none">
                    <path d="M 12 170 L 12 12 L 220 12" stroke="#0c2b5c" stroke-width="1.2" />
                    <path d="M 12 42 A 30 30 0 0 0 42 12" stroke="#0c2b5c" stroke-width="1.2" />
                    
                    <circle cx="12" cy="170" r="2.5" stroke="#0c2b5c" stroke-width="1.2" fill="#FAF9F5"/>
                    <circle cx="220" cy="12" r="2.5" stroke="#0c2b5c" stroke-width="1.2" fill="#FAF9F5"/>
                    
                    <circle cx="60" cy="12" r="1.5" fill="#0c2b5c" />
                    <circle cx="70" cy="12" r="1.5" fill="#f0a93d" />
                    <circle cx="80" cy="12" r="1.5" fill="#0c2b5c" />
                    <circle cx="90" cy="12" r="1.5" fill="#f0a93d" />
                    <circle cx="100" cy="12" r="1.5" fill="#0c2b5c" />
                    
                    <circle cx="160" cy="12" r="1.5" fill="#0c2b5c" />
                    <circle cx="170" cy="12" r="1.5" fill="#f0a93d" />
                    <circle cx="180" cy="12" r="1.5" fill="#0c2b5c" />
                    <circle cx="190" cy="12" r="1.5" fill="#f0a93d" />
                    <circle cx="200" cy="12" r="1.5" fill="#0c2b5c" />

                    <circle cx="12" cy="60" r="1.5" fill="#0c2b5c" />
                    <circle cx="12" cy="70" r="1.5" fill="#f0a93d" />
                    <circle cx="12" cy="80" r="1.5" fill="#0c2b5c" />
                    <circle cx="12" cy="90" r="1.5" fill="#f0a93d" />
                    <circle cx="12" cy="100" r="1.5" fill="#0c2b5c" />
                    
                    <circle cx="12" cy="120" r="1.5" fill="#0c2b5c" />
                    <circle cx="12" cy="130" r="1.5" fill="#f0a93d" />
                    <circle cx="12" cy="140" r="1.5" fill="#0c2b5c" />
                    <circle cx="12" cy="150" r="1.5" fill="#f0a93d" />
                    <circle cx="12" cy="160" r="1.5" fill="#0c2b5c" />
                  </svg>

                  {/* Thin navy line ornament with corner curves - Bottom Right */}
                  <svg className="absolute bottom-[80px] right-[80px] pointer-events-none" width="320" height="266" viewBox="0 0 240 200" fill="none">
                    <path d="M 20 188 L 228 188 L 228 30" stroke="#0c2b5c" stroke-width="1.2" />
                    <path d="M 228 158 A 30 30 0 0 0 198 188" stroke="#0c2b5c" stroke-width="1.2" />
                    
                    <circle cx="20" cy="188" r="2.5" stroke="#0c2b5c" stroke-width="1.2" fill="#FAF9F5"/>
                    <circle cx="228" cy="30" r="2.5" stroke="#0c2b5c" stroke-width="1.2" fill="#FAF9F5"/>
                    
                    <circle cx="180" cy="188" r="1.5" fill="#0c2b5c" />
                    <circle cx="170" cy="188" r="1.5" fill="#f0a93d" />
                    <circle cx="160" cy="188" r="1.5" fill="#0c2b5c" />
                    <circle cx="150" cy="188" r="1.5" fill="#f0a93d" />
                    <circle cx="140" cy="188" r="1.5" fill="#0c2b5c" />
                    
                    <circle cx="80" cy="188" r="1.5" fill="#0c2b5c" />
                    <circle cx="70" cy="188" r="1.5" fill="#f0a93d" />
                    <circle cx="60" cy="188" r="1.5" fill="#0c2b5c" />
                    <circle cx="50" cy="188" r="1.5" fill="#f0a93d" />
                    <circle cx="40" cy="188" r="1.5" fill="#0c2b5c" />

                    <circle cx="228" cy="140" r="1.5" fill="#0c2b5c" />
                    <circle cx="228" cy="130" r="1.5" fill="#f0a93d" />
                    <circle cx="228" cy="120" r="1.5" fill="#0c2b5c" />
                    <circle cx="228" cy="110" r="1.5" fill="#f0a93d" />
                    <circle cx="228" cy="100" r="1.5" fill="#0c2b5c" />
                    
                    <circle cx="228" cy="80" r="1.5" fill="#0c2b5c" />
                    <circle cx="228" cy="70" r="1.5" fill="#f0a93d" />
                    <circle cx="228" cy="60" r="1.5" fill="#0c2b5c" />
                    <circle cx="228" cy="50" r="1.5" fill="#f0a93d" />
                    <circle cx="228" cy="40" r="1.5" fill="#0c2b5c" />
                  </svg>

                  {/* Certificate Header */}
                  <div className="text-center mt-8 z-10">
                    <h1 className="text-[56px] font-bold tracking-[0.2em] text-[#0c2b5c] font-cinzel leading-none">
                      COMPLETION CERTIFICATE
                    </h1>
                    <p className="text-[14px] font-bold tracking-[0.25em] text-[#7c7c7c] font-montserrat mt-6">
                      AWARDED TO:
                    </p>
                  </div>

                  {/* Recipient Name */}
                  <div className="text-center my-8 z-10">
                    <h2 className="text-[50px] font-bold text-[#0c2b5c] font-playfair tracking-wide leading-none py-1 select-all capitalize">
                      {user?.name || 'Student Name'}
                    </h2>
                  </div>

                  {/* Course Completion Details */}
                  <div className="text-center max-w-[770px] mx-auto space-y-2 z-10">
                    <p className="text-[#5c5c5c] text-[17px] font-medium leading-relaxed font-montserrat">
                      In recognition of their successful completion of the {activeCert.levelTitle} level English learning program
                    </p>
                    <p className="text-[#0c2b5c] text-[21px] font-bold tracking-[0.1em] font-montserrat">
                      {activeCert.levelTitle.toUpperCase()} LEVEL
                    </p>
                    <p className="text-[#5c5c5c] text-[16.5px] font-medium font-montserrat">
                      on {new Date(activeCert.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} at LUMEN Academy.
                    </p>
                  </div>

                  {/* Code Footer */}
                  <div className="flex justify-center items-center border-t border-[#e2e0d8] pt-8 z-10">
                    <div className="text-center flex flex-col items-center">
                      <p className="text-[10px] font-bold text-[#9c9c9c] font-montserrat tracking-[0.2em] uppercase leading-none">
                        VERIFICATION CODE
                      </p>
                      <p className="text-[15px] font-bold text-[#0c2b5c] font-mono mt-2 select-all leading-none">
                        {activeCert.certificate_code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full sm:w-auto cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setActiveCert(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4" /> Print / Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
