import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFeatureBySlug, getAllFeatures } from "@/lib/features";
import { featureTranslations, siteUrl, uiTranslations } from "@/lib/i18n";
import FeatureSpotEmbed from "@/components/FeatureSpotEmbed";
import Header from "@/components/Header";

const t = uiTranslations.en;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const features = await getAllFeatures();
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  const en = featureTranslations[slug];
  if (!feature || !en) return { title: "Feature Not Found | futatabito" };

  const pageUrl = `${siteUrl}/en/features/${slug}`;
  const jaPageUrl = `${siteUrl}/features/${slug}`;
  const title = `${en.title} | futatabito`;
  const description = en.description;
  const imageUrl = feature.heroImage
    ? `${siteUrl}${feature.heroImage}`
    : `${siteUrl}/images/omotesando-date-hero.png`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        ja: jaPageUrl,
        en: pageUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "futatabito",
      locale: "en_US",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1370,
          height: 896,
          alt: en.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function EnglishFeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  const en = featureTranslations[slug];
  if (!feature || !en) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: en.title,
    description: en.description,
    image: feature.heroImage ? `${siteUrl}${feature.heroImage}` : undefined,
    url: `${siteUrl}/en/features/${slug}`,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
    },
    datePublished: feature.publishedAt,
    dateModified: feature.updatedAt,
    about: {
      "@type": "Place",
      name: en.area,
      address: {
        "@type": "PostalAddress",
        addressLocality: en.area,
        addressRegion: "Tokyo",
        addressCountry: "JP",
      },
    },
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Hero */}
        <section className="relative py-16 px-4 pt-24">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 to-transparent" />
          <div className="relative max-w-3xl mx-auto text-center">
            <Link
              href="/en"
              className="inline-block text-sm text-gray-400 hover:text-orange-400 mb-6 transition-colors"
            >
              {t.backToFeatures}
            </Link>
            {feature.heroImage && (
              <div className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-4">
                <img
                  src={feature.heroImage}
                  alt={en.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <span className="text-xs text-orange-400 font-medium uppercase tracking-wider">
              {en.area}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
              {en.title}
            </h1>
            <p className="text-lg text-gray-300 mb-2">
              {en.subtitle}
            </p>
            <p className="text-gray-400">
              {en.description}
            </p>
          </div>
        </section>

        {/* Spots */}
        <section className="mx-auto max-w-3xl px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6">
            Recommended {t.spots}
          </h2>
          <div className="space-y-8">
            {feature.spots.map((spot, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{"📍"}</span>
                  <div>
                    <h3 className="text-xl font-bold">{spot.name}</h3>
                    <p className="text-sm text-gray-400">{spot.genre}</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{spot.description}</p>
                {spot.embeds && spot.embeds.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {spot.embeds.map((embed, j) => (
                      <FeatureSpotEmbed key={j} embed={embed} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Language Switch */}
        <section className="py-8 text-center border-t border-gray-800">
          <p className="text-gray-400 mb-3">
            Read this guide in Japanese
          </p>
          <Link
            href={`/features/${slug}`}
            className="inline-block px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors text-sm"
          >
            日本語版を読む
          </Link>
        </section>
      </main>
    </>
  );
}
