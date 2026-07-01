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
  adminCreateHealthTopic,
  adminDeleteHealthTopic,
  adminListHealthTopics,
  adminUpdateHealthTopic,
} from "@/services/health-library";
import { uploadKnowledgeImage } from "@/services/knowledge";
import { HEALTH_CATEGORIES } from "@/types/health-library";
import type { HealthTopicSummary } from "@/types/health-library";

const EMPTY_FORM = {
  title: "",
  slug: "",
  category: HEALTH_CATEGORIES[0] as string,
  summary: "",
  content: "",
  overview: "",
  why_it_matters: "",
  blood_markers_involved: "",
  published: false,
  image_url: "",
};

export function HealthAdminView() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [topics, setTopics] = useState<HealthTopicSummary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setTopics(await adminListHealthTopics(session?.access_token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

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

  const toPayload = () => ({
    title: form.title,
    slug: form.slug,
    category: form.category,
    summary: form.summary || null,
    content: form.content,
    overview: form.overview || null,
    why_it_matters: form.why_it_matters || null,
    blood_markers_involved: form.blood_markers_involved
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    published: form.published,
    image_url: form.image_url || null,
  });

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (topic: HealthTopicSummary) => {
    setEditingId(topic.id);
    setForm({
      title: topic.title,
      slug: topic.slug,
      category: topic.category,
      summary: topic.summary ?? "",
      content: "",
      overview: "",
      why_it_matters: "",
      blood_markers_involved: topic.blood_markers_involved.join(", "),
      published: topic.published,
      image_url: topic.image_url ?? "",
    });
    authenticatedFetch<Record<string, unknown>>(
      `/api/v1/health-library/admin/topics/${topic.id}`,
      { accessToken: session?.access_token }
    )
      .then((detail) =>
        setForm((f) => ({
          ...f,
          content: String(detail.content ?? ""),
          overview: String(detail.overview ?? ""),
          why_it_matters: String(detail.why_it_matters ?? ""),
        }))
      )
      .catch(() => {});
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = toPayload();
      if (editingId) {
        await adminUpdateHealthTopic(editingId, payload, session?.access_token);
      } else {
        await adminCreateHealthTopic(payload, session?.access_token);
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
    if (!confirm("Delete this health topic?")) return;
    await adminDeleteHealthTopic(id, session?.access_token);
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
        title="Health Library CMS"
        description="Create and manage educational health topics, support options, and cross-links."
        badge="Admin Only"
        badgeVariant="warning"
        actions={
          <Link href="/health-library">
            <Button variant="outline" size="sm">View Public Library</Button>
          </Link>
        }
      />

      {error && <p className="text-sm text-accent mb-4" role="alert">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Topics</h3>
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted animate-pulse">Loading…</p>
          ) : (
            topics.map((t) => (
              <Card key={t.id} variant="bordered" padding="sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant={t.published ? "primary" : "default"} size="sm">
                        {t.published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="secondary" size="sm">{t.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(t)} className="text-muted hover:text-foreground p-1">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(t.id)} className="text-muted hover:text-accent p-1">
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
            {editingId ? "Edit Topic" : "New Topic"}
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
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={HEALTH_CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
          <Textarea
            label="Summary"
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          />
          <Textarea
            label="Overview"
            value={form.overview}
            onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
          />
          <Textarea
            label="Why It Matters"
            value={form.why_it_matters}
            onChange={(e) => setForm((f) => ({ ...f, why_it_matters: e.target.value }))}
          />
          <Input
            label="Blood Markers Involved (comma-separated)"
            value={form.blood_markers_involved}
            onChange={(e) => setForm((f) => ({ ...f, blood_markers_involved: e.target.value }))}
            placeholder="Hematocrit, Hemoglobin"
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="min-h-[160px]"
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
          <p className="text-xs text-muted">
            Support options, compound links, and scientific references are seeded per topic.
            Edit junction links directly in Supabase or extend this CMS in a future phase.
          </p>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="h-4 w-4" />
            Save Topic
          </Button>
        </Card>
      </div>
    </div>
  );
}
