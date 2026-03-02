import Link from "next/link";
import { getCurrentWeeklyPicks, getWeekRangeLabel, getWeeklyPicksForCity } from "@/lib/weekly-picks";
import type { WeeklyPick } from "@/lib/weekly-picks";
import { getCityById } from "@/lib/cities";

const moodColors: Record<string, string> = {
  romantic: "bg-rose/10 text-rose",
  fun: "bg-accent/10 text-accent",
  relaxed: "bg-primary-light/10 text-primary-light",
  luxurious: "bg-accent/10 text-accent",
  adventurous: "bg-rose/10 text-rose",
};

const timeOfDayLabels: Record<string, string> = {
  daytime: "昼デート",
  evening: "夜デート",
  allday: "終日OK",
};

function PickCard({ pick }: { pick: WeeklyPick }) {
  const city = getCityById(pick.cityId);
  const href = pick.featureSlug
    ? `/features/${pick.featureSlug}`
    : `/plan?city=${pick.cityId}&area=${encodeURIComponent(pick.area)}`;
  const colorClass = moodColors[pick.mood] || "bg-surface-alt text-muted";

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        {city && (
          <span className="text-xs font-medium text-muted bg-surface-alt px-2 py-0.5 rounded-full">
            {city.name}
          </span>
        )}
        <span className="text-xs font-medium text-muted bg-surface-alt px-2 py-0.5 rounded-full">
          {pick.area}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {timeOfDayLabels[pick.timeOfDay] || pick.timeOfDay}
        </span>
      </div>
      <h3 className="text-base font-bold group-hover:text-primary transition-colors leading-snug">
        {pick.title}
      </h3>
      <p className="mt-1.5 text-sm text-muted line-clamp-2">
        {pick.subtitle}
      </p>
      <div className="mt-auto pt-3 flex items-center justify-between">
        {pick.featureSlug ? (
          <span className="text-xs text-primary">特集あり</span>
        ) : (
          <span className="text-xs text-muted">AIプラン作成</span>
        )}
        <span className="text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
    </Link>
  );
}

/**
 * 今週のおすすめデートプラン（全都市版 — トップページ用）
 */
export function WeeklyPicks() {
  const weeklySet = getCurrentWeeklyPicks();
  const weekRange = getWeekRangeLabel();

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
            Weekly Picks
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            {weeklySet.themeEmoji} 今週のおすすめデートプラン
          </h2>
          <p className="mx-auto mt-2 text-sm text-muted">
            {weekRange}｜{weeklySet.theme}
          </p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted">
            {weeklySet.description}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {weeklySet.picks.map((pick) => (
            <PickCard key={`${pick.cityId}-${pick.area}`} pick={pick} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 今週のおすすめデートプラン（都市別フィルタ版 — 都市LP用）
 */
export function WeeklyPicksForCity({ cityId }: { cityId: string }) {
  const weeklySet = getCurrentWeeklyPicks();
  const weekRange = getWeekRangeLabel();
  const cityPicks = getWeeklyPicksForCity(cityId);
  const city = getCityById(cityId);

  if (cityPicks.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
            Weekly Picks
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">
            {weeklySet.themeEmoji} {city?.name ?? ""}の今週のおすすめ
          </h2>
          <p className="mt-2 text-sm text-muted">
            {weekRange}｜{weeklySet.theme}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cityPicks.map((pick) => (
            <PickCard key={`${pick.cityId}-${pick.area}`} pick={pick} />
          ))}
        </div>
      </div>
    </section>
  );
}
