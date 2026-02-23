interface Props {
  children: React.ReactNode;
  title?: string;
  date?: string;
  location?: string;
}

export default function MDXLayout({ children, title, date, location }: Props) {
  return (
    <article className="max-w-2xl mx-auto px-6 md:px-0 py-16">
      {(title || date) && (
        <header className="mb-10">
          {date && (
            <span className="text-[12px] text-[#A9A9A9] uppercase tracking-[0.14em]">
              {date}{location ? ` · ${location}` : ''}
            </span>
          )}
          {title && (
            <h1 className="text-[36px] md:text-[48px] font-[520] tracking-[-0.02em] leading-[1.1] mt-2">
              {title}
            </h1>
          )}
        </header>
      )}
      <div className="prose prose-stone max-w-none text-[17px] leading-[1.78] [&_p]:mb-6 [&_h2]:text-[24px] [&_h2]:font-[520] [&_h2]:mt-12">
        {children}
      </div>
    </article>
  );
}
