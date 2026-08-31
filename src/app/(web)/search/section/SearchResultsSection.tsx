"use client";

import Link from "next/link";
import { Button, Card, Empty } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import type { BlogPost } from "@/models";
import { formatDate } from "@/utils/format";

export function SearchResultsSection({
  results,
  query,
  dateQuery,
}: {
  results: BlogPost[];
  query: string;
  dateQuery: string;
}) {
  const { t, locale } = useT();

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("articles.searchResults", {
          keyword: query || (dateQuery ? formatDate(`${dateQuery}-01`, locale) : "-"),
        })}
      </h1>
      <div className="mt-6 space-y-6">
        {results.length === 0 ? (
          <Card>
            <p>{t("articles.notFound")}</p>
          </Card>
        ) : (
          results.map((post) => (
            <Card key={post.id} hoverable cover={
              post.filename ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={post.title} src={post.filename} className="h-56 w-full object-cover" />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} className="grid! h-56! place-items-center!" />
              )
            }>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="mt-1 text-xs text-foreground/50">
                {t("articles.postedBy", {
                  date: formatDate(post.datetime, locale, true),
                  author: post.adminName ?? "-",
                })}
              </p>
              <div
                className="mt-3 text-foreground/75 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: post.paraHeader }}
              />
              <Link href={`/blog/${post.id}`} className="inline-block! mt-4!">
                <Button type="link" className="px-0!">
                  {t("common.readMore")}
                </Button>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
