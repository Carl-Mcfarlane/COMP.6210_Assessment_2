import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EntriesProvider } from '../../src/data/EntriesProvider.jsx'
import { useScpEntries } from '../../src/data/useScpEntries.js'
import { request } from '../../src/data/entriesApi.js'
import { useAuth } from '../../src/hooks/useAuth.js'

vi.mock('../../src/lib/supabaseClient.js', () => ({ supabase: {} }))
vi.mock('../../src/hooks/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../../src/data/entriesApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}))

const subjects = [
  { id: 1, item: 'SCP-173', description: 'A statue.', can_edit: false },
  { id: 2, item: 'SCP-049', description: 'A doctor.', can_edit: false },
]

function respondWith(list, userId = null) {
  request.mockResolvedValue({ response: { json: async () => list }, userId })
}

// two independent consumers, like a page plus the header search
function Count({ label }) {
  const { entries, loading } = useScpEntries()
  return <p>{label}: {loading ? 'loading' : entries.length}</p>
}

function renderProvider() {
  return render(
    <EntriesProvider>
      <Count label="page" />
      <Count label="header" />
    </EntriesProvider>,
  )
}

describe('EntriesProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({ user: null })
  })

  it('fetches the list once and shares it with every consumer', async () => {
    respondWith(subjects)
    renderProvider()

    expect(await screen.findByText('page: 2')).toBeInTheDocument()
    expect(screen.getByText('header: 2')).toBeInTheDocument()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('refetches when the signed-in user changes, since canEdit depends on who is asking', async () => {
    respondWith(subjects)
    const { rerender } = renderProvider()
    await screen.findByText('page: 2')

    useAuth.mockReturnValue({ user: { id: 'u1' } })
    respondWith([subjects[0]], 'u1')
    rerender(
      <EntriesProvider>
        <Count label="page" />
        <Count label="header" />
      </EntriesProvider>,
    )

    await waitFor(() => expect(screen.getByText('page: 1')).toBeInTheDocument())
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('does not fetch twice when the session loads into context after the first fetch', async () => {
    // the first fetch already ran as user u1 (read straight from the session)
    respondWith(subjects, 'u1')
    const { rerender } = renderProvider()
    await screen.findByText('page: 2')

    useAuth.mockReturnValue({ user: { id: 'u1' } })
    rerender(
      <EntriesProvider>
        <Count label="page" />
        <Count label="header" />
      </EntriesProvider>,
    )

    await screen.findByText('page: 2')
    expect(request).toHaveBeenCalledTimes(1)
  })
})
