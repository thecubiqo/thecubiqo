import EnterButton from './EnterButton';

export default function HeroCopy() {
  return (
    <div className="max-w-5xl">
      {/* Brand label */}
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/20 mb-8">
        Cubiqo
      </p>

      {/* Display headline */}
      <h1
        className="text-[64px] leading-[0.97] md:text-[92px] lg:text-[110px] tracking-[-0.03em] text-[#F2EFE8] font-[400]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Your AI companion.<br />Open source.
      </h1>

      {/* Sub-identity */}
      <p className="mt-8 text-[11px] text-white/30 max-w-xs leading-[2.1] tracking-[0.08em] uppercase">
        Voice&emsp;·&emsp;Journal&emsp;·&emsp;Matching<br />
        Privacy‑First&emsp;·&emsp;BYO Keys
      </p>

      <div className="mt-14">
        <EnterButton />
      </div>
    </div>
  );
}

