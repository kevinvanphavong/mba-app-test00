import { describe, expect, it } from 'vitest'
import { formatHours, formatHoursDiff } from './formatHours'

// Test smoke du palier 0 : prouve que la chaîne Vitest tourne (CI front).
// Cas tirés de la doc de la fonction.
describe('formatHours', () => {
  it('convertit les heures décimales en "XhYY"', () => {
    expect(formatHours(7.75)).toBe('7h45')
    expect(formatHours(7)).toBe('7h00')
    expect(formatHours(0)).toBe('0h00')
  })

  it('réincrémente l\'heure quand la minute arrondit à 60', () => {
    expect(formatHours(7.999)).toBe('8h00')
  })

  it('préserve le signe négatif', () => {
    expect(formatHours(-0.5)).toBe('-0h30')
  })

  it('retombe sur "0h00" pour une valeur non finie', () => {
    expect(formatHours(Number.NaN)).toBe('0h00')
  })
})

describe('formatHoursDiff', () => {
  it('force le signe pour les écarts', () => {
    expect(formatHoursDiff(2.5)).toBe('+2h30')
    expect(formatHoursDiff(-3.25)).toBe('-3h15')
    expect(formatHoursDiff(0)).toBe('+0h00')
  })
})
