"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100">
      <p className="text-zinc-500">地図を読み込み中...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <h1 className="text-lg font-bold">Stamped Map</h1>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r bg-white p-4 overflow-y-auto">
          <p className="text-zinc-400 text-sm">
            スポット一覧（実装予定）
          </p>
        </aside>
        <div className="flex-1">
          <MapView />
        </div>
      </main>
    </div>
  );
}
