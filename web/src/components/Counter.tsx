import { createSignal } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button
      class="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-sky-100 shadow-glow transition hover:border-sky-400 hover:text-sky-50 hover:shadow-lg hover:shadow-sky-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      onClick={() => setCount(count() + 1)}
      type="button"
    >
      <span>Clicks</span>
      <span class="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-mono tabular-nums text-sky-200">
        {count()}
      </span>
    </button>
  );
}
