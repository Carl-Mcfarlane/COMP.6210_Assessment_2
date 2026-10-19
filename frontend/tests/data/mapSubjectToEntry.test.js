import { describe, expect, it, vi } from 'vitest'

// the real client throws on import without Supabase env vars
vi.mock('../../src/lib/supabaseClient.js', () => ({ supabase: {} }))

const { mapSubjectToEntry } = await import('../../src/data/entriesApi.js')

describe('mapSubjectToEntry', () => {
  const subject = {
    id: 7,
    item: 'SCP-173',
    description: 'A statue.',
    image: 'https://example.test/scp-173.jpg',
    can_edit: true,
    object_classes: { id: 2, name: 'Euclid' },
    containment_procedures: [{ id: 1, procedure_text: 'Keep eyes on it.' }],
    incident_logs: [
      { id: 2, log_date: '2001', entry_text: 'Second', sort_order: 2 },
      { id: 1, log_date: '2000', entry_text: 'First', sort_order: 1 },
    ],
    appendices: [{ id: 1, heading: 'Addendum', body: 'Notes.', sort_order: 1 }],
  }

  it('maps the database shape to the shape the pages use', () => {
    expect(mapSubjectToEntry(subject)).toEqual({
      id: 'SCP-173',
      dbId: 7,
      canEdit: true,
      objectClass: 'Euclid',
      description: ['A statue.'],
      image: 'https://example.test/scp-173.jpg',
      containmentProcedures: ['Keep eyes on it.'],
      history: [
        { date: '2000', text: 'First' },
        { date: '2001', text: 'Second' },
      ],
      additionalSections: [{ heading: 'Addendum', content: ['Notes.'] }],
    })
  })

  it('does not reorder the source array when sorting the history', () => {
    mapSubjectToEntry(subject)
    expect(subject.incident_logs[0].entry_text).toBe('Second')
  })

  it('handles a subject with no related rows', () => {
    const entry = mapSubjectToEntry({ id: 1, item: 'SCP-001', description: null })
    expect(entry.description).toEqual([])
    expect(entry.containmentProcedures).toEqual([])
    expect(entry.history).toEqual([])
    expect(entry.additionalSections).toEqual([])
    expect(entry.objectClass).toBeUndefined()
  })
})
