import type React from "react";
import { useState } from "react";
import {
  AlertCircle,
  AtSign,
  ExternalLink,
  Loader2,
  Mail,
  Search,
} from "lucide-react";

type Website = {
  website: string;
  url: string | null;
};

type LookupMeta = {
  checked: number;
  found: number;
  errors: number;
  skipped: number;
};

type LookupResponse = {
  email: string | null;
  username: string | null;
  results: Website[];
  meta: LookupMeta;
};

export default function App() {
  const [mode, setMode] = useState<"email" | "username">("email");
  const [query, setQuery] = useState("");
  const [websites, setWebsites] = useState<Website[] | null>(null);
  const [meta, setMeta] = useState<LookupMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const url =
      mode === "email"
        ? "http://127.0.0.1:8000/search/email"
        : "http://127.0.0.1:8000/search/username";

    setLoading(true);
    setError("");
    setWebsites(null);
    setMeta(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "email" ? { email: query } : { username: query },
        ),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as LookupResponse;

      setWebsites(data.results);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
      setError("Could not complete the search. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (next: "email" | "username") => {
    setMode(next);
    setQuery("");
    setWebsites(null);
    setMeta(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-8 pt-12 sm:pt-20">
        <header className="mx-auto w-full max-w-lg">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-sm bg-neutral-900 text-[11px] font-semibold text-neutral-50">
              h
            </span>
            <span className="text-[13px] font-semibold tracking-tight">hereyouare</span>
          </div>

          <h1 className="mt-8 text-[26px] font-semibold leading-tight tracking-tight sm:text-[28px]">
            Find where you exist online.
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
            Search public platforms by email address or username to see where an account is
            registered.
          </p>
        </header>

        <main className="mt-8">
          <div className="mx-auto w-full max-w-lg overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
            <div className="space-y-4 p-4 sm:p-5">
              <div
                role="group"
                aria-label="Search mode"
                className="grid grid-cols-2 gap-1 rounded-sm border border-neutral-200 bg-neutral-100 p-1"
              >
                <button
                  type="button"
                  onClick={() => changeMode("email")}
                  disabled={loading}
                  aria-pressed={mode === "email"}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode === "email"
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => changeMode("username")}
                  disabled={loading}
                  aria-pressed={mode === "username"}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode === "username"
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <AtSign className="h-3.5 w-3.5" />
                  Username
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <label htmlFor="query" className="sr-only">
                    {mode === "email" ? "Email address" : "Username"}
                  </label>
                  <input
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={mode === "email" ? "you@example.com" : "yourhandle"}
                    type={mode === "email" ? "email" : "text"}
                    required
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-11 w-full rounded-sm border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </form>
            </div>
          </div>

          {(loading || error || websites !== null) && (
            <section
              aria-live="polite"
              className="mx-auto mt-6 w-full overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 bg-neutral-50 px-4 py-2.5 sm:px-5">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                  {loading ? "Searching" : error ? "Error" : "Results"}
                </span>
                {!loading && !error && websites !== null && (
                  <span className="text-xs text-neutral-500">
                    {meta?.found ?? websites.length} found
                  </span>
                )}
              </div>

              {!loading && !error && meta && (
                <dl
                  aria-label="Lookup summary"
                  className="grid grid-cols-4 divide-x divide-neutral-100 border-b border-neutral-200 bg-neutral-50"
                >
                  {[
                    { label: "Checked", value: meta.checked },
                    { label: "Found", value: meta.found },
                    { label: "Errors", value: meta.errors },
                    { label: "Skipped", value: meta.skipped },
                  ].map((stat) => (
                    <div key={stat.label} className="px-2 py-2.5 text-center sm:px-3">
                      <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                        {stat.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-700">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {loading && (
                <div className="flex items-center gap-2.5 px-4 py-5 text-sm text-neutral-500 sm:px-5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking public sources…
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-4 sm:px-5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <p className="text-sm leading-relaxed text-neutral-500">
                    <span className="font-medium text-neutral-900">Search failed.</span> {error}
                  </p>
                </div>
              )}

              {!loading && !error && websites?.length === 0 && (
                <div className="px-4 py-14 text-center sm:px-5">
                  <div className="mx-auto grid h-9 w-9 place-items-center rounded-sm border border-neutral-200 bg-neutral-50 text-neutral-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-medium">No profiles found</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                    Nothing matched “{query}”. Try a different {mode}.
                  </p>
                </div>
              )}

              {!loading && !error && websites && websites.length > 0 && (
                <ul className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 sm:p-4 md:grid-cols-3 lg:grid-cols-4">
                  {websites.map((w, index) => (
                    <li key={`${w.website}-${index}`}>
                      <a
                        href={w.url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full flex-col justify-between gap-4 rounded-sm border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-600">
                            {w.website.charAt(0).toUpperCase()}
                          </span>
                          {w.url && (
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300 group-hover:text-neutral-500" />
                          )}
                        </span>
                        <span className="block min-w-0">
                          <span className="block truncate text-sm font-medium text-neutral-800">
                            {w.website}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-neutral-400">
                            {w.url
                              ? new URL(w.url).hostname.replace(/^www\./, "")
                              : "No profile link"}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>

        <footer className="mx-auto mt-auto w-full max-w-lg pt-10">
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Results are gathered from public sources and may be incomplete.
          </p>
        </footer>
      </div>
    </div>
  );
}
