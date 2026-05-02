import { describe, it, expect } from 'vitest'
import { buildHistoryModel } from '../../src/lib/historyModel'
import type { AirHistoryItem } from '../../src/api/apiTypes'

// 2024-01-15 UTC timestamps
const JAN_15_NOON = 1705320000  // 2024-01-15T12:00:00Z
const JAN_15_EVE  = 1705341600  // 2024-01-15T18:00:00Z
// 2024-01-16 UTC timestamps
const JAN_16_NOON = 1705406400  // 2024-01-16T12:00:00Z

function item(timestamp_unix: number, aqi_ow_1_5: number, pollutants: Record<string, number> = {}): AirHistoryItem {
  return { timestamp_unix, aqi_ow_1_5, pollutants }
}

describe('buildHistoryModel', () => {
  describe('with no items', () => {
    it('returns empty days and chart data for null input', () => {
      const model = buildHistoryModel({ items: null })
      expect(model.days).toHaveLength(0)
      expect(model.chartData).toHaveLength(0)
    })

    it('returns all nulls for latest and selected', () => {
      const model = buildHistoryModel({ items: null })
      expect(model.latestDay).toBeNull()
      expect(model.selectedDay).toBeNull()
      expect(model.latestPanel).toBeNull()
      expect(model.selectedPanel).toBeNull()
    })

    it('handles an empty array', () => {
      const model = buildHistoryModel({ items: [] })
      expect(model.days).toHaveLength(0)
    })
  })

  describe('with a single item', () => {
    it('creates one day entry', () => {
      const model = buildHistoryModel({ items: [item(JAN_15_NOON, 2, { pm2_5: 10 })] })
      expect(model.days).toHaveLength(1)
      expect(model.days[0].date).toBe('2024-01-15')
      expect(model.days[0].aqi).toBe(2)
      expect(model.days[0].pollutants).toEqual({ pm2_5: 10 })
    })

    it('sets latestDay to the only day', () => {
      const model = buildHistoryModel({ items: [item(JAN_15_NOON, 2)] })
      expect(model.latestDay?.date).toBe('2024-01-15')
    })

    it('mirrors days in chartData', () => {
      const model = buildHistoryModel({ items: [item(JAN_15_NOON, 2)] })
      expect(model.chartData).toHaveLength(1)
      expect(model.chartData[0].date).toBe('2024-01-15')
      expect(model.chartData[0].aqi).toBe(2)
    })
  })

  describe('winner selection within a day', () => {
    it('picks the item with the highest AQI', () => {
      const items = [
        item(JAN_15_NOON, 3),
        item(JAN_15_EVE, 5),
      ]
      const model = buildHistoryModel({ items })
      expect(model.days[0].aqi).toBe(5)
    })

    it('picks the latest timestamp when AQI values are equal', () => {
      const items = [
        item(JAN_15_NOON, 2, { pm2_5: 10 }),
        item(JAN_15_EVE, 2, { pm2_5: 20 }),
      ]
      const model = buildHistoryModel({ items })
      expect(model.days[0].pollutants.pm2_5).toBe(20)
    })

    it('skips items with non-finite AQI', () => {
      const items = [
        { timestamp_unix: JAN_15_NOON, aqi_ow_1_5: NaN, pollutants: {} },
        item(JAN_15_EVE, 3),
      ]
      const model = buildHistoryModel({ items })
      expect(model.days[0].aqi).toBe(3)
    })
  })

  describe('multi-day sorting', () => {
    it('returns days sorted chronologically', () => {
      const items = [
        item(JAN_16_NOON, 4),
        item(JAN_15_NOON, 2),
      ]
      const model = buildHistoryModel({ items })
      expect(model.days[0].date).toBe('2024-01-15')
      expect(model.days[1].date).toBe('2024-01-16')
    })

    it('sets latestDay to the last day in the sorted list', () => {
      const items = [item(JAN_15_NOON, 2), item(JAN_16_NOON, 4)]
      const model = buildHistoryModel({ items })
      expect(model.latestDay?.date).toBe('2024-01-16')
    })
  })

  describe('selectedDate', () => {
    it('returns the matching day when selectedDate exists in data', () => {
      const items = [item(JAN_15_NOON, 2), item(JAN_16_NOON, 4)]
      const model = buildHistoryModel({ items, selectedDate: '2024-01-15' })
      expect(model.selectedDay?.date).toBe('2024-01-15')
      expect(model.selectedDay?.aqi).toBe(2)
    })

    it('returns null when selectedDate has no matching day', () => {
      const items = [item(JAN_15_NOON, 2)]
      const model = buildHistoryModel({ items, selectedDate: '2024-01-20' })
      expect(model.selectedDay).toBeNull()
    })

    it('falls back to latestDay when selectedDate is null and today is not in data', () => {
      const items = [item(JAN_15_NOON, 2), item(JAN_16_NOON, 4)]
      // today is definitely not 2024-01-15 or 2024-01-16
      const model = buildHistoryModel({ items, selectedDate: null })
      expect(model.selectedDay?.date).toBe('2024-01-16')
    })

    it('selects today when today is in the data', () => {
      const todayIso = new Date().toISOString().slice(0, 10)
      const todayMidnightSec = Math.floor(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
        12, 0, 0,
      ) / 1000)
      const items = [item(todayMidnightSec, 3), item(JAN_15_NOON, 1)]
      const model = buildHistoryModel({ items, selectedDate: null })
      expect(model.selectedDay?.date).toBe(todayIso)
    })
  })

  describe('panel data', () => {
    it('latestPanel reflects latestDay aqi and pollutants', () => {
      const items = [item(JAN_15_NOON, 2, { pm2_5: 5 }), item(JAN_16_NOON, 4, { pm2_5: 15 })]
      const model = buildHistoryModel({ items })
      expect(model.latestPanel?.aqi).toBe(4)
      expect(model.latestPanel?.pollutants.pm2_5).toBe(15)
    })

    it('selectedPanel reflects selectedDay', () => {
      const items = [item(JAN_15_NOON, 2, { pm2_5: 5 }), item(JAN_16_NOON, 4)]
      const model = buildHistoryModel({ items, selectedDate: '2024-01-15' })
      expect(model.selectedPanel?.aqi).toBe(2)
      expect(model.selectedPanel?.pollutants.pm2_5).toBe(5)
    })

    it('strips non-finite pollutant values', () => {
      const items = [item(JAN_15_NOON, 2, { pm2_5: 5, bad: Infinity })]
      const model = buildHistoryModel({ items })
      expect(model.latestPanel?.pollutants).not.toHaveProperty('bad')
      expect(model.latestPanel?.pollutants.pm2_5).toBe(5)
    })
  })
})
