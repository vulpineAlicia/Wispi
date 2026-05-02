import { describe, it, expect } from 'vitest'
import {
  parseNumberOrNull,
  getLocationSelectionFromParams,
  coordsMatch,
  buildMapUrl,
} from '../../src/lib/locationSelection'

describe('parseNumberOrNull', () => {
  it('parses a valid integer', () => {
    expect(parseNumberOrNull('42')).toBe(42)
  })

  it('parses a valid float', () => {
    expect(parseNumberOrNull('3.14')).toBe(3.14)
  })

  it('parses a negative number', () => {
    expect(parseNumberOrNull('-10.5')).toBe(-10.5)
  })

  it('trims whitespace before parsing', () => {
    expect(parseNumberOrNull('  7  ')).toBe(7)
  })

  it('returns null for null input', () => {
    expect(parseNumberOrNull(null)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseNumberOrNull('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseNumberOrNull('   ')).toBeNull()
  })

  it('returns null for a non-numeric string', () => {
    expect(parseNumberOrNull('abc')).toBeNull()
  })

  it('returns null for Infinity', () => {
    expect(parseNumberOrNull('Infinity')).toBeNull()
  })

  it('returns null for NaN string', () => {
    expect(parseNumberOrNull('NaN')).toBeNull()
  })
})

describe('coordsMatch', () => {
  it('returns true for identical coordinates', () => {
    expect(coordsMatch(51.5, -0.1, 51.5, -0.1)).toBe(true)
  })

  it('returns true when difference is within tolerance', () => {
    expect(coordsMatch(51.5, -0.1, 51.5005, -0.1005)).toBe(true)
  })

  it('returns false when lat difference exceeds tolerance', () => {
    expect(coordsMatch(51.5, -0.1, 51.502, -0.1)).toBe(false)
  })

  it('returns false when lon difference exceeds tolerance', () => {
    expect(coordsMatch(51.5, -0.1, 51.5, -0.102)).toBe(false)
  })

  it('returns false when both coordinates exceed tolerance', () => {
    expect(coordsMatch(0, 0, 1, 1)).toBe(false)
  })
})

describe('getLocationSelectionFromParams', () => {
  function makeParams(obj: Record<string, string>) {
    return new URLSearchParams(obj)
  }

  it('returns null when lat is missing', () => {
    expect(getLocationSelectionFromParams(makeParams({ lon: '10' }))).toBeNull()
  })

  it('returns null when lon is missing', () => {
    expect(getLocationSelectionFromParams(makeParams({ lat: '51.5' }))).toBeNull()
  })

  it('returns null when coords are non-numeric', () => {
    expect(getLocationSelectionFromParams(makeParams({ lat: 'abc', lon: '10' }))).toBeNull()
  })

  it('parses lat, lon, name, and country', () => {
    const params = makeParams({ lat: '51.5', lon: '-0.1', name: 'London', country: 'GB' })
    expect(getLocationSelectionFromParams(params)).toEqual({
      lat: 51.5,
      lon: -0.1,
      name: 'London',
      country: 'GB',
    })
  })

  it('uses fallbackName when name param is absent', () => {
    const params = makeParams({ lat: '51.5', lon: '-0.1' })
    expect(getLocationSelectionFromParams(params, 'Default')?.name).toBe('Default')
  })

  it('omits country when country param is empty', () => {
    const params = makeParams({ lat: '51.5', lon: '-0.1', name: 'London' })
    expect(getLocationSelectionFromParams(params)?.country).toBeUndefined()
  })

  it('parses negative coordinates', () => {
    const params = makeParams({ lat: '-33.87', lon: '151.21' })
    const result = getLocationSelectionFromParams(params)
    expect(result?.lat).toBe(-33.87)
    expect(result?.lon).toBe(151.21)
  })
})

describe('buildMapUrl', () => {
  it('builds url with lat and lon only', () => {
    expect(buildMapUrl({ lat: 51.5, lon: -0.1 })).toBe('/map?lat=51.5&lon=-0.1')
  })

  it('includes name when provided', () => {
    const url = buildMapUrl({ lat: 51.5, lon: -0.1, name: 'London' })
    expect(url).toContain('name=London')
  })

  it('includes country when provided', () => {
    const url = buildMapUrl({ lat: 51.5, lon: -0.1, name: 'London', country: 'GB' })
    expect(url).toContain('country=GB')
  })

  it('omits name and country when not provided', () => {
    const url = buildMapUrl({ lat: 51.5, lon: -0.1 })
    expect(url).not.toContain('name')
    expect(url).not.toContain('country')
  })

  it('starts with /map?', () => {
    expect(buildMapUrl({ lat: 0, lon: 0 })).toMatch(/^\/map\?/)
  })
})
