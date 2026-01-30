'use client'

const merchItems = [
  { id: 1, name: 'CubiQo Hoodie Black', price: '$75' },
  { id: 2, name: 'CubiQo Hoodie White', price: '$75' },
]

export function MerchSection() {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CO-OP Logo Placeholder */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-4 bg-zinc-900/50 rounded-2xl border border-white/10">
            <span className="text-white/40 text-sm">[COOP_LOGO]</span>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-orange-400 text-sm tracking-widest uppercase mb-4">
            Official Merch
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Wear the Cube
            </span>
          </h2>
        </div>

        {/* Merch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {merchItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all"
            >
              {/* Image Placeholder */}
              <div className="aspect-square bg-zinc-900/50 flex items-center justify-center">
                <span className="text-white/40 text-sm">[IMG_HOODIE_{item.id}]</span>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                <button className="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
                  Coming Soon
                </button>
              </div>

              {/* Info */}
              <div className="p-4 bg-zinc-950">
                <h3 className="text-white font-medium">{item.name}</h3>
                <p className="text-white/60 text-sm">{item.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CO-OP Image Placeholder */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="aspect-video bg-zinc-900/30 rounded-2xl border border-white/5 flex items-center justify-center">
            <span className="text-white/40 text-sm">[IMG_COOP]</span>
          </div>
        </div>
      </div>
    </section>
  )
}

