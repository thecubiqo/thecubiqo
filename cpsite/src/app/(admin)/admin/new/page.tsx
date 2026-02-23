export default function NewPostPage() {
  return (
    <main className="p-12 max-w-2xl">
      <h1 className="text-[28px] font-[520] mb-8">New Post</h1>
      <form className="space-y-6">
        <div>
          <label className="block text-[13px] uppercase tracking-[0.14em] text-[#A9A9A9] mb-2">Title</label>
          <input type="text" className="w-full border border-[#E2DDD7] bg-transparent px-4 py-3 text-[16px] focus:outline-none focus:border-[#0B0B0D]" />
        </div>
        <div>
          <label className="block text-[13px] uppercase tracking-[0.14em] text-[#A9A9A9] mb-2">Category</label>
          <select className="w-full border border-[#E2DDD7] bg-transparent px-4 py-3 text-[16px] focus:outline-none focus:border-[#0B0B0D]">
            <option value="writing">Writing</option>
            <option value="field-notes">Field Notes</option>
          </select>
        </div>
        <div>
          <label className="block text-[13px] uppercase tracking-[0.14em] text-[#A9A9A9] mb-2">Content (MDX)</label>
          <textarea rows={16} className="w-full border border-[#E2DDD7] bg-transparent px-4 py-3 text-[15px] font-mono focus:outline-none focus:border-[#0B0B0D]" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <button type="submit" className="bg-[#0B0B0D] text-[#F6F3EE] px-6 py-2 text-[14px] hover:bg-[#2A2A2E] transition">
            Publish
          </button>
          <label className="flex items-center gap-2 text-[14px] text-[#5A5752]">
            <input type="checkbox" /> LinkedIn
          </label>
          <label className="flex items-center gap-2 text-[14px] text-[#5A5752]">
            <input type="checkbox" /> Facebook
          </label>
          <label className="flex items-center gap-2 text-[14px] text-[#5A5752]">
            <input type="checkbox" /> Instagram
          </label>
          <label className="flex items-center gap-2 text-[14px] text-[#5A5752]">
            <input type="checkbox" /> X
          </label>
        </div>
      </form>
    </main>
  );
}
