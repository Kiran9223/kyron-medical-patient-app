// TODO: Implement voice handoff
// - POST to /voice/handoff with current session_id
// - Show loading state while Vapi.ai initiates the call

function VoiceHandoffButton() {
  return (
    <button
      className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20 transition"
      onClick={() => {/* TODO */}}
    >
      📞 Call Instead
    </button>
  )
}

export default VoiceHandoffButton
