import Link from "next/link";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export const metadata = { title: "المدونة" };

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 font-display text-3xl font-bold">المدونة</h1>
      <div className="space-y-6">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="card block hover:border-brand-500/40">
            <h2 className="font-semibold">{p.title}</h2>
            {p.excerpt && <p className="mt-1 text-sm text-ink-800/60 dark:text-white/50">{p.excerpt}</p>}
          </Link>
        ))}
        {posts.length === 0 && <p className="text-sm text-ink-800/50 dark:text-white/40">لا توجد مقالات منشورة بعد.</p>}
      </div>
    </main>
  );
}
