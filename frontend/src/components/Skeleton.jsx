import './Skeleton.css'

// one grey shimmering block - the loading screens are just built by
// passing in whatever width/height matches the real content

function Skeleton({ className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  )
}

export default Skeleton