import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatInterface from './components/ChatInterface'

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0F1E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{ animation: 'logoPulse 2s ease-in-out infinite', textAlign: 'center' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '28px',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 0 40px rgba(59,130,246,0.35)',
          }}
        >
          K
        </div>
        <div
          style={{
            color: '#F8FAFC',
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '-0.3px',
          }}
        >
          Kyron Medical
        </div>
        <div style={{ color: '#94A3B8', fontSize: '14px' }}>
          Your AI-Powered Patient Assistant
        </div>
      </div>
    </motion.div>
  )
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="min-h-screen flex items-start justify-center p-4 py-8 overflow-y-auto"
      style={{
        background: '#0A0F1E',
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Aurora blob 1 — top-left, blue/purple */}
      <div
        className="aurora-blob"
        style={{
          top: '-8%',
          left: '-5%',
          background: 'radial-gradient(circle, #3B82F6, #7C3AED)',
          animation: 'aurora1 18s ease-in-out infinite',
        }}
      />
      {/* Aurora blob 2 — bottom-right, teal/blue */}
      <div
        className="aurora-blob"
        style={{
          bottom: '-8%',
          right: '-5%',
          background: 'radial-gradient(circle, #06B6D4, #3B82F6)',
          animation: 'aurora2 15s ease-in-out infinite',
        }}
      />
      {/* Aurora blob 3 — center, purple/teal */}
      <div
        className="aurora-blob"
        style={{
          top: '35%',
          left: '50%',
          background: 'radial-gradient(circle, #7C3AED, #06B6D4)',
          animation: 'aurora3 20s ease-in-out infinite',
        }}
      />

      {/* Splash screen */}
      <AnimatePresence>{!splashDone && <SplashScreen key="splash" />}</AnimatePresence>

      {/* Chat interface fades in after splash */}
      <AnimatePresence>
        {splashDone && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full"
          >
            <ChatInterface />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
