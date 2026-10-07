// two versions of basically the same pattern: split needs the /g flag to
// find every match, but reusing a global regex for .test() in a loop is
// buggy (it remembers lastIndex between calls), so testing needs its own
// non-global copy
const REDACTED_SPLIT = /(\[DATA EXPUNGED\]|█+)/g
const REDACTED_TEST = /^(\[DATA EXPUNGED\]|█+)$/

export function renderRedactedText(text) {
  return text.split(REDACTED_SPLIT).map((part, index) =>
    REDACTED_TEST.test(part) ? (
      <span key={index} className="redacted">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
