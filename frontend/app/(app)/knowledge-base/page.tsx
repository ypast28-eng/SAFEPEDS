import type { Metadata } from "next";
import { Search, BookOpen, Tag } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input, Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Knowledge Base",
};

const CATEGORIES = [
  { title: "Compounds", count: 0, description: "Educational profiles on common PED compounds" },
  { title: "Blood Markers", count: 0, description: "What your lab results mean" },
  { title: "Harm Reduction", count: 0, description: "Best practices for health monitoring" },
  { title: "Cycle Protocols", count: 0, description: "General educational cycle information" },
];

const PLACEHOLDER_ARTICLES = [
  { title: "Understanding Lipid Panels", category: "Blood Markers", readTime: "5 min" },
  { title: "Liver Enzymes Explained", category: "Blood Markers", readTime: "4 min" },
  { title: "Introduction to Harm Reduction", category: "Harm Reduction", readTime: "6 min" },
];

export default function KnowledgeBasePage() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Curated educational content on compounds, health markers, and harm-reduction principles."
        badge="Educational Content"
      />

      {/* Search */}
      <div className="mb-8 max-w-lg">
        <Input
          placeholder="Search articles, compounds, markers..."
          leftIcon={<Search className="h-4 w-4" />}
          disabled
        />
        <p className="text-xs text-muted mt-2">Search functionality coming in Phase 2</p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CATEGORIES.map((cat) => (
          <Card key={cat.title} variant="gradient" hover padding="md" className="cursor-not-allowed opacity-75">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{cat.title}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{cat.description}</p>
            <Badge variant="default" className="mt-3">{cat.count} articles</Badge>
          </Card>
        ))}
      </div>

      {/* Featured articles placeholder */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Featured Articles</h2>
        <div className="space-y-3">
          {PLACEHOLDER_ARTICLES.map((article) => (
            <Card
              key={article.title}
              variant="bordered"
              padding="md"
              className="flex items-center gap-4 cursor-not-allowed opacity-60"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{article.title}</p>
                <p className="text-xs text-muted">{article.category}</p>
              </div>
              <Badge variant="default">{article.readTime}</Badge>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted mt-4 text-center">Full knowledge base content coming in Phase 2</p>
      </div>
    </div>
  );
}
