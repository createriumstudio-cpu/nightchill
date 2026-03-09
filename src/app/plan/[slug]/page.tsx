import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlanBySlug } from "@/lib/plans";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlanDetailClient from "./PlanDetailClient";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

export const revalidate = false;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const saved = await getPlanBySlug(slug);
  if (!saved) return { title: "プランが見つかりません" };

  const pageUrl = `${siteUrl}/plan/${slug}`;
  const spotCount = saved.plan.timeline.filter((t) => t.venue).length;
  const ogParams: Record<string, string> = {
    title: saved.title,
    type: "plan",
  };
  if (saved.plan.summary) {
    ogParams.subtitle = saved.plan.summary.slice(0, 60);
  }
  if (saved.city) {
    ogParams.area = saved.city;
  }
  if (spotCount > 0) {
    ogParams.spots = String(spotCount);
  }
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams(ogParams).toString()}`;

  const description = saved.plan.summary || `${saved.title} - AIが提案するデートプラン`;

  return {
    title: saved.title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: saved.title,
      description,
      url: pageUrl,
      siteName: "futatabito",
      locale: "ja_JP",
      type: "article",
      publishedTime: saved.createdAt.toISOString(),
      authors: ["futatabito"],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: saved.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: saved.title,
      description,
      images: [ogImageUrl],
      site: "@nightchill_date",
    },
  };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const saved = await getPlanBySlug(slug);
  if (!saved) notFound();

  const pageUrl = `${siteUrl}/plan/${slug}`;
  const spotCount = saved.plan.timeline.filter((t) => t.venue).length;
  const ogParams: Record<string, string> = {
    title: saved.title,
    type: "plan",
  };
  if (saved.city) {
    ogParams.area = saved.city;
  }
  if (spotCount > 0) {
    ogParams.spots = String(spotCount);
  }
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams(ogParams).toString()}`;

  // JSON-LD: TravelAction (デートプランにより適した型)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: saved.title,
    description: saved.plan.summary,
    image: ogImageUrl,
    url: pageUrl,
    inLanguage: "ja",
    datePublished: saved.createdAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    ...(saved.plan.venues && saved.plan.venues.length > 0
      ? {
          about: saved.plan.venues.slice(0, 5).map((v) => ({
            "@type": "Place",
            name: v.name,
            address: v.address,
            ...(v.rating !== null ? { aggregateRating: { "@type": "AggregateRating", ratingValue: v.rating } } : {}),
            ...(v.googleMapsUrl ? { hasMap: v.googleMapsUrl } : {}),
          })),
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "プラン作成",
        item: `${siteUrl}/plan`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: saved.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Header />
      <PlanDetailClient plan={saved.plan} slug={slug} city={saved.city} location={saved.location} />
      <Footer />
    </>
  );
}
