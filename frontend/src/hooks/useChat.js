import { useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const KYRA_GREETING =
  "Hi there! I'm Kyra, the virtual receptionist for Kyron Medical. " +
  "I'm here to help you schedule an appointment with one of our doctors. " +
  "To get started, could I get your first and last name?"

export function useChat() {
  const [sessionId] = useState(() => crypto.randomUUID())

  const [messages, setMessages] = useState([
    { id: 'greeting', role: 'kyra', content: KYRA_GREETING },
  ])

  const [isTyping, setIsTyping] = useState(false)
  const [intakeComplete, setIntakeComplete] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [patientData, setPatientData] = useState(null)

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isTyping) return

      // Optimistically append the patient's message
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'patient', content: text.trim() },
      ])
      setIsTyping(true)

      try {
        const res = await fetch(`${API_BASE}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, message: text.trim() }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'kyra', content: data.response },
        ])

        if (data.intake_complete) {
          setIntakeComplete(true)
          if (data.patient_data) setPatientData(data.patient_data)
        }
        if (data.booking_complete) setBookingComplete(true)
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'kyra',
            content:
              "I'm sorry, I'm having a little trouble right now. Please try sending your message again.",
          },
        ])
      } finally {
        setIsTyping(false)
      }
    },
    [sessionId, isTyping],
  )

  const patientPhone = patientData?.phone ?? null

  return { messages, sendMessage, isTyping, sessionId, intakeComplete, bookingComplete, patientPhone }
}
