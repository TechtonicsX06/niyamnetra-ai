import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ScanLine, FileSearch, Menu, X } from 'lucide-react'
import { useState } from 'react'
import BrandMark from './BrandMark.jsx'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scan', label: 'New Scan', icon: ScanLine },
]

export default function AppShell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="pointer-events-none fixed inset-0 bg-mesh opacity-80" />
      <header className="sticky top-0 z-30 border-b border-white/40 bg-navy-950/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandMark inverted compact />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-gold-500/30 px-3 py-1 text-[11px] uppercase tracking-wider text-gold-400">
              Demo mode
            </span>
            <NavLink to="/scan" className="btn-primary !bg-gold-500 !text-navy-950 hover:!bg-gold-400">
              Start Screening
            </NavLink>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-white/10 px-4 py-3 md:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet key={location.pathname} />
      </main>
      <footer className="relative border-t border-ink-200/70 bg-white/70 py-4 text-center text-xs text-ink-400">
        <span className="inline-flex items-center gap-2">
          <FileSearch className="h-3.5 w-3.5" />
          Decision-support system · Not a legal determination
        </span>
      </footer>
    </div>
  )
}
