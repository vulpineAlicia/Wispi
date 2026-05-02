import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AqiPill from '../../src/components/shared/AqiPill'

describe('AqiPill', () => {
  it.each([
    [1, 'Good'],
    [2, 'Fair'],
    [3, 'Moderate'],
    [4, 'Poor'],
    [5, 'Very Poor'],
  ])('renders correct label for AQI %i', (aqi, label) => {
    render(<AqiPill aqi={aqi} />)
    expect(screen.getByText(`${aqi} — ${label}`)).toBeInTheDocument()
  })

  it('renders "Unknown" label for an out-of-range AQI', () => {
    render(<AqiPill aqi={99} />)
    expect(screen.getByText('99 — Unknown')).toBeInTheDocument()
  })

  it('renders as a <span>', () => {
    const { container } = render(<AqiPill aqi={1} />)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })
})
