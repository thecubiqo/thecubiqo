import type { Metadata } from 'next';
import TopNav from '@/components/nav/TopNav';
import Footer from '@/components/sections/Footer';
import PlaceSection from '@/components/gallery/PlaceSection';
import { H1 } from '@/components/typography/H1';
import { P } from '@/components/typography/P';

export const metadata: Metadata = { title: 'Places' };

const places = [
  {
    id: 'zambia',
    name: 'Zambia',
    years: '2012 – 2014',
    note: 'Two years of service, slow time, red soil. Peace Corps. Teaching. Community.',
    images: [
      '/images/life/zambia/zambia-1.jpg',
      '/images/life/zambia/zambia-2.jpg',
      '/images/life/zambia/zambia-3.jpg',
    ],
  },
  {
    id: 'new-york',
    name: 'New York',
    years: '2016 – present',
    note: 'The city that holds everything at once. IRC. Music. Late nights.',
    images: [
      '/images/life/nyc/nyc-1.jpg',
      '/images/life/nyc/nyc-2.jpg',
      '/images/life/nyc/nyc-3.jpg',
    ],
  },
  {
    id: 'new-jersey',
    name: 'New Jersey',
    years: 'Roots',
    note: 'Where it started.',
    images: [] as string[],
  },
];

export default function PlacesPage() {
  return (
    <>
      <TopNav theme="light" />
      <main className="pt-28 pb-32 px-6 md:px-12 max-w-5xl mx-auto">
        <H1>Places</H1>
        <P className="mt-4 max-w-xl text-[#5A5752]">
          Documentary. Not a travel log. A record of where the work happened and where the life was.
        </P>
        <div className="mt-20 space-y-28">
          {places.map((place) => (
            <PlaceSection key={place.id} place={place} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
