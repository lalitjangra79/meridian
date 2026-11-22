/** Build a CSV string (RFC 4180 quoting) and hand it to the browser as a download. */
export function toCsv(rows: Array<Array<string | number>>): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v)
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
}

/** Rows of objects → CSV download (keys become the header, in order). */
export function downloadable(filename: string, rows: Array<Record<string, string | number>>, columns: string[]) {
  downloadCsv(filename, toCsv([columns, ...rows.map((r) => columns.map((c) => r[c] ?? ''))]))
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
