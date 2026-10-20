import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AuthPageLinks from '../../src/components/AuthPageLinks.jsx'

describe('AuthPageLinks', () => {
  it('offers a way back to the landing page and to the catalogue', () => {
    render(
      <MemoryRouter>
        <AuthPageLinks />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /browse the catalogue/i })).toHaveAttribute('href', '/catalogue')
  })
})
