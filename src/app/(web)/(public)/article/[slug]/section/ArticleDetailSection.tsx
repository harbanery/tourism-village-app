"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, Empty } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatDate } from "@/utils/helpers";
import { displayImage } from "@/utils/helpers";
import type { WebBlogDetail } from "@/services/blog";

export function ArticleDetailSection({ post }: { post: WebBlogDetail | null }) {
  const { t, locale } = useT();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Button
        icon={<ArrowLeftOutlined />}
        className="mb-4!"
        onClick={() => router.push("/article")}
      >
        {t("articles.title")}
      </Button>
      {post ? (
        <Card
          cover={
            post.filename ? (
              // LCP halaman detail — priority agar cover dimuat lebih
              // awal (rekomendasi 1.1); Cloudinary f_auto,q_auto,w_960.
              (() => {
                const { src, unoptimized } = displayImage(post.filename, 960);
                return (
                  <Image
                    src={src}
                    alt={post.title}
                    width={960}
                    height={540}
                    priority
                    unoptimized={unoptimized}
                    sizes="(max-width: 896px) 100vw, 896px"
                    className="max-h-96 min-h-48 w-full object-cover"
                  />
                );
              })()
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={false}
                className="grid! max-h-96! min-h-48! place-items-center!"
              />
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
              ? ` · ${t("admin.blog.dateChanged")}: ${formatDate(
                  post.datetimeAfter,
                  locale,
                  true,
                )}`
              : ""}
          </p>
          <div
            className="mt-6 space-y-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.para }}
          />
        </Card>
      ) : (
        <Card>
          <p>{t("articles.notFound")}</p>
        </Card>
      )}
    </div>
  );
}
