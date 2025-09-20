import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Blog {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  content: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogGridProps {
  blogs: Blog[] | undefined;
}

export function BlogGrid({ blogs }: BlogGridProps) {
  if (!blogs || blogs.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            {"No articles published yet."}
          </p>
        </div>
      </section>
    );
  }

  const publishedBlogs = blogs.filter((blog) => blog.published);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {publishedBlogs.map((blog) => (
          <Link key={blog.id} href={`/blog/${blog.slug}`} className="group">
            <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 p-0">
              {blog.coverImage && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={blog.coverImage || "/placeholder.svg"}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <time
                    dateTime={blog.createdAt.toISOString()}
                    className="font-mono uppercase tracking-wider"
                  >
                    {formatDistanceToNow(blog.createdAt, {
                      addSuffix: false,
                    }).replace("about ", "")}{" "}
                    ago
                  </time>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{blog.views.toLocaleString()}</span>
                  </div>
                </div>
                <CardTitle className="font-serif text-xl font-light leading-tight group-hover:text-accent transition-colors duration-200 text-balance">
                  {blog.title}
                </CardTitle>
                {blog.seoDescription && (
                  <CardDescription className="text-muted-foreground leading-relaxed text-pretty line-clamp-3">
                    {blog.seoDescription}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="flex items-center text-sm font-medium group-hover:text-accent/80 transition-colors">
                  {"Read article"}
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
