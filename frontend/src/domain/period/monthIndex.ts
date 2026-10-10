/** The number of months from year 0 to the given month (0 for January). */
export function monthIndex(year: number, month: number): number {
  return year * 12 + month
}
