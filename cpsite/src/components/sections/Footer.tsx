export default function Footer() {
  return (
    <footer className="bg-[#F6F3EE] border-t border-[#E2DDD7] px-6 md:px-12 py-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[13px] text-[#A9A9A9]">
        <div className="flex items-center gap-2">
          <a href="mailto:hello@carlphillips.com" className="hover:text-[#0B0B0D] transition">
            Email
          </a>
          <span>·</span>
          <span>New York City Metropolitan Area</span>
        </div>
        <span>© Carl Phillips</span>
      </div>
    </footer>
  );
}
