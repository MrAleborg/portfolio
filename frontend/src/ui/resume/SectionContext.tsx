import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useId,
  useMemo,
  useState,
} from 'react'

export type SectionVariant = 'card' | 'row'

/** A command to open or close every entry; a new object each time, so entries can tell it is new. */
interface SectionCommand {
  open: boolean
}

interface SectionContextValue {
  variant: SectionVariant
  command: SectionCommand | null
  /** Tells the section whether an entry is open; called again whenever it changes. */
  report: (id: string, open: boolean) => void
  /** Tells the section an entry is gone. */
  leave: (id: string) => void
}

export const SectionContext = createContext<SectionContextValue | null>(null)

/**
 * What a section needs to know about its expandable entries: provide `context` to them,
 * and use `count`, `allOpen` and `toggleAll` for the expand all / collapse all button.
 */
export function useSectionRegistry(variant: SectionVariant) {
  const [entries, setEntries] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  )
  const [command, setCommand] = useState<SectionCommand | null>(null)

  const report = useCallback((id: string, open: boolean) => {
    setEntries((previous) => new Map(previous).set(id, open))
  }, [])
  const leave = useCallback((id: string) => {
    setEntries((previous) => {
      const next = new Map(previous)
      next.delete(id)
      return next
    })
  }, [])

  const context = useMemo(
    () => ({ variant, command, report, leave }),
    [variant, command, report, leave],
  )
  const allOpen = [...entries.values()].every(Boolean)

  return {
    context,
    count: entries.size,
    allOpen,
    /** Collapses every entry when all are open, expands them otherwise. */
    toggleAll: () => setCommand({ open: !allOpen }),
  }
}

/**
 * The open state of an expandable entry, as `[expanded, setExpanded]`.
 * In a section, a registered entry (the default) is counted while mounted and follows its
 * expand all / collapse all command. Anywhere else, or with `register: false`, it is plain
 * local state that the section never hears about.
 */
export function useSectionEntry(
  initiallyOpen: boolean,
  { register = true }: { register?: boolean } = {},
): readonly [boolean, (open: boolean) => void] {
  const section = useContext(SectionContext)
  const id = useId()
  const [expanded, setExpanded] = useState(initiallyOpen)
  const command = (register && section?.command) || null
  const [followed, setFollowed] = useState(command)
  const report = register ? section?.report : undefined
  const leave = register ? section?.leave : undefined

  if (command !== followed) {
    setFollowed(command)
    if (command) setExpanded(command.open)
  }

  useLayoutEffect(() => {
    report?.(id, expanded)
  }, [report, id, expanded])
  useLayoutEffect(() => () => leave?.(id), [leave, id])

  return [expanded, setExpanded]
}

/** How the entries of the enclosing section are shown; a card outside any section. */
export function useSectionVariant(): SectionVariant {
  return useContext(SectionContext)?.variant ?? 'card'
}
