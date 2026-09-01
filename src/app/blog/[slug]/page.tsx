import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return {};
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.isPublished) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-4 font-display text-3xl font-bold">{post.title}</h1>
      {post.publishedAt && (
        <p className="mb-8 text-sm text-ink-800/50 dark:text-white/40">{new Date(post.publishedAt).toLocaleDateString("ar")}</p>
      )}
      {/* Content is authored by trusted admins in the CMS, not arbitrary user input */}
      <article className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </main>
  );
}
