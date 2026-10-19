import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SCPDetail from '../../src/pages/SCPDetail.jsx'
import SCPForm from '../../src/pages/SCPForm.jsx'
import { useScpEntries } from '../../src/data/useScpEntries.js'
import { useAuth } from '../../src/hooks/useAuth.js'

vi.mock('../../src/data/useScpEntries.js', () => ({ useScpEntries: vi.fn() }))
vi.mock('../../src/hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

const baseEntry = {
  id: 'SCP-173',
  dbId: 1,
  objectClass: 'Euclid',
  description: ['A statue.'],
  containmentProcedures: ['Keep eyes on it.'],
  history: [],
  additionalSections: [],
  image: null,
}

function mockEntries(entry) {
  useScpEntries.mockReturnValue({
    entries: [entry],
    loading: false,
    error: null,
    deleteEntry: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: vi.fn(),
    uploadImage: vi.fn(),
  })
}

function renderAt(path, routePath, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('entry detail page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({ user: null, signOut: vi.fn() })
  })

  it('shows the entry to anyone, with no edit controls for visitors', () => {
    mockEntries({ ...baseEntry, canEdit: false })
    renderAt('/scp/SCP-173', '/scp/:id', <SCPDetail />)

    expect(screen.getByRole('heading', { name: 'SCP-173' })).toBeInTheDocument()
    expect(screen.getByText('A statue.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete entry/i })).not.toBeInTheDocument()
  })

  it('shows Edit and Delete when the user is allowed to change the entry', () => {
    useAuth.mockReturnValue({ user: { id: 'u1' }, signOut: vi.fn() })
    mockEntries({ ...baseEntry, canEdit: true })
    renderAt('/scp/SCP-173', '/scp/:id', <SCPDetail />)

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/scp/SCP-173/edit')
    expect(screen.getByRole('button', { name: /delete entry/i })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown entry', () => {
    mockEntries({ ...baseEntry, canEdit: false })
    renderAt('/scp/SCP-404', '/scp/:id', <SCPDetail />)

    expect(screen.getByText(/couldn't find an SCP entry/i)).toBeInTheDocument()
  })
})

describe('entry form', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({ user: { id: 'u1' }, signOut: vi.fn() })
  })

  it('shows a skeleton, not the form, while the entry is loading', () => {
    useScpEntries.mockReturnValue({ entries: [], loading: true, error: null })
    renderAt('/scp/SCP-173/edit', '/scp/:id/edit', <SCPForm />)

    expect(screen.getByRole('status', { name: 'Loading entry' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Item Number')).not.toBeInTheDocument()
    expect(screen.queryByText(/couldn't find/i)).not.toBeInTheDocument()
  })

  it('refuses to open the edit form for an entry the user does not own', () => {
    mockEntries({ ...baseEntry, canEdit: false })
    renderAt('/scp/SCP-173/edit', '/scp/:id/edit', <SCPForm />)

    expect(screen.getByText('You can only edit entries you created.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Item Number')).not.toBeInTheDocument()
  })

  it('pre-fills the edit form with the existing entry', () => {
    mockEntries({ ...baseEntry, canEdit: true })
    renderAt('/scp/SCP-173/edit', '/scp/:id/edit', <SCPForm />)

    expect(screen.getByLabelText('Item Number')).toHaveValue('SCP-173')
    expect(screen.getByLabelText('Object Class')).toHaveValue('Euclid')
    expect(screen.getByLabelText('Description')).toHaveValue('A statue.')
    expect(screen.getByLabelText('Containment Procedures')).toHaveValue('Keep eyes on it.')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('shows an empty create form on /scp/new', () => {
    mockEntries({ ...baseEntry, canEdit: true })
    renderAt('/scp/new', '/scp/new', <SCPForm />)

    expect(screen.getByLabelText('Item Number')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Create Entry' })).toBeInTheDocument()
  })
})
