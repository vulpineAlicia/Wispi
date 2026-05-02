import { describe, it, expect } from 'vitest'
import {
  isRecord,
  isFiniteNumber,
  isLocation,
  isGeoResult,
  isAirData,
  isAirHistoryItem,
  isAirHistoryResponse,
} from '../../src/api/apiGuards'

describe('isRecord', () => {
  it('returns true for a plain object', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ a: 1 })).toBe(true)
  })

  it('returns true for an array', () => {
    expect(isRecord([])).toBe(true)
  })

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isRecord(42)).toBe(false)
    expect(isRecord('str')).toBe(false)
    expect(isRecord(true)).toBe(false)
    expect(isRecord(undefined)).toBe(false)
  })
})

describe('isFiniteNumber', () => {
  it('returns true for finite numbers', () => {
    expect(isFiniteNumber(0)).toBe(true)
    expect(isFiniteNumber(42)).toBe(true)
    expect(isFiniteNumber(-3.14)).toBe(true)
  })

  it('returns false for Infinity and -Infinity', () => {
    expect(isFiniteNumber(Infinity)).toBe(false)
    expect(isFiniteNumber(-Infinity)).toBe(false)
  })

  it('returns false for NaN', () => {
    expect(isFiniteNumber(NaN)).toBe(false)
  })

  it('returns false for non-numbers', () => {
    expect(isFiniteNumber('1')).toBe(false)
    expect(isFiniteNumber(null)).toBe(false)
    expect(isFiniteNumber(undefined)).toBe(false)
  })
})

describe('isLocation', () => {
  it('returns true for valid lat/lon object', () => {
    expect(isLocation({ lat: 51.5, lon: -0.1 })).toBe(true)
  })

  it('returns false when lat or lon is not a finite number', () => {
    expect(isLocation({ lat: '51.5', lon: -0.1 })).toBe(false)
    expect(isLocation({ lat: 51.5, lon: Infinity })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isLocation(null)).toBe(false)
    expect(isLocation(42)).toBe(false)
  })
})

describe('isGeoResult', () => {
  const valid = { name: 'London', country: 'GB', lat: 51.5, lon: -0.1 }

  it('returns true for a minimal valid GeoResult', () => {
    expect(isGeoResult(valid)).toBe(true)
  })

  it('returns true when state is present as string', () => {
    expect(isGeoResult({ ...valid, state: 'England' })).toBe(true)
  })

  it('returns true when state is null', () => {
    expect(isGeoResult({ ...valid, state: null })).toBe(true)
  })

  it('returns false when name is missing', () => {
    expect(isGeoResult({ country: 'GB', lat: 51.5, lon: -0.1 })).toBe(false)
  })

  it('returns false when lat is non-finite', () => {
    expect(isGeoResult({ ...valid, lat: NaN })).toBe(false)
  })

  it('returns false when state is a number', () => {
    expect(isGeoResult({ ...valid, state: 42 })).toBe(false)
  })
})

describe('isAirData', () => {
  const valid = {
    location: { lat: 51.5, lon: -0.1 },
    timestamp_unix: 1705320000,
    aqi_ow_1_5: 2,
    pollutants: { pm2_5: 12.3 },
    source: 'openweather',
  }

  it('returns true for a valid AirData object', () => {
    expect(isAirData(valid)).toBe(true)
  })

  it('returns false when location is invalid', () => {
    expect(isAirData({ ...valid, location: { lat: 'x', lon: 0 } })).toBe(false)
  })

  it('returns false when timestamp_unix is missing', () => {
    expect(isAirData({ location: { lat: 51.5, lon: -0.1 }, aqi_ow_1_5: 2, pollutants: { pm2_5: 12.3 }, source: 'openweather' })).toBe(false)
  })

  it('returns false when pollutants contains a non-finite value', () => {
    expect(isAirData({ ...valid, pollutants: { pm2_5: Infinity } })).toBe(false)
  })
})

describe('isAirHistoryItem', () => {
  const valid = { timestamp_unix: 1705320000, aqi_ow_1_5: 3, pollutants: { pm2_5: 8.0 } }

  it('returns true for a valid item', () => {
    expect(isAirHistoryItem(valid)).toBe(true)
  })

  it('returns false when aqi_ow_1_5 is NaN', () => {
    expect(isAirHistoryItem({ ...valid, aqi_ow_1_5: NaN })).toBe(false)
  })

  it('returns false when pollutants is not a record of numbers', () => {
    expect(isAirHistoryItem({ ...valid, pollutants: { pm2_5: 'high' } })).toBe(false)
  })
})

describe('isAirHistoryResponse', () => {
  const validItem = { timestamp_unix: 1705320000, aqi_ow_1_5: 2, pollutants: {} }
  const valid = {
    location: { lat: 51.5, lon: -0.1 },
    start_unix: 1705276800,
    end_unix: 1705363200,
    items: [validItem],
    source: 'openweather',
  }

  it('returns true for a valid response', () => {
    expect(isAirHistoryResponse(valid)).toBe(true)
  })

  it('returns true for an empty items array', () => {
    expect(isAirHistoryResponse({ ...valid, items: [] })).toBe(true)
  })

  it('returns false when items is not an array', () => {
    expect(isAirHistoryResponse({ ...valid, items: null })).toBe(false)
  })

  it('returns false when an item in the array is invalid', () => {
    expect(isAirHistoryResponse({ ...valid, items: [{ ...validItem, aqi_ow_1_5: 'bad' }] })).toBe(false)
  })

  it('returns false when location is invalid', () => {
    expect(isAirHistoryResponse({ ...valid, location: { lat: null, lon: 0 } })).toBe(false)
  })
})
