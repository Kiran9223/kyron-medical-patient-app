import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = (message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  return { toasts, show }
}

// ---------------------------------------------------------------------------
// Container (render at top level, outside overflow:hidden parents)
// ---------------------------------------------------------------------------

export function ToastContainer({ toasts }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'white',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background:
                toast.type === 'success'
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(239,68,68,0.2)',
              border:
                toast.type === 'success'
                  ? '1px solid rgba(16,185,129,0.4)'
                  : '1px solid rgba(239,68,68,0.4)',
              maxWidth: '280px',
              lineHeight: 1.4,
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
