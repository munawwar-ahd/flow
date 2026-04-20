export function LandingFooter() {
  return (
    <footer className="w-full border-t border-separator/60 bg-bg-primary">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 h-[120px] flex items-center justify-between">
        <div>
          <div className="text-[14px] font-semibold text-text-primary">Flow</div>
          <div className="text-caption text-text-tertiary mt-1">© 2026 Munawwar</div>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="#"
            className="text-[12px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-[12px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="text-[12px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
