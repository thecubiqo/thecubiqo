export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.08] px-6 md:px-16 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/25">
          <a href="mailto:hello@cubiqo.ai" className="hover:text-white/50 transition">
            Email
          </a>
          <span>·</span>
          <a href="https://github.com/thecubiqo/thecubiqo" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">
            GitHub
          </a>
          <span>·</span>
          <span>cubiqo.ai</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.22em] text-white/20">
          © Cubiqo
        </span>
      </div>
    </footer>
  );
}


