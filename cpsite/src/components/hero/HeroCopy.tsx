import EnterButton from './EnterButton';

export default function HeroCopy() {
  return (
    <div className="max-w-3xl text-[#F6F3EE]">
      <p className="text-[13px] uppercase tracking-[0.22em] text-[#F6F3EE]/40 mb-4">
        Carl Phillips
      </p>
      <h1 className="text-[44px] leading-[1.04] md:text-[68px] tracking-[-0.025em] font-[520]">
        At the edge of life.
      </h1>
      <p className="mt-5 text-[15px] md:text-[16px] text-[#B9B2A6] max-w-md leading-[1.75]">
        Humanitarian leadership.&ensp;Music.&ensp;Education.&ensp;Writing.
      </p>
      <div className="mt-10">
        <EnterButton />
      </div>
    </div>
  );
}
