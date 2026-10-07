import { getObjectClassKey } from '../utils/objectClassBadge.js'
import './ObjectClassBadge.css'

// small colour-coded label for Safe/Euclid/Keter, used on cards, the
// detail page header, and the search dropdown - data-class is what the
// CSS hooks into to pick the colour
function ObjectClassBadge({ objectClass, className = '' }) {
  return (
    <span
      className={`object-class-badge ${className}`.trim()}
      data-class={getObjectClassKey(objectClass)}
    >
      {objectClass}
    </span>
  )
}

export default ObjectClassBadge