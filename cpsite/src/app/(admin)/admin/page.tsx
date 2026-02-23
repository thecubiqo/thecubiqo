export default function AdminPage() {
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-[520]">Admin Dashboard</h1>
      <p className="text-[#A9A9A9] mt-2">Manage posts and content.</p>
      <div className="mt-8 flex gap-4">
        <a href="/admin/new" className="border border-black px-4 py-2 text-[14px] hover:bg-black hover:text-white transition">
          New Post
        </a>
        <a href="/admin/posts" className="border border-black px-4 py-2 text-[14px] hover:bg-black hover:text-white transition">
          All Posts
        </a>
      </div>
    </main>
  );
}
