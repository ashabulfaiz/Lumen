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
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  
  const [language, setLanguage] = useState('id')
  
  const listRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
  }, [messages])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, isLoading])

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleToggleSpeak = (text, index) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'id-ID';
    utterance.rate = 0.95;
    
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index);
  };

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
        body: JSON.stringify({ message: trimmed, language: language }),
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
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          
          {/* Kontainer Kiri: Judul & Toggle diatur menurun (flex-col) */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="mb-1.5 text-xl font-extrabold text-slate-900">LUMEN Assistant</h1>
              <p className="m-0 text-[13px] text-slate-600">AI Learning Assistance</p>
            </div>
            
            {/* BAGIAN TOGGLE BAHASA */}
            <div className="group relative inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 shadow-inner w-fit">
              
              {/* Tooltip */}
              <div className="absolute -right-2 top-1/2 z-10 translate-x-full -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-x-[calc(100%+6px)] group-hover:opacity-100 pointer-events-none shadow-md">
                Pilih bahasa bot
                {/* Segitiga kecil penunjuk ke kiri */}
                <div className="absolute left-0 top-1/2 -ml-1 -translate-y-1/2 border-[4px] border-transparent border-r-slate-800"></div>
              </div>

              <button
                onClick={() => setLanguage('id')}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
                  language === 'id' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
                  language === 'en' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <button
            onClick={() => { 
              window.speechSynthesis.cancel();
              setSpeakingIndex(null);
              localStorage.removeItem(STORAGE_KEY); 
              setMessages([]); 
            }}
            className="shrink-0 mt-2 sm:mt-0 cursor-pointer rounded-xl border-2 border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Clear messages
          </button>
        </header>

        {/* CHAT BOX */}
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div ref={listRef} className="flex max-h-[560px] flex-col gap-2.5 overflow-auto p-4 flex-grow bg-slate-50/30">
            {messages.length === 0 && (
              <div className="m-0 px-3 py-8 text-center flex flex-col items-center">
                <span className="text-3xl mb-3">👋</span>
                <p className="text-[14px] text-slate-600 font-medium">Hi! I'm LUMEN-bot. I'm here to help you, choose ID/EN to prefer AI language responses.</p>
              </div>
            )}
            
            {messages.map((m, idx) => {
              const isLastMessage = idx === messages.length - 1;
              const isCurrentlySpeaking = speakingIndex === idx;

              return (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group/bubble relative max-w-[85%] rounded-2xl border px-4 py-3 ${m.role === 'user' ? 'border-indigo-300 bg-indigo-100' : 'border-slate-200 bg-white'}`}>
                    <p className="m-0 text-[14px] whitespace-pre-wrap text-slate-800 leading-relaxed">{m.text}</p>
                    
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span className="block text-[11px] text-slate-400">{formatTime(new Date(m.at))}</span>
                      
                      {m.role === 'assistant' && (
                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${isLastMessage || isCurrentlySpeaking ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`}>
                          
                          <button 
                            onClick={() => handleToggleSpeak(m.text, idx)}
                            className={`group/btn flex cursor-pointer items-center transition-colors ${isCurrentlySpeaking ? 'text-red-500' : 'text-slate-400 hover:text-indigo-600'}`}
                          >
                            {isCurrentlySpeaking ? (
                              <>
                                <svg className="w-[15px] h-[15px]" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                                <span className="text-[11px] font-semibold ml-1.5">Stop</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                                <span className="max-w-0 overflow-hidden text-[11px] font-semibold transition-all duration-300 group-hover/btn:max-w-[40px] group-hover/btn:ml-1.5">Listen</span>
                              </>
                            )}
                          </button>

                          <button 
                            onClick={() => handleCopy(m.text, idx)}
                            className="group/btn flex cursor-pointer items-center transition-colors text-slate-400 hover:text-indigo-600"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <svg className="w-[15px] h-[15px] text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                <span className="text-green-500 text-[11px] font-semibold ml-1.5">Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                <span className="max-w-0 overflow-hidden text-[11px] font-semibold transition-all duration-300 group-hover/btn:max-w-[40px] group-hover/btn:ml-1.5">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
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
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-[14px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask LUMEN"
              disabled={isLoading}
            />
            <button type="submit" disabled={!value.trim() || isLoading} className="cursor-pointer rounded-xl bg-indigo-600 px-6 py-3 text-[14px] font-bold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}