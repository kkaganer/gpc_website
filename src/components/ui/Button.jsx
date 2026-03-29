import { Link } from 'react-router'

const variants = {
  primary:
    'bg-gradient-to-r from-primary to-dark text-white rounded-full hover:scale-105 transition-transform',
  secondary:
    'bg-white text-primary border-2 border-primary rounded-full hover:bg-primary/5 transition-colors',
  outline:
    'bg-transparent text-white border-2 border-white rounded-full hover:bg-white/10 transition-colors',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  href,
  ...rest
}) {
  const classes = `inline-flex items-center justify-center px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none ${variants[variant]} ${className}`

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          {...rest}
        >
          {children}
        </a>
      )
    }
    return (
      <Link to={href} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
