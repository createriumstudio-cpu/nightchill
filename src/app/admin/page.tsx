import { redirect } from "next/navigation";
import { isAuthenticated, isAdminEnabled } from "@/lib/admin-auth";
import { getAllFeatures } from "@/lib/features";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminDashboard() {
  if (!isAdminEnabled()) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">管理画面は無効です</h1>
          <p className="text-zinc-400">
            ADMIN_PASSWORD 環境変数を設定してください。
          </p>
        </div>
      </div>
    );
  }

  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  const features = await getAllFeatures();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">futatabito 管理画面</h1>
            <p className="text-sm text-zinc-400">特集記事・スポット管理</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              サイトを見る
            </Link>
            <Link
              href="/admin/features/new"
              className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors"
            >
              + 新規特集
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-6">
          特集記事一覧（{features.length}件）
        </h2>

        {features.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-4">まだ特集記事がありません</p>
            <Link
              href="/admin/features/new"
              className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
            >
              最初の特集を作成する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {features.map((feature) => (
              <div
                key={feature.slug}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{feature.heroEmoji}</span>
                    <h3 className="font-semibold text-white truncate">
                      {feature.title}
                    </h3>
                    <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                      {feature.area}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    {feature.subtitle}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                    <span>slug: {feature.slug}</span>
                    <span>スポット: {feature.spots.length}件</span>
                    <span>更新: {feature.updatedAt}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/features/${feature.slug}`}
                    className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                    target="_blank"
                  >
                    プレビュー
                  </Link>
                  <Link
                    href={`/admin/features/${feature.slug}/edit`}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                  >
                    編集
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
