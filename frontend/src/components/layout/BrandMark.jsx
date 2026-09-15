import { NavLink } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function BrandMark({ inverted = false, compact = false }) {
  return (
    <NavLink to="/" className="flex items-center gap-3">
      <span
        className={`grid h-10 w-10 place-items-center rounded-lg border ${
          inverted
            ? 'border-gold-500/40 bg-navy-800 text-gold-400'
            : 'border-gold-500/50 bg-navy-900 text-gold-400'
        }`}
      >
        <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className={compact ? 'hidden sm:block' : 'block'}>
        <span className={`block font-display text-xl leading-none tracking-wide ${inverted ? 'text-white' : 'text-navy-900'}`}>
          NIYAMNETRA AI
        </span>
        <span className={`mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] ${inverted ? 'text-gold-400/80' : 'text-gold-600'}`}>
          Preliminary Screening
        </span>
      </span>
    </NavLink>
  )
}
