import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useChat } from '../hooks/useChat'
import AppointmentPicker from './AppointmentPicker'
import { useToast, ToastContainer } from './Toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PLACEHOLDER_PHRASES = [
  'Ask about availability…',
  'Tell Kyra your symptoms…',
  'Schedule an appointment…',
]

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCyclingPlaceholder() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PLACEHOLDER_PHRASES.length), 3000)
    return () => clearInterval(t)
  }, [])
  return PLACEHOLDER_PHRASES[idx]
}

function useBreakpoint() {
  const getBreakpoint = () => {
    const w = window.innerWidth
    if (w < 768) return 'mobile'
    if (w <= 1100) return 'tablet'
    return 'desktop'
  }
  const [bp, setBp] = useState(getBreakpoint)
  useEffect(() => {
    const handler = () => setBp(getBreakpoint())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return bp
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KyraAvatar({ isTyping = false }) {
  return (
    <motion.div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
        isTyping ? 'avatar-pulse-ring' : ''
      }`}
      animate={isTyping ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={
        isTyping
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.2 }
      }
      style={{
        background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
        color: 'white',
        willChange: 'transform',
      }}
    >
      K
    </motion.div>
  )
}

function MessageBubble({ msg }) {
  const isKyra = msg.role === 'kyra'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isKyra ? 'justify-start' : 'justify-end'}`}
    >
      {isKyra && <KyraAvatar isTyping={false} />}
      <div
        className={`max-w-[75%] sm:max-w-sm px-4 py-3 text-sm leading-relaxed text-white ${
          isKyra ? 'kyra-bubble' : 'patient-bubble'
        }`}
        style={
          isKyra
            ? {
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px 18px 18px 4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                willChange: 'transform',
              }
            : {
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                borderRadius: '18px 18px 4px 18px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                willChange: 'transform',
              }
        }
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        {msg.content}
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2 justify-start"
    >
      <KyraAvatar isTyping={true} />
      <div
        className="flex items-center gap-1.5 px-4 py-3"
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '18px 18px 18px 4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.4)' }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function ConfirmationBanner({ booking }) {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#3B82F6', '#06B6D4', '#7C3AED', '#ffffff'],
    })
  }, [])

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(59,130,246,0.1))',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 0 30px rgba(6,182,212,0.1)',
      }}
    >
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, type: 'spring' }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(6,182,212,0.15)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06B6D4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
          }}
        >
          ✓
        </motion.div>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#F8FAFC' }}>
            Appointment Confirmed
          </div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            {booking.doctor} &nbsp;·&nbsp; {booking.date} at {booking.time}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Shared appointment panel content (header + body)
// Rendered inside both the desktop/tablet card and the mobile drawer
// ---------------------------------------------------------------------------

function AptPanelContent({ sessionId, confirmedBooking, onBookingConfirmed }) {
  return (
    <>
      {/* Panel header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="#94A3B8" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '14px' }}>
            Available Appointments
          </span>
        </div>
        {!confirmedBooking && (
          <div
            className="ready-badge-pulse"
            style={{
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid #3B82F6',
              color: '#60A5FA',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            Ready
          </div>
        )}
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {confirmedBooking ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ padding: '20px', flex: 1 }}
            >
              <ConfirmationBanner booking={confirmedBooking} />
            </motion.div>
          ) : (
            <AppointmentPicker
              key="picker"
              sessionId={sessionId}
              onBookingConfirmed={onBookingConfirmed}
              embedded={true}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const PANEL_STYLE = {
  background: 'rgba(17,24,39,0.8)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(59,130,246,0.15)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  borderRadius: '24px',
}

export default function ChatInterface() {
  const { messages, sendMessage, isTyping, sessionId, intakeComplete, patientPhone } = useChat()
  const { toasts, show: showToast } = useToast()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [input, setInput] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callingInProgress, setCallingInProgress] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const [showCallEndedCard, setShowCallEndedCard] = useState(false)
  const [sendHovered, setSendHovered] = useState(false)
  const [callBtnHovered, setCallBtnHovered] = useState(false)
  const [showRipple, setShowRipple] = useState(false)
  const [showCheckingBanner, setShowCheckingBanner] = useState(false)
  const prevIntakeRef = useRef(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const pollRef = useRef(null)
  const pollTimeoutRef = useRef(null)

  const cycledText = useCyclingPlaceholder()
  const placeholderText = confirmedBooking
    ? 'Your appointment is confirmed! Any questions?'
    : cycledText

  const chatHeight = 'min(90vh, 780px)'
  const canSend = !isTyping && !!input.trim()

  // Container maxWidth: expands when split view activates (non-mobile only)
  const containerMaxWidth =
    !intakeComplete || isMobile
      ? '700px'
      : bp === 'tablet'
      ? '900px'
      : '1200px'

  // Trigger ripple when intake completes
  useEffect(() => {
    if (intakeComplete && !prevIntakeRef.current) {
      setShowRipple(true)
      const t = setTimeout(() => setShowRipple(false), 700)
      return () => clearTimeout(t)
    }
    prevIntakeRef.current = intakeComplete
  }, [intakeComplete])

  // Stop all voice polling and clear the 5-minute timeout
  const stopVoicePolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null }
  }

  // Start polling /api/voice/call-status every 5s.
  // Polling is independent of overlay visibility — it runs until booking_complete
  // or the 5-minute timeout fires.
  const startVoicePolling = () => {
    stopVoicePolling() // clear any previous poll before starting a new one
    console.log('[polling] Using session ID:', sessionId)

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/voice/call-status/${sessionId}`)
        const data = await res.json()
        if (data.booking_complete) {
          stopVoicePolling()
          setShowCheckingBanner(false)
          setCallActive(false)
          setConfirmedBooking(data.booking)
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#3B82F6', '#06B6D4', '#7C3AED', '#ffffff'],
          })
        }
      } catch {
        // ignore transient polling errors
      }
    }, 5000)

    // Auto-stop after 5 minutes if no booking detected
    pollTimeoutRef.current = setTimeout(() => {
      stopVoicePolling()
      setShowCheckingBanner(false)
    }, 5 * 60 * 1000)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => stopVoicePolling()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!canSend) return
    sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const handleInitiateCall = async () => {
    if (callingInProgress) return
    setCallingInProgress(true)
    try {
      const res = await fetch(`${API_BASE}/api/voice/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setShowCallModal(false)
        setCallActive(true)
        startVoicePolling()
      } else {
        showToast('Call failed. Please try again.', 'error')
      }
    } catch {
      showToast('Call failed. Please try again.', 'error')
    } finally {
      setCallingInProgress(false)
    }
  }

  return (
    <motion.div
      animate={{ maxWidth: containerMaxWidth }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto' }}
    >

      {/* ── Blue ripple transition effect ── */}
      <AnimatePresence>
        {showRipple && (
          <div
            key="ripple-wrap"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              zIndex: 9998,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0.3 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.3)',
                marginLeft: '-150px',
                marginTop: '-150px',
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── "Checking for booking" banner — shown after call ends while polling ── */}
      <AnimatePresence>
        {showCheckingBanner && (
          <motion.div
            key="checking-banner"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '8px',
              color: '#60A5FA',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            Call ended — checking for booking confirmation...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout (flex row; mobile has only chat here) ── */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>

        {/* ── Chat panel: fixed 700px on desktop split, flex:1 otherwise ── */}
        <div
          style={
            bp === 'desktop' && intakeComplete
              ? { width: '700px', flexShrink: 0 }
              : { flex: 1, minWidth: 0 }
          }
        >
          <div
            className="w-full flex flex-col overflow-hidden"
            style={{ ...PANEL_STYLE, height: chatHeight }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div>
                <div className="font-semibold text-base leading-tight" style={{ color: '#F8FAFC' }}>
                  Kyron Medical
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  Patient Assistant
                </div>
              </div>

              {/* Call Instead button */}
              <button
                onClick={() => intakeComplete && setShowCallModal(true)}
                title={intakeComplete ? undefined : 'Complete intake first'}
                className={`flex items-center gap-2 text-sm font-semibold ${
                  intakeComplete && !callBtnHovered ? 'call-btn-glow' : ''
                }`}
                style={{
                  background:
                    callBtnHovered && intakeComplete
                      ? 'linear-gradient(135deg, #2563EB, #6D28D9)'
                      : 'linear-gradient(135deg, #3B82F6, #7C3AED)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  cursor: intakeComplete ? 'pointer' : 'not-allowed',
                  opacity: intakeComplete ? 1 : 0.5,
                  transform:
                    callBtnHovered && intakeComplete ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow:
                    callBtnHovered && intakeComplete
                      ? '0 0 30px rgba(59,130,246,0.5), 0 4px 16px rgba(0,0,0,0.4)'
                      : undefined,
                  transition:
                    'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
                  willChange: 'transform',
                }}
                onMouseEnter={() => { if (intakeComplete) setCallBtnHovered(true) }}
                onMouseLeave={() => setCallBtnHovered(false)}
              >
                <motion.span
                  animate={intakeComplete ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={intakeComplete ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                </motion.span>
                Call Instead
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isTyping && <TypingIndicator key="typing" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="shrink-0 px-4 pb-4 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex gap-2">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isTyping}
                    placeholder=""
                    autoComplete="off"
                    className="w-full text-sm text-white outline-none"
                    style={{
                      background: 'rgba(17,24,39,0.9)',
                      border: '1px solid rgba(59,130,246,0.15)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: 'white',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59,130,246,0.5)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59,130,246,0.15)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {!input && (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderText}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94A3B8',
                          fontSize: '14px',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {placeholderText}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </div>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  onMouseEnter={() => setSendHovered(true)}
                  onMouseLeave={() => setSendHovered(false)}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: canSend
                      ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                      : 'rgba(59,130,246,0.2)',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    transform: canSend && sendHovered ? 'scale(1.05)' : 'scale(1)',
                    boxShadow:
                      canSend && sendHovered ? '0 0 16px rgba(59,130,246,0.4)' : 'none',
                    transition:
                      'transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
                    willChange: 'transform',
                  }}
                >
                  <svg
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ opacity: canSend ? 1 : 0.4 }}
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Glowing divider (tablet + desktop only) ── */}
        <AnimatePresence>
          {intakeComplete && !isMobile && (
            <motion.div
              key="divider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              style={{
                width: '1px',
                flexShrink: 0,
                alignSelf: 'stretch',
                margin: '0 16px',
                background:
                  'linear-gradient(to bottom, transparent, rgba(59,130,246,0.5), rgba(6,182,212,0.5), transparent)',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── RIGHT: Appointment panel (tablet + desktop only) ── */}
        <AnimatePresence>
          {intakeComplete && !isMobile && (
            <motion.div
              key="apt-panel"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={
                bp === 'desktop'
                  ? { flex: 1, minWidth: 0 }
                  : { width: '380px', flexShrink: 0 }
              }
            >
              <div
                style={{
                  ...PANEL_STYLE,
                  height: chatHeight,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <AptPanelContent
                  sessionId={sessionId}
                  confirmedBooking={confirmedBooking}
                  onBookingConfirmed={setConfirmedBooking}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Call ended summary card ── */}
      <AnimatePresence>
        {showCallEndedCard && (
          <motion.div
            key="call-ended"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              ...PANEL_STYLE,
              borderRadius: '20px',
              padding: '16px 20px',
              marginTop: '12px',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#34D399',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#F8FAFC' }}>
                  Your voice call with Kyra has ended
                </div>
                <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                  If an appointment was booked, you&rsquo;ll receive a confirmation email shortly.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Call Instead modal ── */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !callingInProgress && setShowCallModal(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              key="modal-card"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#111827',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '24px',
                padding: '28px',
                width: '100%', maxWidth: '360px',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#60A5FA',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <div className="font-semibold text-base mb-1" style={{ color: '#F8FAFC' }}>Switch to a call?</div>
              <div className="text-sm mb-1" style={{ color: '#94A3B8' }}>Kyra will call you at</div>
              <div
                className="text-sm font-medium mb-6 px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#60A5FA',
                  display: 'inline-block',
                }}
              >
                {patientPhone}
              </div>
              <div className="text-xs mb-6" style={{ color: '#94A3B8' }}>
                The full chat context will carry over — you won&rsquo;t need to repeat anything.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCallModal(false)}
                  disabled={callingInProgress}
                  className="flex-1 py-2.5 text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', color: '#94A3B8',
                    cursor: callingInProgress ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiateCall}
                  disabled={callingInProgress}
                  className="flex-1 py-2.5 text-sm font-medium transition-all"
                  style={{
                    background: callingInProgress
                      ? 'rgba(59,130,246,0.3)'
                      : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: '12px', color: 'white',
                    cursor: callingInProgress ? 'not-allowed' : 'pointer',
                  }}
                >
                  {callingInProgress ? 'Calling…' : 'Call Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Call in progress overlay ── */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            key="call-active-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1001,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{
                background: '#111827',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '24px',
                padding: '36px 28px',
                width: '100%', maxWidth: '360px',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 24px' }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.35)',
                  }}
                />
                <div style={{
                  position: 'absolute', inset: '12px', borderRadius: '50%',
                  background: 'rgba(16,185,129,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
              </div>
              <div className="font-semibold text-lg mb-2" style={{ color: '#F8FAFC' }}>Call in Progress</div>
              <div className="text-sm mb-8" style={{ color: '#94A3B8' }}>
                Kyra is continuing your conversation by phone. You can hang up when done.
              </div>
              <button
                onClick={() => {
                  setCallActive(false)
                  setShowCallEndedCard(true)
                  if (pollRef.current) setShowCheckingBanner(true)
                }}
                className="w-full py-3 text-sm font-medium transition-all"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '12px', color: '#FCA5A5', cursor: 'pointer',
                }}
              >
                End Call
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom drawer (< 768px only) ── */}
      <AnimatePresence>
        {intakeComplete && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 200,
                pointerEvents: 'none',
              }}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60vh',
                zIndex: 201,
                background: 'rgba(17,24,39,0.95)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderBottom: 'none',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                borderRadius: '20px 20px 0 0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px 0 8px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>

              {/* Panel content */}
              <AptPanelContent
                sessionId={sessionId}
                confirmedBooking={confirmedBooking}
                onBookingConfirmed={setConfirmedBooking}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast notifications ── */}
      <ToastContainer toasts={toasts} />
    </motion.div>
  )
}
