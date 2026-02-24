import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative flex min-h-[80vh] md:min-h-screen items-end justify-center overflow-hidden px-4 md:px-6 pb-12 md:pb-24">
          <div className="absolute inset-0">
            <Image
              src="/images/daikanyama-stylish-date-hero.png"
              alt="Tokyo date scene"
              fill
              className="object-cover scale-110 object-[35%_center] md:object-center"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center drop-shadow-lg">
            <p className="mb-2 md:mb-4 text-xs md:text-sm font-semibold tracking-widest text-[#c9a96e] uppercase [text-shadow:_0_1px_6px_rgba(0,0,0,0.6)]">
              {t.tagline}
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.8)]">
              Make your time
              <br />
              together more exciting
            </h1>
            <p className="mx-auto mt-4 md:mt-6 max-w-2xl text-sm md:text-lg leading-relaxed text-white/90 [text-shadow:_0_1px_8px_rgba(0,0,0,0.7)]">
              Discover Tokyo&apos;s best date spots through a cultural lens.
              <br className="hidden sm:block" />
              Curated neighborhood guides for the perfect date
            </p>
            <div className="mt-6 md:mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/plan"
                className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30"
              >
                Plan a Date
              </Link>
              <Link
                href="/en/features/omotesando-sophisticated-date"
                className="rounded-full border border-white/30 px-8 py-3.5 text-base font-semibold text-white/90 transition-colors hover:bg-white/10"
              >
                Explore Guides
              </Link>
            </div>
            <p className="mt-4 md:mt-6 text-xs text-white/60 [text-shadow:_0_1px_4px_rgba(0,0,0,0.5)]">
              Free to use · No registration required
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
            className="inline-block px-6 py-3 bg-[#c9485b] hover:bg-orange-600 text-white font-bold rounded-full transition-colors"
          >
            日本語版を見る
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
