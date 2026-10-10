import { durationText } from '@/ui/i18n/durationText'

describe('durationText', () => {
  it.each([
    [{ years: 1, months: 0 }, '1 yr'],
    [{ years: 2, months: 0 }, '2 yrs'],
    [{ years: 0, months: 1 }, '1 mo'],
    [{ years: 0, months: 4 }, '4 mos'],
    [{ years: 1, months: 10 }, '1 yr 10 mos'],
  ])('writes %o in English as "%s"', (duration, expected) => {
    expect(durationText(duration, 'en')).toBe(expected)
  })

  it.each([
    [{ years: 1, months: 0 }, '1 an'],
    [{ years: 2, months: 0 }, '2 ans'],
    [{ years: 0, months: 1 }, '1 mois'],
    [{ years: 0, months: 4 }, '4 mois'],
    [{ years: 1, months: 10 }, '1 an 10 mois'],
  ])('writes %o in French as "%s"', (duration, expected) => {
    expect(durationText(duration, 'fr')).toBe(expected)
  })
})
