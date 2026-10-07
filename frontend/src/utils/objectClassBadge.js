// Normalises an object class name (e.g. "Keter") into the lowercase key
// used for the data-class attribute that ObjectClassBadge.css hooks its
// per-class colour scheme into. Shared by every place that renders a
// class-coloured element (badge, card, detail folder).
export function getObjectClassKey(objectClass) {
  return objectClass?.toLowerCase()
}
