import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="ink-panel mt-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-bold text-accent-foreground">
              K
            </span>
            <span className="font-display text-lg font-bold">Kaleidonex</span>
          </div>
          <p className="mt-4 max-w-xs text-sm opacity-80">
            Future-ready education infrastructure for schools: curriculum, labs, kits, teacher
            training and progress tracking in one programme.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Platform</h3>
          <ul className="mt-4 space-y-2 break-words text-sm opacity-90">
            <li><Link to="/solutions" className="hover:underline">Solutions</Link></li>
            <li><Link to="/curriculum" className="hover:underline">Curriculum</Link></li>
            <li><Link to="/products" className="hover:underline">Products &amp; kits</Link></li>
            <li><Link to="/schools" className="hover:underline">For schools</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Company</h3>
          <ul className="mt-4 space-y-2 break-words text-sm opacity-90">
            <li><Link to="/about" className="hover:underline">About us</Link></li>
            <li><Link to="/teachers" className="hover:underline">For teachers</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            <li><Link to="/demo" className="hover:underline">Request a demo</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Talk to us</h3>
          <ul className="mt-4 space-y-2 break-words text-sm opacity-90">
            <li>partnerships@kaleidonex.example</li>
            <li>+91 98000 00000</li>
            <li>Mon–Sat, 9:30am–6:30pm IST</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs opacity-70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Kaleidonex Learning Labs. All rights reserved.</p>
          <p>Privacy Policy · Terms · Refund Policy</p>
        </div>
      </div>
    </footer>
  );
}
