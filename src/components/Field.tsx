import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { ChevronDown, Search } from 'lucide-react'

import { cx } from '../lib/cx'

/*
  Form controls. Each takes a `label` (rendered, or visually hidden with
  `hideLabel`) and an optional `error`, which turns the hairline orange and is
  announced through aria-describedby.
*/

const fieldBase =
  'w-full border bg-transparent text-fg placeholder:text-faint transition-[border-color,background-color] duration-200 outline-none hover:border-fg/40 focus-visible:border-fg/70 disabled:cursor-not-allowed disabled:opacity-45'

function Label({ id, children, hidden }: { id: string; children: ReactNode; hidden?: boolean }) {
  return (
    <label htmlFor={id} className={hidden ? 'sr-only' : 'caps mb-2 block text-[10px] tracking-[0.22em] text-muted'}>
      {children}
    </label>
  )
}

function ErrorText({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1.5 text-[12.5px] text-risk">
      {children}
    </p>
  )
}

type InputProps = ComponentPropsWithoutRef<'input'> & { label: string; hideLabel?: boolean; error?: ReactNode; search?: boolean; size?: never }

export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ label, hideLabel, error, search, className, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const eid = `${fid}-error`
  return (
    <div className={className}>
      <Label id={fid} hidden={hideLabel}>
        {label}
      </Label>
      <div className="relative">
        {search && <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted" strokeWidth={1.75} />}
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? eid : undefined}
          className={cx(fieldBase, 'h-[38px] max-sm:h-10 rounded-full px-4 text-[14px]', search && 'pl-9', error ? 'border-risk/80' : 'border-line')}
          {...rest}
        />
      </div>
      <ErrorText id={eid}>{error}</ErrorText>
    </div>
  )
})

type TextAreaProps = ComponentPropsWithoutRef<'textarea'> & { label: string; hideLabel?: boolean; error?: ReactNode }

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ label, hideLabel, error, className, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const eid = `${fid}-error`
  return (
    <div className={className}>
      <Label id={fid} hidden={hideLabel}>
        {label}
      </Label>
      <textarea
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? eid : undefined}
        className={cx(fieldBase, 'scroll-thin block min-h-[84px] resize-y rounded-[6px] px-3.5 py-2.5 text-[14px] leading-relaxed', error ? 'border-risk/80' : 'border-line')}
        {...rest}
      />
      <ErrorText id={eid}>{error}</ErrorText>
    </div>
  )
})

type SelectProps = ComponentPropsWithoutRef<'select'> & { label: string; hideLabel?: boolean; options: ReadonlyArray<string | { value: string; label: string }> }

export function Select({ label, hideLabel, options, className, id, ...rest }: SelectProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      <Label id={fid} hidden={hideLabel}>
        {label}
      </Label>
      <div className="relative">
        <select id={fid} className={cx(fieldBase, 'h-[38px] max-sm:h-10 cursor-pointer appearance-none rounded-full border-line bg-bg pr-9 pl-4 text-[14px]')} {...rest}>
          {options.map((o) => {
            const v = typeof o === 'string' ? o : o.value
            return (
              <option key={v} value={v}>
                {typeof o === 'string' ? o : o.label}
              </option>
            )
          })}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-muted" strokeWidth={1.75} />
      </div>
    </div>
  )
}

type SwitchProps = Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> & { checked: boolean; onChange: (checked: boolean) => void; label: string }

/** On/off switch (role="switch"). The button is 40px tall so the hit area is generous; the track is drawn inside. */
export function Switch({ checked, onChange, label, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('group/sw inline-flex h-10 shrink-0 cursor-pointer items-center rounded-full disabled:cursor-not-allowed disabled:opacity-45', className)}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-[22px] w-[38px] items-center rounded-full border transition-colors duration-200',
          checked ? 'border-fg bg-fg' : 'border-fg/35 bg-transparent group-hover/sw:border-fg/70',
        )}
      >
        <span className={cx('absolute size-[14px] rounded-full transition-[transform,background-color] duration-200 ease-out', checked ? 'translate-x-[19px] bg-bg' : 'translate-x-[3px] bg-fg/60')} />
      </span>
    </button>
  )
}

type SliderProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'onChange' | 'value'> & {
  label: string
  hideLabel?: boolean
  value: number
  onChange: (value: number) => void
  /** Right-aligned readout next to the label. */
  display?: ReactNode
}

/** Range input with a hairline track; the filled part follows the value. */
export function Slider({ label, hideLabel, value, onChange, display, min = 0, max = 100, step = 1, className, id, ...rest }: SliderProps) {
  const auto = useId()
  const fid = id ?? auto
  const pct = ((value - Number(min)) / (Number(max) - Number(min))) * 100
  return (
    <div className={className}>
      <div className={cx('flex items-baseline justify-between gap-4', hideLabel && 'sr-only')}>
        <label htmlFor={fid} className="text-[14px] text-fg">
          {label}
        </label>
        {display !== undefined && <span className="tnum font-mono text-[13px] text-muted">{display}</span>}
      </div>
      <input
        id={fid}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-2 block w-full"
        style={{ ['--fill' as string]: `${pct}%` }}
        {...rest}
      />
    </div>
  )
}
