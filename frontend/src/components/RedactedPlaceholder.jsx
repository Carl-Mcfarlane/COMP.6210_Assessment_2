import './RedactedPlaceholder.css'

// classified-document style placeholder for entries without a photo - a
// solid black panel with a rotated "REDACTED" stamp
function RedactedPlaceholder({ className = '' }) {
  return (
    <div
      className={`redacted-placeholder ${className}`.trim()}
      role="img"
      aria-label="No image available"
    >
      <span className="redacted-placeholder__stamp">[ REDACTED ]</span>
    </div>
  )
}

export default RedactedPlaceholder
