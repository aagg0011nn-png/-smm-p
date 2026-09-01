"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  function load() {
    fetch("/api/admin/blog").then((r) => r.json()).then((d) => setPosts(d.posts ?? []));
  }
  useEffect(load, []);

  async function remove(id: string) {
    if (!confirm("حذف هذا المقال نهائيًا؟")) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("فشل الحذف");
      return;
    }
    toast.success("تم الحذف");
    load();
  }

  return (
    <div className="card overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold">المدونة</h1>
        <Link href="/admin/blog/new" className="btn-primary">مقال جديد</Link>
      </div>
      <table className="w-full min-w-[560px] text-right text-sm">
        <thead>
          <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
            <th className="pb-2 font-normal">العنوان</th>
            <th className="pb-2 font-normal">الحالة</th>
            <th className="pb-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3"><Link href={`/admin/blog/${p.id}`} className="hover:text-brand-500">{p.title}</Link></td>
              <td className="py-3">{p.isPublished ? "منشور" : "مسودة"}</td>
              <td className="py-3"><button onClick={() => remove(p.id)} className="text-red-600">حذف</button></td>
            </tr>
          ))}
          {posts.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا توجد مقالات.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
