import { MetaProvider, Title } from "@solidjs/meta";
import { A, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./root.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Agents Web</Title>
          <div class="min-h-screen bg-slate-950 text-slate-100">
            <div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
              <header class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="text-xs uppercase tracking-[0.3em] text-sky-400">
                    SolidStart + Tailwind
                  </p>
                  <h1 class="text-3xl font-semibold md:text-4xl">Agents Playground</h1>
                  <p class="mt-2 text-sm text-slate-300">
                    Bootstrapped starter for experimenting with agent-driven workflows.
                  </p>
                </div>
                <nav class="flex gap-4 text-sm font-medium text-slate-300">
                  <A
                    class="rounded-md px-3 py-2 transition hover:bg-sky-600/10 hover:text-sky-300"
                    activeClass="bg-sky-600/20 text-sky-200"
                    href="/"
                    end
                  >
                    Home
                  </A>
                  <A
                    class="rounded-md px-3 py-2 transition hover:bg-sky-600/10 hover:text-sky-300"
                    activeClass="bg-sky-600/20 text-sky-200"
                    href="/about"
                  >
                    About
                  </A>
                </nav>
              </header>
              <main class="mt-10 flex-1">
                <Suspense>{props.children}</Suspense>
              </main>
              <footer class="mt-16 border-t border-slate-800 pt-6 text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Agents. MIT Licensed.
              </footer>
            </div>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
