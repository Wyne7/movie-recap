"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { MovieSummary, ServiceStatus } from "@/lib/types";
import { Clapperboard, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Genre = { id: number; name: string };

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || "The request failed.";
  } catch {
    return "The request failed.";
  }
}

export function SearchScreen() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");
  const [results, setResults] = useState<MovieSummary[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/status", { signal: controller.signal });
        if (!response.ok) return;
        setStatus((await response.json()) as ServiceStatus);
      } catch {
        if (!controller.signal.aborted) setStatus(null);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!status?.tmdb) return;
    const controller = new AbortController();
    async function loadGenres() {
      try {
        const response = await fetch("/api/genres", { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { genres: Genre[] };
        setGenres(data.genres);
      } catch {
        if (!controller.signal.aborted) setGenres([]);
      }
    }
    void loadGenres();
    return () => controller.abort();
  }, [status?.tmdb]);

  async function onSearch(event?: FormEvent) {
    event?.preventDefault();
    setSearching(true);
    setError(null);
    setMessage(null);
    try {
      const params = new URLSearchParams({ query });
      if (year.trim()) params.set("year", year.trim());
      if (genre) params.set("genre", genre);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as { results: MovieSummary[]; message: string | null };
      setResults(data.results);
      setMessage(data.message);
    } catch (caught) {
      setResults(null);
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:py-12">
      <section className="max-w-2xl">
        <p className="text-sm tracking-wide text-amber uppercase">Spoiler line</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-balance sm:text-5xl">
          Catch up without walking past the scene you stopped on.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Search a film, mark how far you got, and read a recap that stops there. Follow-up questions use the
          same line. If the sourced plot is thin, the note says so instead of inventing the rest.
        </p>
      </section>

      {status && !status.tmdb ? (
        <p className="max-w-2xl rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm leading-6" role="status">
          Live search needs <code className="text-amber">TMDB_API_KEY</code> in{" "}
          <code>.env.local</code>. Until then, open the sample film below. It uses a bundled plot so you can
          try the spoiler line with no keys.
        </p>
      ) : null}
      {status?.tmdb && !status.llm ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground" role="status">
          Recaps are direct extracts from the source. Add <code>OPENAI_API_KEY</code> if you want a shorter
          paraphrase. Either way, text past your spoiler line is not used.
        </p>
      ) : null}

      <form onSubmit={onSearch} className="grid gap-4 rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search TMDB by title"
            className="h-11"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="year">Year (optional)</Label>
            <Input
              id="year"
              inputMode="numeric"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="2010"
              className="h-11"
              disabled={!status?.tmdb}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="genre">Genre (optional)</Label>
            <select
              id="genre"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              disabled={!status?.tmdb || genres.length === 0}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <option value="">{status?.tmdb ? "Any genre" : "Needs a TMDB key"}</option>
              {genres.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            className="h-11 px-4"
            disabled={searching || !query.trim()}
            onClick={() => void onSearch()}
          >
            <Search />
            {searching ? "Searching TMDB…" : "Search"}
          </Button>
          <span className="text-sm text-muted-foreground">First page of results, adult titles excluded.</span>
        </div>
        {error ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {searching ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {results && results.length === 0 && !searching ? (
        <p className="text-sm text-muted-foreground">No titles matched that search.</p>
      ) : null}

      {results && results.length > 0 ? (
        <ul className="grid gap-3">
          {results.map((movie) => (
            <li key={movie.id}>
              <ResultCard movie={movie} />
            </li>
          ))}
        </ul>
      ) : null}

      <section className="grid gap-3 border-t border-border/80 pt-6">
        <div className="flex items-center gap-2">
          <Clapperboard className="size-4 text-amber" aria-hidden />
          <h2 className="font-display text-2xl">Try it without a key</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Glass Harbor is a fictional film with an original plot stored in this app. It is not a TMDB or
          Wikipedia record. Use it to see the spoiler line cut a story in half.
        </p>
        <Link
          href="/movie/sample"
          className="group grid max-w-2xl gap-2 rounded-2xl border border-border bg-card/80 p-4 transition hover:border-amber/50 sm:p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl">Glass Harbor</span>
            <Badge variant="outline">Fictional sample</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Night dispatcher Mara Voss notices a ferry crossing missing from the harbor log. The public
            overview stops there. The bundled plot goes further, and the slider decides how much of it you see.
          </p>
          <span className="text-sm text-amber">Open the sample</span>
        </Link>
      </section>
    </div>
  );
}

function ResultCard({ movie }: { movie: MovieSummary }) {
  return (
    <Card className="py-0 transition hover:ring-amber/40">
      <Link href={`/movie/${movie.id}`} className="flex gap-4 p-3 sm:p-4">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt=""
            width={80}
            height={120}
            className="h-28 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-center text-[11px] text-muted-foreground">
            No poster
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 className="font-display text-xl">{movie.title}</h2>
            {movie.year ? <span className="text-sm text-muted-foreground">{movie.year}</span> : null}
            {movie.voteAverage ? (
              <span className="text-sm text-muted-foreground">TMDB {movie.voteAverage}</span>
            ) : null}
          </div>
          {movie.genres.length > 0 ? (
            <p className="mt-1 text-xs tracking-wide text-amber/90 uppercase">{movie.genres.join(" · ")}</p>
          ) : null}
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {movie.overview || "No public overview on TMDB."}
          </p>
        </div>
      </Link>
    </Card>
  );
}
