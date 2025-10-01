import { findBlogBySlug, findBlogBySlugWithoutView } from "@/lib/action";
import { headers } from "next/headers";
import Image from "next/image";
import { Calendar, Eye, User } from "lucide-react";
import { getBaseURL } from "@/lib/utils";

interface paramsProp {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: paramsProp) {
  const { slug } = await params;
  const blog = await findBlogBySlugWithoutView(slug);

  const ogImageUrl = `${getBaseURL()}/api/og?template=minimal-blog&title=${encodeURIComponent(blog?.title || "")}&logo=${encodeURIComponent("https://fhi5b89inu.ufs.sh/f/RPE5CBbg6eKjkfFs83icCP1fGOZSHyLix7snjqw3EzgJbN49")}&date=${blog?.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ""}&image=${encodeURIComponent(blog?.coverImage || "")}&bgColor=#a8d5d8`;

  return {
    title: blog?.title,
    openGraph: {
      title: blog?.title,
      description: `${blog?.seoDescription}`,
      url: `${getBaseURL()}/blog/${blog?.slug}`,
      siteName: "Vitanou",
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 600,
        },
        {
          url: ogImageUrl,
          width: 1800,
          height: 1600,
          alt: `image of ${blog?.title}`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function page(props: { params: Promise<{ id: string }> }) {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "anonymous";

  const params = await props.params;
  const { id } = params;
  const slug = id;
  const blog = await findBlogBySlug(slug, ip);

  return (
    <article className="min-h-screen bg-background max-w-5xl mx-auto">
      <header className="border-b border-border/50">
        <div className="max-w-4xl mx-auto px-2 md:px-6 py-6 md:py-16 lg:py-24">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-foreground">
              {blog?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>admin</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time>
                  {blog?.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{blog?.views} views</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {blog?.coverImage && (
        <div className="max-w-4xl mx-auto px-2 md:px-6 py-4 md:py-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
            <Image
              width={1200}
              height={675}
              src={blog.coverImage || "/placeholder.svg"}
              alt={blog.title}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-2 md:px-6 py-6 md:py-12 lg:py-16">
        <div
          className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-p:text-justify
                     prose-headings:font-light prose-headings:text-foreground
                     prose-p:text-foreground/90 prose-p:leading-relaxed
                     prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                     prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                     prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                     prose-pre:bg-muted prose-pre:border prose-pre:border-border"
          dangerouslySetInnerHTML={{ __html: blog?.content as string }}
        />
      </main>
    </article>
  );
}
