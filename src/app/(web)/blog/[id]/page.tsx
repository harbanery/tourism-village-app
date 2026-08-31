"use client";

import { use } from "react";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Button, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs } from "@/models";
import { formatDate } from "@/utils/format";

export default function BlogDetailPage({ params }: PageProps<"/blog/[id]">) {
  const { id } = use(params);
  const { t, locale } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const post = dummyBlogs.find((b) => b.id === Number(id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/artikel" className="inline-block mb-4">
        <Button icon={<ArrowLeftOutlined />}>{t("articles.title")}</Button>
      </Link>
      {post ? (
        <Card
          cover={
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={post.title} src={post.filename} className="max-h-96 w-full object-cover" />
          }
        >
          <h1 className="text-2xl md:text-3xl font-bold">{post.title}</h1>
          <p className="mt-2 text-sm text-foreground/50">
            {t("articles.postedBy", {
              date: formatDate(post.datetime, locale, true),
              author: post.adminName ?? "-",
            })}
            {post.datetimeAfter
              ? ` · ${t("admin.blog.dateChanged")}: ${formatDate(post.datetimeAfter, locale, true)}`
              : ""}
          </p>
          <div className="mt-6 space-y-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.paraHeader }} />
          <div className="mt-4 space-y-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.paraBody }} />
        </Card>
      ) : (
        <Card>
          <p>{t("articles.notFound")}</p>
        </Card>
      )}
    </div>
  );
}
