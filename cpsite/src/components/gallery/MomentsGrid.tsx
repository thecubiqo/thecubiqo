'use client';

import ImageGallery from './ImageGallery';

interface MomentsImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface Props {
  images: MomentsImage[];
}

export default function MomentsGrid({ images }: Props) {
  return <ImageGallery images={images} layout="masonry" />;
}
