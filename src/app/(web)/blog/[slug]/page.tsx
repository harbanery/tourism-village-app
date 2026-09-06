import { BlogDetailSection } from "./section/BlogDetailSection";
import { dummyBlogs } from "@/models";

export default async function BlogDetailPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = dummyBlogs.find((b) => b.slug === slug) ?? null;

  return <BlogDetailSection post={post} />;
}
