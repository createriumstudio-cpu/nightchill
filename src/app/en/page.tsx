import { Metadata } from "next";
import Link from "next/link";
import { getAllFeatures } from "@/lib/features";
import { featureTranslations, siteUrl, uiTranslations } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const t = uiTranslations.en;

export const metadata: Metadata = {
  title: "futatabito - Tokyo Date Culture Guide",
  description:
    "Discover Tokyo's best date spots through a cultural lens. Curated guides for Omotesando, Ginza, Ebisu, Roppongi, Nakameguro, Daikanyama, and Shimokitazawa.",
  alternates: {
    canonical: `${siteUrl}/en`,
    languages: {
      ja: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
  openGraph: {
    title: "futatabito - Tokyo Date Culture Guide",
    description:
      "Discover Tokyo's best date spots through a cultural lens. Curated neighborhood guides for couples visiting Tokyo.",
    url: `${siteUrl}/en`,
    siteName: "futatabito",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "futatabito - Tokyo Date Culture Guide",
    description:
      "Discover Tokyo's best date spots through a cultural lens.",
  },
};

export default async function EnglishHomePage() {
  const features = await getAllFeatures();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Hero */}
        <section className="relative py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t.siteName}
            </h1>
            <p className="text-xl md:text-2xl text-orange-400 mb-2">
              {t.tagline}
            </p>
            <p className="text-lg text-gray-400 mb-8">
              {t.catchphrase}
            </p>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Your curated guide to Tokyo&apos;s most exciting neighborhoods for
              date planning. From sophisticated Ginza evenings to creative
              Shimokitazawa adventures, discover the perfect date spot with
              insider tips from locals.
            </p>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Tokyo Date Spot Guides
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature) => {
              const en = featureTranslations[feature.slug];
              if (!en) return null;
              return (
                <Link
                  key={feature.slug}
                  href={`/en/features/${feature.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-colors"
                >
                  {feature.heroImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={feature.heroImage}
                        alt={en.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="text-xs text-orange-400 font-medium uppercase tracking-wider">
                      {en.area}
                    </span>
                    <h3 className="text-lg font-bold mt-1 mb-2 group-hover:text-orange-400 transition-colors">
                      {en.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {en.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 text-center bg-gray-900">
          <p className="text-gray-400 mb-4">
            Also available in Japanese
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors"
          >
            日本語版を見る
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
