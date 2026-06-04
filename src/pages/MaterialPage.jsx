import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/axiosInstance'
import { BookOpen, ArrowRight, PenTool, CheckCircle2 } from 'lucide-react'

export default function MaterialPage() {
  const { level, lessonId } = useParams()
  const navigate = useNavigate()
  
  const [lessonData, setLessonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await api.get(`/learning/lesson-detail/${lessonId}`)
        setLessonData(response.data.data)
      } catch (err) {
        console.error("Failed to fetch lesson material:", err)
        setError("Failed to load reading material.")
      } finally {
        setLoading(false)
      }
    }
    fetchMaterial()
  }, [lessonId])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 font-sans">
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-slate-100 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (error || !lessonData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 font-sans">
        <div className="rounded-3xl border-2 border-red-100 bg-red-50 p-8 text-center text-red-600">
          <p>{error || "Material not found"}</p>
          <button onClick={() => navigate(`/learning/${level}`)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-100 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-200">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Curriculum
          </button>
        </div>
      </div>
    )
  }

  let richContent = null
  let isRichJSON = false

  try {
    const parsed = JSON.parse(lessonData.konten_teks)
    if (Array.isArray(parsed)) {
      richContent = parsed
      isRichJSON = true
    }
  } catch {
    // Not valid JSON array, treat as plain text
    isRichJSON = false
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 font-sans">
      
      {/* Header */}
      <header className="mb-8 rounded-3xl border-2 border-indigo-100 bg-indigo-50/50 p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Reading Material
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {lessonData.judul_lesson}
        </h1>
        <p className="text-slate-600">
          Read the material below to prepare for your Quiz and Writing Practice.
        </p>
      </header>

      {/* Content */}
      <div className="space-y-8 mb-12">
        {isRichJSON && richContent ? (
          richContent.map((section, idx) => (
            <section key={idx} className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">
                {section.sub_topic_title || `Part ${idx + 1}`}
              </h2>
              
              {section.objective && (
                <div className="mb-6 rounded-2xl bg-indigo-50/50 p-5 border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-800 mb-2">Objective</h3>
                  <p className="text-slate-700 leading-relaxed text-sm">{section.objective}</p>
                </div>
              )}

              {section.vocabulary && section.vocabulary.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Key Vocabulary</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {section.vocabulary.map((vocab, vIdx) => (
                      <div key={vIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-bold text-indigo-600">{vocab.term}</p>
                        <p className="text-sm text-slate-600 mt-1">{vocab.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.concept && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Concept</h3>
                  <p className="text-slate-700 leading-relaxed text-[15px]">{section.concept}</p>
                </div>
              )}

              {section.example_dialogue && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Example Dialogue</h3>
                  <div className="rounded-2xl bg-slate-800 p-5 text-slate-200 font-mono text-sm leading-relaxed overflow-x-auto">
                    {section.example_dialogue.split('\n').map((line, lIdx) => (
                      <span key={lIdx}>{line}<br/></span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div 
              className="prose prose-slate max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: lessonData.konten_teks }}
            />
          </div>
        )}
      </div>

      {/* Call to Actions */}
      <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to test your knowledge?</h2>
        <p className="text-slate-600 mb-6">You must complete both the Quiz and Writing Practice to unlock the next module.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/learning/${level}/lesson/${lessonId}`}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <CheckCircle2 className="h-5 w-5" />
            Take Quiz
          </Link>
          <Link
            to={`/learning/${level}/lesson/${lessonId}/writing`}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            <PenTool className="h-5 w-5" />
            Writing Practice
          </Link>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link to={`/learning/${level}`} className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Curriculum
          </Link>
        </div>
      </div>
      
    </div>
  )
}
