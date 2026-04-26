import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'lumen_help_chat'

function formatTime(d) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(d)
}

function loadChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export default function HelpPage() {
  const [messages, setMessages] = useState(loadChat)
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
  }, [messages])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, isLoading])

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages(prev => [...prev, { role: 'user', text: trimmed, at: Date.now() }])
    setValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await response.json()
      
      setTimeout(() => { 
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply || data.error, at: Date.now() }])
        setIsLoading(false)
      }, 800)
      
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Maaf, server AI sedang offline.", at: Date.now() }])
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1040px] font-sans">
      <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1.5 text-xl font-extrabold text-slate-900">LUMEN Assistant</h1>
          <p className="m-0 text-[13px] text-slate-600">Your offline AI English Tutor</p>
        </div>
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setMessages([]); }}
          className="shrink-0 rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          Clear messages
        </button>
      </header>

      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div ref={listRef} className="flex max-h-[560px] flex-col gap-2.5 overflow-auto p-4 flex-grow bg-slate-50/30">
          {messages.length === 0 && (
            <div className="m-0 px-3 py-8 text-center flex flex-col items-center">
               <span className="text-3xl mb-3">👋</span>
               <p className="text-[14px] text-slate-600 font-medium">Hi! I'm LUMEN-bot. Try saying "Halo" or asking about "Grammar".</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl border px-4 py-3 ${m.role === 'user' ? 'border-blue-300 bg-blue-100' : 'border-slate-200 bg-white'}`}>
                <p className="m-0 text-[14px] whitespace-pre-wrap text-slate-800">{m.text}</p>
                <span className="mt-1.5 block text-[11px] text-slate-400">{formatTime(new Date(m.at))}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                LUMEN-bot is typing...
              </div>
            </div>
          )}
        </div>

        <form className="flex gap-2.5 border-t border-slate-200 bg-white p-4" onSubmit={e => { e.preventDefault(); send(value); }}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={!value.trim() || isLoading} className="rounded-xl bg-blue-600 px-6 py-3 text-[14px] font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
            Send
          </button>
        </form>
      </section>
    </div>
  )
}