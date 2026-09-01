"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BlogEditor, BlogFormValues } from "@/components/admin/blog-editor";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submit(values: BlogFormValues) {
    setSubmitting(true);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشل الحفظ");
      return;
    }
    toast.success("تم إنشاء المقال");
    router.push("/admin/blog");
  }

  return (
    <div className="card max-w-2xl">
      <h1 className="mb-4 font-semibold">مقال جديد</h1>
      <BlogEditor submitting={submitting} onSubmit={submit} submitLabel="نشر / حفظ" />
    </div>
  );
}
