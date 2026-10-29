import type React from "react";
import { useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CircleHelp,
  CircleX,
  ExternalLink,
  Loader2,
  Mail,
  Search,
} from "lucide-react";

type RegistrationStatus = "detected" | "not_detected" | "unknown";

type SiteResult = {
  site: string;
  status: RegistrationStatus;
  url: string | null;
  note: string | null;
};

type LookupResponse = {
  email: string;
  results: SiteResult[];
  meta: {
    checked: number;
    detected: number;
    unknown: number;
  };
};

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  detected: "Registration detected",
  not_detected: "No registration detected",
  unknown: "Check unavailable",
};

const STATUS_STYLE: Record<RegistrationStatus, string> = {
  detected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  not_detected: "border-neutral-200 bg-neutral-50 text-neutral-600",
  unknown: "border-amber-200 bg-amber-50 text-amber-700",
};

function StatusIcon({ status }: { status: RegistrationStatus }) {
  if (status === "detected") {
    return <BadgeCheck aria-hidden="true" className="h-4 w-4" />;
  }
  if (status === "not_detected") {
    return <CircleX aria-hidden="true" className="h-4 w-4" />;
  }
  return <CircleHelp aria-hidden="true" className="h-4 w-4" />;
}

export default function App() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/search/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setResult((await response.json()) as LookupResponse);
    } catch (requestError) {
      console.error(requestError);
      setError("Could not complete the check. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-12 pt-12 sm:pt-20">
        <header className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-sm bg-neutral-900 text-[11px] font-semibold text-neutral-50">
              h
            </span>
            <span className="text-[13px] font-semibold tracking-tight">
              hereyouare
            </span>
          </div>

          <h1 className="mt-8 text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
            Check registration signals
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Check whether an email appears to be registered on Instagram,
            TikTok, Facebook, or YouTube.
          </p>
        </header>

        <section className="mx-auto mt-8 w-full max-w-xl overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:p-5"
          >
            <div className="relative flex-1">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              />
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                className="h-11 w-full rounded-sm border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Checking
                </>
              ) : (
                <>
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Check email
                </>
              )}
            </button>
          </form>
        </section>

        <p className="mx-auto mt-4 flex w-full max-w-xl items-start gap-2 text-xs leading-relaxed text-neutral-500">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          Checks contact the listed platforms. Use only an email address you
          are authorized to check. A missing result does not prove that no
          account exists.
        </p>

        {(loading || error || result) && (
          <section
            aria-live="polite"
            className="mx-auto mt-6 w-full max-w-xl overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                {loading ? "Checking platforms" : error ? "Check failed" : "Results"}
              </h2>
              {result && (
                <span className="text-xs text-neutral-500">
                  {result.meta.detected} detected
                </span>
              )}
            </div>

            {error && (
              <p role="alert" className="p-5 text-sm text-red-700">
                {error}
              </p>
            )}

            {loading && (
              <p className="p-5 text-sm text-neutral-500">
                Waiting for platform responses...
              </p>
            )}

            {result && (
              <ul className="divide-y divide-neutral-100">
                {result.results.map((site) => (
                  <li
                    key={site.site}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{site.site}</p>
                      {site.note && (
                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                          {site.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-medium ${STATUS_STYLE[site.status]}`}
                      >
                        <StatusIcon status={site.status} />
                        {STATUS_LABEL[site.status]}
                      </span>
                      {site.url && (
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${site.site}`}
                          className="text-neutral-400 hover:text-neutral-900"
                        >
                          <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
