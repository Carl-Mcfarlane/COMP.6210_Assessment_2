import { describe, expect, it } from 'vitest'
import { filterEntries } from '../../src/utils/filterEntries.js'
import { getObjectClassKey } from '../../src/utils/objectClassBadge.js'

const entries = [
  { id: 'SCP-173', objectClass: 'Euclid' },
  { id: 'SCP-049', objectClass: 'Euclid' },
  { id: 'SCP-682', objectClass: 'Keter' },
  { id: 'SCP-999' },
]

describe('filterEntries', () => {
  it('returns everything for an empty or whitespace query', () => {
    expect(filterEntries(entries, '')).toEqual(entries)
    expect(filterEntries(entries, '   ')).toEqual(entries)
  })

  it('matches on the SCP id, ignoring case', () => {
    expect(filterEntries(entries, 'scp-173')).toEqual([entries[0]])
    expect(filterEntries(entries, '049')).toEqual([entries[1]])
  })

  it('matches on object class', () => {
    expect(filterEntries(entries, 'keter')).toEqual([entries[2]])
    expect(filterEntries(entries, 'euclid')).toHaveLength(2)
  })

  it('copes with entries that have no object class', () => {
    expect(filterEntries(entries, '999')).toEqual([entries[3]])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterEntries(entries, 'thaumiel')).toEqual([])
  })
})

describe('getObjectClassKey', () => {
  it('lowercases the class name', () => {
    expect(getObjectClassKey('Keter')).toBe('keter')
  })

  it('returns undefined when there is no class', () => {
    expect(getObjectClassKey(undefined)).toBeUndefined()
  })
})
