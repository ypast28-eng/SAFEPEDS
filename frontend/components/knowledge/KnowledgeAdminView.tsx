"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Save, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Input, Select, Textarea, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import {
  adminCreateArticle,
  adminDeleteArticle,
  adminListArticles,
  adminUpdateArticle,
  fetchKnowledgeCategories,
  uploadKnowledgeImage,
} from "@/services/knowledge";
import type { ArticleSummary, DifficultyLevel, KnowledgeCategory } from "@/types/knowledge";

const EMPTY_FORM = {
  title: "",
  slug: "",
  category_id: "",
  summary: "",
  content: "",
  difficulty_level: "beginner" as DifficultyLevel,
  published: false,
  image_url: "",
};

export function KnowledgeAdminView() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [arts, cats] = await Promise.all([
        adminListArticles(session?.access_token),
        fetchKnowledgeCategories(),
      ]);
      setArticles(arts);
      setCategories(cats);
      if (cats.length > 0 && !form.category_id) {
        setForm((f) => ({ ...f, category_id: cats[0].id }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, form.category_id]);

  useEffect(() => {
    if (profile?.is_admin) load();
  }, [profile, load]);

  if (!profile?.is_admin) {
    return (
      <Card variant="bordered" padding="lg">
        <div className="text-center py-12">
          <Shield className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Admin access required.</p>
        </div>
      </Card>
    );
  }

  const slugify = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" });
  };

  const startEdit = (article: ArticleSummary) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      category_id: article.category.id,
      summary: article.summary ?? "",
      content: "",
      difficulty_level: article.difficulty_level,
      published: article.published,
      image_url: article.image_url ?? "",
    });
    authenticatedFetch<{ content?: string }>(
      `/api/v1/knowledge/admin/articles/${article.id}`,
      { accessToken: session?.access_token }
    )
      .then((detail) => setForm((f) => ({ ...f, content: String(detail.content ?? "") })))
      .catch(() => {});
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (editingId) {
        await adminUpdateArticle(editingId, form, session?.access_token);
      } else {
        await adminCreateArticle(form, session?.access_token);
      }
      await load();
      startNew();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    await adminDeleteArticle(id, session?.access_token);
    await load();
  };

  const handleImageUpload = async (file: File) => {
    try {
      const url = await uploadKnowledgeImage(file, session?.access_token);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Knowledge Base CMS"
        description="Create and manage educational articles, references, and links."
        badge="Admin Only"
        badgeVariant="warning"
        actions={
          <Link href="/knowledge-base">
            <Button variant="outline" size="sm">View Public KB</Button>
          </Link>
        }
      />

      {error && <p className="text-sm text-accent mb-4" role="alert">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Articles</h3>
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted animate-pulse">Loading…</p>
          ) : (
            articles.map((a) => (
              <Card key={a.id} variant="bordered" padding="sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant={a.published ? "primary" : "default"} size="sm">
                        {a.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(a)} className="text-muted hover:text-foreground p-1">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(a.id)} className="text-muted hover:text-accent p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card variant="elevated" padding="lg" className="xl:col-span-3 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit Article" : "New Article"}
          </h3>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                title: e.target.value,
                slug: editingId ? f.slug : slugify(e.target.value),
              }))
            }
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <Select
            label="Category"
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Select
            label="Difficulty"
            value={form.difficulty_level}
            onChange={(e) => setForm((f) => ({ ...f, difficulty_level: e.target.value as DifficultyLevel }))}
            options={[
              { label: "Beginner", value: "beginner" },
              { label: "Intermediate", value: "intermediate" },
              { label: "Advanced", value: "advanced" },
            ]}
          />
          <Textarea
            label="Summary"
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          />
          <Textarea
            label="Content (Markdown-style: ## headings, - bullets)"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="min-h-[200px]"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="text-sm text-muted"
            />
            {form.image_url && (
              <p className="text-xs text-muted mt-1 truncate">Uploaded: {form.image_url}</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="rounded border-border"
            />
            Published
          </label>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="h-4 w-4" />
            Save Article
          </Button>
        </Card>
      </div>
    </div>
  );
}
