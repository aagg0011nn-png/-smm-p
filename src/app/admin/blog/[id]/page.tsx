"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BlogEditor, BlogFormValues } from "@/components/admin/blog-editor";

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<Partial<BlogFormValues> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/blog/${params.id}`)
      .then((r) => r.json())
      .then((d) => setInitial(d.post ?? {}));
  }, [params.id]);

  async function submit(values: BlogFormValues) {
    setSubmitting(true);
    const res = await fetch(`/api/admin/blog/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشل الحفظ");
      return;
    }
    toast.success("تم الحفظ");
    router.push("/admin/blog");
  }

  if (!initial) return <p className="text-sm text-ink-800/50 dark:text-white/40">جارٍ التحميل...</p>;

  return (
    <div className="card max-w-2xl">
      <h1 className="mb-4 font-semibold">تعديل المقال</h1>
      <BlogEditor initial={initial} submitting={submitting} onSubmit={submit} submitLabel="حفظ التغييرات" />
    </div>
  );
}
