import { useRef, useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

// Shared base styling — matches the rendered newsletter typography so the
// editor looks like the thing, not like a form field.
const BASE_FONT = "arial, helvetica, sans-serif"
const BASE_COLOR = "#1a1a2e"

/**
 * EditableText — Word-doc-style click-to-type input.
 *
 * Props:
 *  - value: the current value (override if set, otherwise defaultValue)
 *  - defaultValue: the source DB value (used to compute "dirty" state and for the reset icon)
 *  - onChange: (newValue) => void
 *  - onReset: () => void (optional) — called when the reset icon is clicked
 *  - placeholder: string shown when value is empty
 *  - variant: 'single' | 'multi' | 'inline'
 *  - style: extra inline style to match the rendered element's size/weight
 *  - className: extra class names
 *  - focusTrigger: any value — when it changes to a truthy value, the input focuses
 *    itself and scrolls into view. Used by click-in-preview to jump to the right field.
 */
export default function EditableText({
  value,
  defaultValue,
  onChange,
  onReset,
  placeholder = '',
  variant = 'single',
  style = {},
  className = '',
  focusTrigger,
  ...rest
}) {
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const effectiveValue = value ?? defaultValue ?? ''
  const isDirty = value !== undefined && value !== defaultValue

  // Auto-grow the textarea
  useEffect(() => {
    if (variant === 'multi' && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [effectiveValue, variant])

  // Focus + scroll whenever focusTrigger changes to a truthy value
  useEffect(() => {
    if (!focusTrigger) return
    const el = variant === 'multi' ? textareaRef.current : inputRef.current
    if (!el) return
    // Scroll the card into view first, then focus without scrolling again
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    // Small delay so the scroll doesn't jump when focus() refocuses the element
    const t = setTimeout(() => {
      try {
        el.focus({ preventScroll: true })
        // Move caret to end
        const len = el.value?.length ?? 0
        if (typeof el.setSelectionRange === 'function') {
          el.setSelectionRange(len, len)
        }
      } catch {
        // ignore
      }
    }, 120)
    return () => clearTimeout(t)
  }, [focusTrigger, variant])

  const baseStyle = {
    fontFamily: BASE_FONT,
    color: BASE_COLOR,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '2px 4px',
    margin: '0',
    borderRadius: '3px',
    ...style,
  }

  const focusStyle = {
    background: '#fdf2f8',
    boxShadow: 'inset 0 -1px 0 #fc16a0',
  }

  const [focused, setFocused] = useState(false)

  const commonProps = {
    value: effectiveValue,
    placeholder,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onChange: (e) => onChange(e.target.value),
    style: { ...baseStyle, ...(focused ? focusStyle : {}) },
    className,
    ...rest,
  }

  return (
    <div className="relative group" style={{ display: variant === 'inline' ? 'inline-block' : 'block', width: variant === 'inline' ? 'auto' : '100%' }}>
      {variant === 'multi' ? (
        <textarea
          ref={textareaRef}
          {...commonProps}
          rows={1}
          style={{
            ...commonProps.style,
            width: '100%',
            resize: 'none',
            lineHeight: '1.55',
            overflow: 'hidden',
          }}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          {...commonProps}
          style={{
            ...commonProps.style,
            width: variant === 'inline' ? `${Math.max(1, effectiveValue.length || placeholder.length || 4) + 1}ch` : '100%',
          }}
        />
      )}
      {isDirty && onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Reset to source value"
          className="absolute top-0.5 right-0.5 p-1 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ lineHeight: 0 }}
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  )
}
