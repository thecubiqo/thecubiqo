'use client';

import React, { useEffect, useRef } from 'react';

interface ExhibitProps {
    label: string;
    title?: string;
    children: React.ReactNode;
    container?: boolean;
}

export const Exhibit: React.FC<ExhibitProps> = ({ label, title, children, container = true }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('v-visible');
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} className="v-exhibit v-reveal">
            <div className={container ? "v-container" : "w-full"}>
                <div className="mb-20">
                    <p className="v-label mb-4">{label}</p>
                    {title && <h2 className="v-headline text-4xl md:text-5xl">{title}</h2>}
                </div>
                {children}
            </div>
        </section>
    );
};

interface MediaExhibitProps {
    label: string;
    title?: string;
    src: string;
    caption: string;
}

export const MediaExhibit: React.FC<MediaExhibitProps> = ({ label, title, src, caption }) => {
    return (
        <Exhibit label={label} title={title} container={false}>
            <div className="w-full">
                <img
                    src={src}
                    alt={caption}
                    className="v-media-treatment w-full"
                />
                <div className="v-container">
                    <p className="v-label mt-8 opacity-40 lowercase">{caption}</p>
                </div>
            </div>
        </Exhibit>
    );
};

interface CardProps {
    title: string;
    category: string;
    date: string;
}

export const BlogCard: React.FC<CardProps> = ({ title, category, date }) => (
    <div className="v-card">
        <p className="v-label mb-8 text-[9px]">{category} / {date}</p>
        <h3 className="v-headline text-2xl mb-12">{title}</h3>
        <div className="flex justify-end">
            <span className="v-label opacity-40">Read Case</span>
        </div>
    </div>
);

export const AudioModule: React.FC<{ title: string; artist: string }> = ({ title, artist }) => (
    <div className="v-audio-module">
        <div className="w-12 h-12 flex items-center justify-center border border-v-border cursor-pointer hover:bg-v-hover transition-colors">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
        </div>
        <div className="flex-1">
            <p className="v-label text-[10px] mb-1">{artist}</p>
            <p className="v-body text-base m-0">{title}</p>
        </div>
        <div className="v-progress-bar mx-8 hidden md:block">
            <div className="v-progress-fill" style={{ width: '42%' }} />
        </div>
        <p className="v-label opacity-40">02:14 / 05:40</p>
    </div>
);
