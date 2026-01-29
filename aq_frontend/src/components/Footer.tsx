const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer id="contacts" className="border-t border-white/10 bg-brand-900 text-brand-50/90">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="text-lg font-semibold text-brand-50">
              Wispi - Air Quality Monitor
            </div>
            <p className="mt-3 max-w-sm text-sm text-brand-200">
              A simple dashboard to look up air quality and make safer daily decisions.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-brand-50">Resources</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a className="text-brand-200 transition hover:text-brand-50" href="#features">Features</a></li>
              <li><a className="text-brand-200 transition hover:text-brand-50" href="#info">Useful info</a></li>
              <li><a className="text-brand-200 transition hover:text-brand-50" href="#map">Map</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-brand-50">Contact</div>
            <div className="mt-3 space-y-2 text-sm text-brand-200">
              <p>
                Email:{" "}
                <a
                  className="text-brand-50/90 underline decoration-white/20 underline-offset-4 transition hover:text-brand-50 hover:decoration-white/40"
                  href="mailto:support@example.com"
                >
                  support@example.com
                </a>
              </p>
              <p>
                GitHub:{" "}
                <a
                  className="text-brand-50/90 underline decoration-white/20 underline-offset-4 transition hover:text-brand-50 hover:decoration-white/40"
                  href="https://github.com/yourname/your-repo"
                  target="_blank"
                  rel="noreferrer"
                >
                  your-repo
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-brand-200 md:flex-row md:items-center md:justify-between">
          <div>© {year} Wispi - Air Quality Monitor. All rights reserved.</div>
          <div className="flex gap-4">
            <a className="transition hover:text-brand-50" href="#">
              Privacy
            </a>
            <a className="transition hover:text-brand-50" href="#">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
