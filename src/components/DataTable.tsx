import { useMemo, useState, type ReactNode } from 'react'

import { motion } from 'motion/react'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { cx } from '../lib/cx'
import { useReducedMotion } from '../lib/useReducedMotion'

export type Column<T> = {
  key: string
  label: string
  align?: 'left' | 'right'
  /** CSS grid track, e.g. "64px" or "minmax(210px,1fr)". */
  width: string
  sort?: (row: T) => number | string
  /** Direction on first click: 1 ascending, -1 descending. */
  firstDir?: 1 | -1
  cell: (row: T) => ReactNode
  /** Extra classes on every cell in this column. */
  cellClass?: string
  /** Classes on both the header and the cells (padding, hiding). */
  className?: string
}

type DataTableProps<T> = {
  label: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  rowLabel?: (row: T) => string
  onRowClick?: (row: T) => void
  defaultSort?: { key: string; dir: 1 | -1 }
  empty?: ReactNode
  /** Minimum table width before it scrolls sideways inside its panel. */
  minWidth?: number
  /** Delay the row entrance (ms), e.g. to follow the page entrance. */
  enterDelay?: number
  className?: string
}

/**
 * The registry table: mono tabular cells on hairlines, sortable
 * caps headers with an arrow, rows that animate into place when re-sorted and
 * open on click / Enter / Space.
 */
export function DataTable<T>({ label, columns, rows, rowKey, rowLabel, onRowClick, defaultSort, empty, minWidth = 0, enterDelay = 400, className }: DataTableProps<T>) {
  const reduce = useReducedMotion()
  const [sort, setSort] = useState(defaultSort ?? { key: columns[0]!.key, dir: 1 as 1 | -1 })
  const grid = columns.map((c) => c.width).join(' ')

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sort) return rows
    return [...rows].sort((a, b) => {
      const va = col.sort!(a)
      const vb = col.sort!(b)
      const c = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return c * sort.dir
    })
  }, [rows, columns, sort])

  const toggle = (c: Column<T>) => setSort((s) => (s.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: c.firstDir ?? 1 }))

  return (
    <div className={cx('scroll-thin overflow-x-auto', className)}>
      <div role="table" aria-label={label} aria-rowcount={sorted.length + 1} style={{ minWidth }}>
        <div role="row" className="grid items-center border-b border-line pb-3" style={{ gridTemplateColumns: grid }}>
          {columns.map((c) => {
            const active = sort.key === c.key
            const right = c.align === 'right'
            return (
              <div key={c.key} role="columnheader" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined} className={cx(right && 'text-right', c.className)}>
                {c.sort ? (
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    className={cx(
                      'caps group inline-flex min-h-6 max-sm:min-h-10 cursor-pointer items-center gap-1 text-[10.5px] tracking-[0.24em] whitespace-nowrap transition-colors',
                      active ? 'text-fg' : 'text-muted hover:text-fg',
                      right && 'flex-row-reverse',
                    )}
                  >
                    <span className={right ? '-mr-[0.24em]' : ''}>{c.label}</span>
                    <span className={cx('transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40')}>
                      {active && sort.dir === -1 ? <ArrowDown className="size-3" strokeWidth={1.75} /> : <ArrowUp className="size-3" strokeWidth={1.75} />}
                    </span>
                  </button>
                ) : (
                  <span className="caps text-[10.5px] tracking-[0.24em] whitespace-nowrap text-muted">{c.label}</span>
                )}
              </div>
            )
          })}
        </div>

        {sorted.map((row, i) => (
          <motion.div
            key={rowKey(row)}
            layout={reduce ? false : 'position'}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ layout: { type: 'spring', stiffness: 420, damping: 40 }, delay: Math.min(i, 12) * 0.03 + enterDelay / 1000, duration: 0.4 }}
            role="row"
            aria-label={rowLabel?.(row)}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick && (() => onRowClick(row))}
            onKeyDown={onRowClick && ((e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), onRowClick(row)))}
            className={cx(
              'tnum group relative grid h-[52px] items-center border-b border-line font-mono text-[14.5px] outline-none',
              onRowClick && 'cursor-pointer',
              'before:pointer-events-none before:absolute before:-inset-x-3 before:inset-y-0 before:rounded-[3px] before:bg-fg before:opacity-0 before:transition-opacity before:duration-200',
              'hover:before:opacity-[0.045] focus-visible:before:opacity-[0.07]',
            )}
            style={{ gridTemplateColumns: grid }}
          >
            {columns.map((c) => (
              <div key={c.key} role="cell" className={cx('relative min-w-0', c.align === 'right' && 'text-right', c.className, c.cellClass)}>
                {c.cell(row)}
              </div>
            ))}
          </motion.div>
        ))}

        {sorted.length === 0 && empty}
      </div>
    </div>
  )
}
