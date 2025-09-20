import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Calendar,
  User,
  FileText,
  Edit3,
  TrendingUp,
  Eye,
} from "lucide-react";
import { findBlogs } from "@/lib/action";
import PublishButton from "./_components/publish-button";

export default async function BlogAdminPage() {
  const blogs = await findBlogs();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="flex flex-col gap-6 mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-5xl tracking-tight text-foreground">
              Blog Management
            </h1>
            <p className="text-lg text-muted-foreground font-light">
              Create and manage your content with precision
            </p>
          </div>
          <Link href="/admin/blog/editor" className="cursor-pointer">
            <Button
              size="lg"
              className="gap-2 px-6 py-3 rounded-xl font-medium cursor-pointer"
            >
              <PlusCircle className="h-5 w-5" />
              New Article
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 mb-12 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-light text-foreground">
                    {blogs?.length || 0}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                    Total Articles
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/5">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-light text-foreground">
                    {blogs?.length || 0}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                    Published
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-light text-foreground">2.4k</p>
                  <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                    Total Views
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-light text-foreground">0</p>
                  <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                    Drafts
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Edit3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-6 px-8 pt-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Content Library</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Manage and organize your articles
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium rounded-full"
              >
                {blogs?.length || 0} articles
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {blogs?.length === 0 ? (
              /* Enhanced empty state with better visual design */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-2xl bg-muted/50 p-8 mb-6">
                  <FileText className="h-16 w-16 text-muted-foreground/60" />
                </div>
                <h3 className="text-2xl font-light mb-3">No articles yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md font-light leading-relaxed">
                  Start creating compelling content that engages your audience
                  and builds your brand.
                </p>
                <Link href="/admin/blog/editor">
                  <Button size="lg" className="gap-2 px-8 py-3 rounded-xl">
                    <PlusCircle className="h-5 w-5" />
                    Create First Article
                  </Button>
                </Link>
              </div>
            ) : (
              /* Redesigned blog cards with minimalist aesthetic */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {blogs?.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/admin/blog/editor?blogId=${blog.id}`}
                  >
                    <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-0 bg-background/80 backdrop-blur-sm">
                      <CardHeader className="pb-4 p-6">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                            {blog.title}
                          </CardTitle>
                          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                            <Edit3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                        <CardDescription className="text-sm font-medium text-muted-foreground/80">
                          /{blog.slug}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="p-1.5 rounded-md bg-muted/50">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{blog.authorId}</span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="p-1.5 rounded-md bg-muted/50">
                                <Calendar className="h-3.5 w-3.5" />
                              </div>
                              <span>
                                {new Date(blog.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2">
                            {blog.published && (
                              <Badge
                                variant="outline"
                                className="text-xs font-medium px-3 py-1 rounded-full border-green-200 text-green-700 dark:border-green-800 dark:text-green-300"
                              >
                                Published
                              </Badge>
                            )}
                            <PublishButton id={blog.id} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
