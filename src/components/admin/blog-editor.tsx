"use client";

import { useState } from "react";

export interface BlogFormValues {
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
}

export function BlogEditor({
  initial,
  submitting,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<BlogFormValues>;
  submitting: boolean;
  onSubmit: (values: BlogFormValues) => void;
  submitLabel: string;
}) {
  const [values, setValues] = useState<BlogFormValues>({
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    contentHtml: initial?.contentHtml ?? "",
    coverImage: initial?.coverImage ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    isPublished: initial?.isPublished ?? false,
  });

  function set<K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">العنوان</label>
        <input className="input" value={values.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="label">مقتطف مختصر</label>
        <input className="input" value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div>
        <label className="label">رابط صورة الغلاف</label>
        <input className="input" value={values.coverImage} onChange={(e) => set("coverImage", e.target.value)} placeholder="https://" />
      </div>
      <div>
        <label className="label">المحتوى (HTML)</label>
        <textarea className="input min-h-[220px] font-mono text-xs" value={values.contentHtml} onChange={(e) => set("contentHtml", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Meta Title (SEO)</label>
          <input className="input" value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        </div>
        <div>
          <label className="label">Meta Description (SEO)</label>
          <input className="input" value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
        منشور (مرئي للزوار)
      </label>
      <button className="btn-primary" disabled={submitting || !values.title || !values.contentHtml} onClick={() => onSubmit(values)}>
        {submitting ? "جارٍ الحفظ..." : submitLabel}
      </button>
    </div>
  );
}
