'use client';

import React from 'react';
import VollebakHero from '@/components/vollebak/VollebakHero';
import { Exhibit, MediaExhibit, BlogCard, AudioModule } from '@/components/vollebak/Exhibits';
import '@/styles/vollebak.css';

export default function PortfolioPage() {
    return (
        <main className="v-theme">
            {/* 1. HERO */}
            <VollebakHero />

            {/* 2. WORK (AFRICA) */}
            <div id="work" className="v-stagger">
                <MediaExhibit
                    label="Field Study 01"
                    title="The River Archive"
                    src="/images/vollebak/waterfall.png"
                    caption="Zambezi River Basin — observation of organic flow patterns."
                />

                <MediaExhibit
                    label="Field Study 02"
                    src="/images/vollebak/boat.png"
                    caption="Trans-continental crossing — logistical architecture."
                />
            </div>

            {/* 3. WITNESS */}
            <div id="witness" className="v-stagger" style={{ marginTop: '160px' }}>
                <Exhibit label="Archive" title="Witness">
                    <p className="v-body max-w-2xl mb-24 opacity-60">
                        Public Conscience. An exploration of civic demonstration and the architecture of protest.
                    </p>
                </Exhibit>

                <MediaExhibit
                    label="Observation 01"
                    src="/images/vollebak/bridge.png"
                    caption="Brooklyn Bridge — civic demonstration."
                />

                <MediaExhibit
                    label="Observation 02"
                    src="/images/vollebak/memorial.png"
                    caption="Ephemeral memorials — the weight of shared grief."
                />
            </div>

            {/* 4. BLOG PREVIEW */}
            <Exhibit label="Insights" title="Editorial">
                <div className="v-grid v-grid-3 mt-12">
                    <BlogCard
                        category="Philosophy"
                        date="FEB 2026"
                        title="The Art of Digital Silence"
                    />
                    <BlogCard
                        category="Technical"
                        date="JAN 2026"
                        title="Designing for the Next 100 Years"
                    />
                    <BlogCard
                        category="Field"
                        date="DEC 2025"
                        title="Lessons from the Zambezi"
                    />
                </div>
            </Exhibit>

            {/* 5. MUSIC SECTION */}
            <Exhibit label="Sound" title="Archive">
                <div className="mt-12 space-y-4">
                    <AudioModule artist="S. Nebula" title="Subterranean Drift" />
                    <AudioModule artist="S. Nebula" title="Micro Filament Shimmer" />
                </div>
            </Exhibit>

            {/* 6. CONTACT + SOCIAL */}
            <footer className="v-exhibit border-t border-v-border">
                <div className="v-container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div>
                            <p className="v-label mb-8">Navigation</p>
                            <nav className="flex flex-col gap-4">
                                <a href="#work" className="v-link">Work</a>
                                <a href="#witness" className="v-link">Witness</a>
                                <a href="#editorial" className="v-link">Editorial</a>
                            </nav>
                        </div>
                        <div>
                            <p className="v-label mb-8">Connect</p>
                            <nav className="flex flex-col gap-4">
                                <a href="mailto:hello@scalarnebula.com" className="v-link uppercase">Email</a>
                                <a href="#" className="v-link uppercase">LinkedIn</a>
                                <a href="#" className="v-link uppercase">Instagram</a>
                            </nav>
                        </div>
                    </div>
                    <div className="mt-40">
                        <p className="v-label opacity-40 text-[9px]">© 2026 SCALAR NEBULA. ALL RIGHTS RESERVED.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
