import Image from 'next/image';

export const mdxComponents = {
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;
    return (
      <div className="my-10">
        <Image
          src={src}
          alt={alt ?? ''}
          width={1200}
          height={800}
          className="w-full object-cover"
          style={{ filter: 'saturate(0.88) contrast(1.04)' }}
        />
        {alt && <p className="text-[12px] text-[#A9A9A9] mt-2 text-center">{alt}</p>}
      </div>
    );
  },
};
