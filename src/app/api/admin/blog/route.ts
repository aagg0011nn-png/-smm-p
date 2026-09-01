import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().max(500).optional(),
  contentHtml: z.string().min(1),
  coverImage: z.string().url().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(300).optional(),
  isPublished: z.boolean().default(false),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  let slug = slugify(parsed.data.title);
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const post = await prisma.blogPost.create({
    data: {
      ...parsed.data,
      slug,
      publishedAt: parsed.data.isPublished ? new Date() : null,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
