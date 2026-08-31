"use client";

import Link from "next/link";
import { Button, Card, Empty } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import type { BlogPost } from "@/models";
import { formatDate } from "@/utils/format";

export function BlogDetailSection({ post }: { post: BlogPost | null }) {
  const { t, locale } = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/article" className="inline-block! mb-4!">
        <Button icon={<ArrowLeftOutlined />}>{t("articles.title")}</Button>
      </Link>
      {post ? (
        <Card
          cover={
            post.filename ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={post.title} src={post.filename} className="max-h-96 w-full object-cover" />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} className="grid! max-h-96! min-h-48! place-items-center!" />
            )
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
