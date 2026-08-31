import { BlogDetailSection } from "./section/BlogDetailSection";
import { dummyBlogs } from "@/models";

export default async function BlogDetailPage({ params }: PageProps<"/blog/[id]">) {
  const { id } = await params;
  const post = dummyBlogs.find((b) => b.id === Number(id)) ?? null;

  return <BlogDetailSection post={post} />;
}
