import React, { useEffect, useMemo, useState } from "react";
import * as RSelect from "@radix-ui/react-select";

// -------------- 計算ロジック（純関数） --------------
export const computeE3 = (d3: string): number => (d3 === "🕐1h(1.5)" ? 1.5 : 3);
export const computeE4 = (d4: string): number => {
  const options = ["🕛0h(0)", "🕐1h(2)", "🕑2h(4)", "🕒3h(6)", "🕓4h(8)", "🕔5h(10)", "🕕6h(12)"] as const;
  const table = [0, 2, 4, 6, 8, 10, 12];
  const idx = options.indexOf(d4 as any);
  return idx >= 0 ? table[idx] : 0;
};
export const computeE5 = (d5: string): number => (d5 === "😍有り(5)" ? 5 : 0);
export const computeE6 = (d6: string): number => (d6 === "🤪有り(5)" ? 5 : 0);
export const computeE7 = (d7: string): number => (d7 === "🥰ゴム有り(5)" ? 5 : d7 === "🥰ゴム無し(10)" ? 10 : 0);

// -------------- テーマ & 永続化 --------------
type Theme = "emerald" | "blue" | "violet";
function getTheme(): Theme {
  const s = typeof window !== "undefined" ? localStorage.getItem("nm_theme") : null;
  if (s === "blue" || s === "violet") return s;
  return "emerald";
}
function setTheme(t: Theme) {
  if (typeof window !== "undefined") localStorage.setItem("nm_theme", t);
}

function color(t: Theme) {
  return t === "blue"
    ? { ring: "focus:ring-blue-300/70", text: "text-blue-700", total: "text-blue-700", btn: "border-blue-300" }
    : t === "violet"
    ? { ring: "focus:ring-violet-300/70", text: "text-violet-700", total: "text-violet-700", btn: "border-violet-300" }
    : { ring: "focus:ring-emerald-300/70", text: "text-emerald-700", total: "text-emerald-700", btn: "border-emerald-300" };
}

// -------------- PWA install prompt --------------
declare global { interface Window { deferredPrompt?: any } }
function useInstallPrompt() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const promptInstall = async () => {
    const p = window.deferredPrompt;
    if (!p) return;
    p.prompt();
    await p.userChoice;
    window.deferredPrompt = null;
    setReady(false);
  };
  return { ready, promptInstall };
}

// -------------- テスト --------------
function runTests() {
  const results: Array<[string, boolean]> = [];
  const t = (name: string, cond: boolean) => results.push([name, !!cond]);
  t("E3 1h→1.5", computeE3("🕐1h(1.5)") === 1.5);
  t("E3 2h→3", computeE3("🕑2h(3)") === 3);
  const e4Options = ["🕛0h(0)", "🕐1h(2)", "🕑2h(4)", "🕒3h(6)", "🕓4h(8)", "🕔5h(10)", "🕕6h(12)"] as const;
  const e4Table = [0, 2, 4, 6, 8, 10, 12];
  e4Options.forEach((opt, i) => t(`E4 ${opt}→${e4Table[i]}`, computeE4(opt) === e4Table[i]));
  t("E5 無し→0", computeE5("😔無し(0)") === 0);
  t("E5 有り→5", computeE5("😍有り(5)") === 5);
  t("E6 無し→0", computeE6("😊無し(0)") === 0);
  t("E6 有り→5", computeE6("🤪有り(5)") === 5);
  t("E7 😭無し→0", computeE7("😭無し(0)") === 0);
  t("E7 🥰ゴム有り→5", computeE7("🥰ゴム有り(5)") === 5);
  t("E7 🥰ゴム無し→10", computeE7("🥰ゴム無し(10)") === 10);
  t("E7 unknown→0", computeE7("(unknown)") === 0);
  const pass = results.every(([, ok]) => ok);
  const summary = `${results.filter(([, ok]) => ok).length}/${results.length} tests passed`;
  console[pass ? "log" : "error"]("[📜新メニュー表] tests:", summary, results);
}
if (typeof window !== "undefined" && import.meta?.env?.DEV) runTests();

// -------------- アプリ本体 --------------
export default function App() {
  const [d3, setD3] = useState<string>("🕐1h(1.5)");
  const [d4, setD4] = useState<string>("🕛0h(0)");
  const [d5, setD5] = useState<string>("😔無し(0)");
  const [d6, setD6] = useState<string>("😊無し(0)");
  const [d7, setD7] = useState<string>("😭無し(0)");
  // すべて初期値に戻す
  const resetAll = () => {
    setD3("🕐1h(1.5)");
    setD4("🕛0h(0)");
    setD5("😔無し(0)");
    setD6("😊無し(0)");
    setD7("😭無し(0)");
  };

  const [theme, setThemeState] = useState<Theme>(getTheme());
  const { ready, promptInstall } = useInstallPrompt();
  const handleInstallClick = () => {
    if (ready) {
      promptInstall();
    } else {
      alert("インストール準備ができていません。\nChrome: 右上メニュー→「アプリをインストール」\niPhone: Safari→共有→『ホーム画面に追加』");
    }
  };


  // パスコード簡易ロック
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [needLock, setNeedLock] = useState<boolean>(false);
  useEffect(() => {
    const saved = localStorage.getItem("nm_passcode");
    setNeedLock(!!saved);
    if (!saved) setUnlocked(true);
  }, []);
  const tryUnlock = (code: string) => {
    const expect = localStorage.getItem("nm_passcode");
    if (!expect || code === expect) setUnlocked(true);
  };

  // 計算
  const e3 = useMemo(() => computeE3(d3), [d3]);
  const e4 = useMemo(() => computeE4(d4), [d4]);
  const e5 = useMemo(() => computeE5(d5), [d5]);
  const e6 = useMemo(() => computeE6(d6), [d6]);
  const e7 = useMemo(() => computeE7(d7), [d7]);
  const total = useMemo(() => e3 + e4 + e5 + e6 + e7, [e3, e4, e5, e6, e7]);

  // フォントスケール（行だけ使う）
  const fsRow = "text-[clamp(16px,4.5vw,21px)]";
  const padY = "py-4";
  const c = color(theme);

  // 設定モーダル
  const [open, setOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");
  const saveTheme = (t: Theme) => { setTheme(t); setThemeState(t); };

  return (
    <div className="min-h-screen w-full bg-emerald-50 text-neutral-900">
      {/* ロック画面 */}
      {!unlocked && needLock && (
        <LockScreen onUnlock={tryUnlock} />
      )}

      {/* ヘッダー */}
      <div className="sticky top-0 z-20 backdrop-blur bg-neutral-50/80 border-b border-slate-200/80">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* 左：インストール（常時表示） */}
          <button
            onClick={handleInstallClick}
            className={`rounded-xl border px-3 py-1.5 text-sm ${c.btn}`}
            title="アプリをインストール"
          >
            インストール
          </button>
          {/* 中央：タイトル */}
          <div className="text-xl font-bold">📜新メニュー表</div>
          {/* 右：リセット */}
          <button
            onClick={resetAll}
            className={`rounded-xl border px-3 py-1.5 text-sm ${c.btn}`}
            title="下のメニューを初期値に戻す"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 本文 */}
      <div className="max-w-xl mx-auto px-4 pb-32 pt-4 space-y-4">
        <ListRow idx={0} title={<><span>🍵お茶</span><br/><span>🍽食事</span></>} fsRow={fsRow} padY={padY}>
          <Select value={d3} onChange={setD3} options={["🕐1h(1.5)","🕑2h(3)"]} ring={c.ring} />
        </ListRow>

        <ListRow idx={1} title="⏰時間延長" fsRow={fsRow} padY={padY}>
          <Select
            value={d4}
            onChange={setD4}
            options={["🕛0h(0)","🕐1h(2)","🕑2h(4)","🕒3h(6)","🕓4h(8)","🕔5h(10)","🕕6h(12)"]}
            ring={c.ring}
          />
        </ListRow>

        <ListRow idx={2} title={<><span>👗コスプレ</span><br/><span>📷撮影</span></>} fsRow={fsRow} padY={padY}>
          <Select value={d5} onChange={setD5} options={["😔無し(0)","😍有り(5)"]} ring={c.ring} />
        </ListRow>

        <ListRow idx={3} title="💊" fsRow={fsRow} padY={padY}>
          <Select value={d6} onChange={setD6} options={["😊無し(0)","🤪有り(5)"]} ring={c.ring} />
        </ListRow>

        <ListRow idx={4} title="🥰無し／有り" fsRow={fsRow} padY={padY}>
          <Select value={d7} onChange={setD7} options={["😭無し(0)","🥰ゴム有り(5)","🥰ゴム無し(10)"]} ring={c.ring} />
        </ListRow>
      </div>

      {/* 下部固定 合計バー */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[clamp(32px,7vw,56px)] font-extrabold text-slate-700">合計</span>
          <span className={`font-extrabold tabular-nums tracking-tight text-[clamp(32px,7vw,56px)] ${c.total}`}>
            {new Intl.NumberFormat('ja-JP').format(total)}
          </span>
        </div>
      </div>

      {/* 設定モーダル */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-[92vw] max-w-md rounded-2xl bg-white shadow-xl p-4 space-y-4">
            <div className="text-lg font-bold">設定</div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-slate-600 mb-1">テーマ色</div>
                <div className="flex gap-2">
                  {(["emerald","blue","violet"] as Theme[]).map(t => (
                    <button
                      key={t}
                      onClick={() => saveTheme(t)}
                      className={`rounded-xl border px-3 py-1.5 ${t===theme?"bg-slate-100":""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">パスコード</div>
                <div className="flex gap-2">
                  <input
                    value={codeDraft}
                    onChange={(e)=>setCodeDraft(e.target.value)}
                    placeholder="4〜8桁 推奨"
                    className={`flex-1 rounded-xl border px-3 py-2 outline-none ${c.ring}`}
                    type="password"
                    inputMode="numeric"
                  />
                  <button
                    onClick={()=>{
                      localStorage.setItem("nm_passcode", codeDraft);
                      setNeedLock(!!codeDraft);
                      setCodeDraft("");
                      alert("保存しました");
                    }}
                    className={`rounded-xl border px-3 py-2 ${c.btn}`}
                  >
                    保存
                  </button>
                  <button
                    onClick={()=>{
                      localStorage.removeItem("nm_passcode");
                      setNeedLock(false);
                      setUnlocked(true);
                      alert("ロックを解除しました");
                    }}
                    className="rounded-xl border px-3 py-2"
                  >
                    解除
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={()=>setOpen(false)}
                className="rounded-xl border px-3 py-1.5"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 区切り線
function Divider() { return <div className="h-px bg-slate-200 mx-2" />; }

// 行レイアウト（右端の値列を削除した簡素版）
function ListRow({
    idx, title, fsRow, padY, children,
  }: {
    idx: number; title: React.ReactNode; fsRow: string; padY: string; children: React.ReactNode;
  }) {
  const zebra = idx % 2 === 1 ? "bg-white" : "bg-neutral-50/60";
  return (
    <div className={`rounded-2xl ${zebra} border border-slate-200 px-4 ${padY} transition-colors`}>
      <div className="flex items-center gap-3">
        <div className={`flex-1 min-w-0 text-slate-800 font-semibold ${fsRow}`} >{title}</div>
        <div className="flex-[1.2] min-w-0">{children}</div>
      </div>
    </div>
  );
}

// セレクト

function Select({ value, onChange, options, ring }:
  { value: string; onChange: (v: string)=>void; options: string[]; ring: string }) {
  return (
    <RSelect.Root value={value} onValueChange={onChange}>
      <RSelect.Trigger
        className={`w-full rounded-2xl border border-slate-300 px-3 py-2 text-base sm:text-lg bg-white outline-none focus:ring-4 ${ring} flex items-center justify-between`}
        aria-label="メニューを選択"
      >
        <RSelect.Value />
        <RSelect.Icon aria-hidden className="ml-2">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={8}
          className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg w-[var(--radix-select-trigger-width)]"
        >
          <RSelect.ScrollUpButton className="flex items-center justify-center p-2 text-slate-500">
            ▲
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="p-1 max-h-[min(50vh,var(--radix-select-content-available-height))] w-full">
            {options.map((opt) => (
              <RSelect.Item
                key={opt}
                value={opt}
                className="relative select-none rounded-lg px-3 py-2 cursor-pointer outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-slate-100 data-[state=checked]:font-semibold"
              >
                <RSelect.ItemText>{opt}</RSelect.ItemText>
                <RSelect.ItemIndicator className="absolute right-2 top-1/2 -translate-y-1/2">
                  ✓
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
          <RSelect.ScrollDownButton className="flex items-center justify-center p-2 text-slate-500">
            ▼
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}


// ロック画面
function LockScreen({ onUnlock }: { onUnlock: (code: string)=>void }) {
  const [code, setCode] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80">
      <div className="w-[92vw] max-w-sm rounded-2xl bg-white p-6 text-center space-y-4">
        <div className="text-xl font-bold">🔒 ロック中</div>
        <input
          value={code}
          onChange={(e)=>setCode(e.target.value)}
          placeholder="パスコードを入力"
          className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-300/70"
          type="password"
          inputMode="numeric"
        />
        <button
          onClick={()=>onUnlock(code)}
          className="w-full rounded-xl border px-3 py-2"
        >
          解除
        </button>
        <div className="text-xs text-slate-500">※ 設定→パスコードで登録できます</div>
      </div>
    </div>
  );
}