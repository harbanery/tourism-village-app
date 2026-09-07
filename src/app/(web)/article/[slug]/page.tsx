import prisma from "@/server/db";
import { ArticleDetailSection } from "./section/ArticleDetailSection";

/** Detail artikel dari DB (hanya blog aktif). */
export default async function ArticleDetailPage({
  params,
}: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      title: true,
      filename: true,
      para: true,
      datetime: true,
      datetimeAfter: true,
      admin: { select: { name: true } },
    },
  });

  const post = blog
    ? {
        title: blog.title,
        filename: blog.filename,
        para: blog.para,
        datetime: blog.datetime.toISOString(),
        datetimeAfter: blog.datetimeAfter?.toISOString() ?? null,
        adminName: blog.admin.name,
      }
    : null;

  return <ArticleDetailSection post={post} />;
}
