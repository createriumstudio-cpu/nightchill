import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlanBySlug } from "@/lib/plans";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlanDetailClient from "./PlanDetailClient";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill-sr5g.vercel.app";

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
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams({
    title: saved.title,
    subtitle: saved.plan.summary.slice(0, 60),
  }).toString()}`;

  return {
    title: saved.title,
    description: saved.plan.summary,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: saved.title,
      description: saved.plan.summary,
      url: pageUrl,
      siteName: "futatabito",
      locale: "ja_JP",
      type: "article",
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
      description: saved.plan.summary,
      images: [ogImageUrl],
    },
  };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const saved = await getPlanBySlug(slug);
  if (!saved) notFound();

  const pageUrl = `${siteUrl}/plan/${slug}`;
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams({
    title: saved.title,
  }).toString()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: saved.title,
    description: saved.plan.summary,
    image: ogImageUrl,
    url: pageUrl,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
    },
    datePublished: saved.createdAt.toISOString(),
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
      <PlanDetailClient plan={saved.plan} slug={slug} />
      <Footer />
    </>
  );
}
