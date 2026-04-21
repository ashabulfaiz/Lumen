import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'lumen_help_chat'

function formatTime(d) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(d)
}

function safeJsonParse(raw, fallback) {
  try {
    const v = JSON.parse(raw)
    return v ?? fallback
  } catch {
    return fallback
  }
}

function loadChat() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = safeJsonParse(raw, null)
  if (!Array.isArray(parsed)) return null
  return parsed
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .slice(-50)
}

function saveChat(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
  } catch {
    /* ignore */
  }
}

export default function HelpPage() {
  const [messages, setMessages] = useState(() => loadChat() ?? [])
  const [value, setValue] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    saveChat(messages)
  }, [messages])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  function send(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = { role: 'user', text: trimmed, at: window.Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setValue('')
  }

  function onSubmit(e) {
    e.preventDefault()
    send(value)
  }

  function resetChat() {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([])
    setValue('')
  }

  return (
    <div className="mx-auto max-w-[1040px] font-sans">
      <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1.5 text-xl font-extrabold text-slate-900">Help chat</h1>
          <p className="m-0 text-[13px] text-slate-600">Placeholder UI — plug in your AI assistant here.</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          onClick={resetChat}
        >
          Clear messages
        </button>
      </header>

      <section
        className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        aria-label="Chat"
      >
        <div ref={listRef} className="flex max-h-[560px] flex-col gap-2.5 overflow-auto p-4">
          {messages.length === 0 && (
            <p className="m-0 px-3 py-8 text-center text-[13px] leading-relaxed text-slate-600">
              Chat messages will show here. Connect your backend / AI model to reply to users.
            </p>
          )}
          {messages.map((m, idx) => (
            <div key={`${m.role}-${m.at}-${idx}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[min(560px,92%)] rounded-2xl border px-3 py-2.5 ${
                  m.role === 'user'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="m-0 text-[13px] leading-relaxed text-slate-900">{m.text}</p>
                <span className="mt-1.5 block text-[11px] text-slate-400">{formatTime(new Date(m.at))}</span>
              </div>
            </div>
          ))}
        </div>

        <form className="flex gap-2.5 border-t border-slate-200 bg-white p-3" onSubmit={onSubmit}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your message…"
            aria-label="Message"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!value.trim()}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
