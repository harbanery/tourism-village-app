"use client";

import Link from "next/link";
import { Button, Card, Col, Rate, Row } from "antd";
import { ArrowRightOutlined, EnvironmentOutlined, PlayCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import {
  dummyPackages,
  dummyPlaces,
  dummySponsors,
  dummyTestimonials,
} from "@/models";
import { formatRupiah } from "@/utils/format";

export default function HomePage() {
  const { t } = useT();
  const activePlaces = dummyPlaces.filter((p) => p.active === "yes");
  const activeTestimonials = dummyTestimonials.filter((r) => r.active === "yes");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://picsum.photos/seed/hero-village/1600/700)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-28 md:py-40 text-white">
          <h1 className="text-3xl md:text-5xl font-bold max-w-2xl leading-tight">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 max-w-xl text-white/85 md:text-lg">{t("home.hero.subtitle")}</p>
          <Link href="/paket-detail">
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} className="mt-8">
              {t("home.hero.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Wisata Populer */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">{t("home.popular.title")}</h2>
        <p className="mt-1 text-foreground/60">{t("home.popular.subtitle")}</p>
        <Row gutter={[16, 16]} className="mt-6">
          {activePlaces.map((place) => (
            <Col xs={24} sm={12} md={8} key={place.id}>
              <Card
                hoverable
                cover={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={place.name}
                    src={place.photo ?? ""}
                    className="h-48 w-full object-cover"
                  />
                }
              >
                <Card.Meta
                  avatar={<EnvironmentOutlined className="text-xl text-[#0d7a5f]" />}
                  title={place.name}
                  description="Bogor, Jawa Barat"
                />
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Mengapa */}
      <section className="bg-white dark:bg-[#141416] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold">{t("home.why.title")}</h2>
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24} md={12}>
              <Card>
                <h3 className="font-semibold text-lg">{t("home.why.facility.title")}</h3>
                <p className="mt-2 text-foreground/70">{t("home.why.facility.desc")}</p>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card>
                <h3 className="font-semibold text-lg">{t("home.why.service.title")}</h3>
                <p className="mt-2 text-foreground/70">{t("home.why.service.desc")}</p>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Paket Wisata */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">{t("home.packages.title")}</h2>
        <p className="mt-1 text-foreground/60">{t("home.packages.subtitle")}</p>
        <Row gutter={[16, 16]} className="mt-6">
          {dummyPackages.map((pkg) => (
            <Col xs={24} sm={12} md={8} key={pkg.id}>
              <Card
                title={pkg.name}
                extra={<span className="text-foreground/60 text-sm">{pkg.placeName}</span>}
              >
                <div className="text-3xl font-bold text-[#0d7a5f]">
                  {formatRupiah(pkg.price)}
                  <span className="text-sm font-normal text-foreground/60">
                    {t("common.perPerson")}
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {pkg.facilities.filter(Boolean).map((f) => (
                    <li key={f} className="text-sm text-foreground/80">
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                <Link href="/paket-detail">
                  <Button type="primary" block className="mt-6">
                    {t("home.packages.cta")}
                  </Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Testimoni */}
      <section className="bg-white dark:bg-[#141416] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold">{t("home.testimonials.title")}</h2>
          <p className="mt-1 text-foreground/60">{t("home.testimonials.subtitle")}</p>
          <Row gutter={[16, 16]} className="mt-6">
            {activeTestimonials.map((review) => (
              <Col xs={24} md={8} key={review.id}>
                <Card>
                  <Rate disabled defaultValue={review.rating} />
                  <p className="mt-3 text-foreground/80">&ldquo;{review.comment}&rdquo;</p>
                  <p className="mt-4 font-medium">— {review.userName}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Sponsor */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">{t("home.sponsors.title")}</h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
          {dummySponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#141416] p-4 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.filename}
                alt={sponsor.name}
                className="mx-auto h-10 object-contain grayscale opacity-70"
              />
              <p className="mt-2 text-xs font-medium">{sponsor.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video */}
      <section className="bg-white dark:bg-[#141416] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold">{t("home.video.title")}</h2>
          <p className="mt-1 text-foreground/60">{t("home.video.subtitle")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/goiL7aOMsjg"
                title={t("home.video.title")}
                allowFullScreen
              />
            </div>
            <div className="flex flex-col justify-center">
              <PlayCircleFilled className="text-4xl text-[#0d7a5f]" />
              <p className="mt-4 text-foreground/70">{t("home.video.subtitle")}</p>
              <Link href="/vlog">
                <Button className="mt-4 self-start">{t("common.viewAll")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
