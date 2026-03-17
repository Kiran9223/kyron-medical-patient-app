import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const cardStyle = {
  background: '#111827',
  border: '1px solid rgba(59,130,246,0.15)',
  borderRadius: '20px',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton({ embedded }) {
  const inner = (
    <>
      <div className="p-5">
        <div className="h-4 w-40 rounded-lg mb-1 animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div className="px-5 pb-5 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    </>
  )
  if (embedded) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">{inner}</motion.div>
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full" style={cardStyle}>
      {inner}
    </motion.div>
  )
}

function DateRow({ dateLabel, slots, onSlotClick, disabled, selectedSlotId }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all"
        style={{
          background: open ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          color: open ? '#60A5FA' : '#94A3B8',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <span>{dateLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ opacity: 0.6, fontSize: '10px' }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 pt-2 pb-1 px-1">
              {slots.map((slot, i) => {
                const isSelected = slot.slot_id === selectedSlotId
                return (
                  <motion.button
                    key={slot.slot_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.06 }}
                    onClick={() => onSlotClick(slot)}
                    disabled={disabled}
                    className="py-2.5 text-sm font-medium"
                    style={{
                      background: isSelected
                        ? 'rgba(59,130,246,0.2)'
                        : 'rgba(17,24,39,0.9)',
                      border: isSelected
                        ? '1px solid #3B82F6'
                        : '1px solid rgba(59,130,246,0.15)',
                      borderRadius: '10px',
                      color: disabled && !isSelected ? '#94A3B8' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      boxShadow: isSelected ? '0 0 24px rgba(59,130,246,0.25)' : 'none',
                      transition: 'all 0.2s ease',
                      willChange: 'transform',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled && !isSelected) {
                        e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.15)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(17,24,39,0.9)'
                        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {slot.time}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AppointmentPicker({ sessionId, onBookingConfirmed, embedded = false }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [slotsByDate, setSlotsByDate] = useState({})
  const [booking, setBooking] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/appointments/slots/${sessionId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setDoctor(data.doctor)
        setSlotsByDate(data.slots_by_date)
      } catch {
        setError('Could not load available slots. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [sessionId])

  const handleSlotClick = async (slot) => {
    if (booking) return
    setBooking(true)
    setSelectedSlotId(slot.slot_id)
    try {
      const res = await fetch(`${API_BASE}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, slot_id: slot.slot_id }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      onBookingConfirmed(data)
    } catch {
      setError('Booking failed. Please try a different slot.')
      setBooking(false)
    }
  }

  if (loading) return <LoadingSkeleton embedded={embedded} />

  if (error) {
    const errStyle = embedded
      ? { color: '#94A3B8', padding: '20px', textAlign: 'center', fontSize: '14px' }
      : { ...cardStyle, color: '#94A3B8', padding: '20px', textAlign: 'center', fontSize: '14px' }
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={errStyle}>
        {error}
      </motion.div>
    )
  }

  const dateEntries = Object.entries(slotsByDate)

  const content = (
    <>
      {/* Doctor header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4',
            }}
          >
            {doctor?.name?.split(' ').pop()?.[0] ?? 'Dr'}
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: '#F8FAFC' }}>{doctor?.name}</div>
            <div className="text-xs" style={{ color: '#06B6D4' }}>
              {doctor?.specialty}
            </div>
          </div>
          <div
            className="ml-auto text-xs px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(6,182,212,0.08)',
              border: '1px solid rgba(6,182,212,0.2)',
              color: '#06B6D4',
            }}
          >
            {dateEntries.reduce((sum, [, s]) => sum + s.length, 0)} slots
          </div>
        </div>
      </div>

      {/* Slot list */}
      <div
        className="p-4 space-y-2 overflow-y-auto"
        style={embedded ? { flex: 1 } : { maxHeight: '288px' }}
      >
        {dateEntries.map(([dateLabel, slots]) => (
          <DateRow
            key={dateLabel}
            dateLabel={dateLabel}
            slots={slots}
            onSlotClick={handleSlotClick}
            disabled={booking}
            selectedSlotId={selectedSlotId}
          />
        ))}
      </div>

      {booking && (
        <div
          className="px-5 py-3 text-xs text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#94A3B8', flexShrink: 0 }}
        >
          Confirming your appointment…
        </div>
      )}
    </>
  )

  // Embedded: no card wrapper — parent panel provides the container
  if (embedded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col"
        style={{ height: '100%' }}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="w-full"
      style={cardStyle}
    >
      {content}
    </motion.div>
  )
}
