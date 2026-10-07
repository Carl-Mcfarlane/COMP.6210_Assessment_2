import { useEffect } from 'react'

// sets the browser tab title - React Router doesn't do this for you, so
// each page just calls this with whatever it wants shown
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title
  }, [title])
}
