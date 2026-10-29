"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { AskResponse, Moment, PublicMovie, RecapLength, RecapResponse, RecapType } from "@/lib/types";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const PRESETS = [
  { label: "Not started", value: 0 },
  { label: "Act I", value: 25 },
  { label: "Halfway", value: 50 },
  { label: "Late", value: 75 },
  { label: "Finished", value: 100 },
];

const TYPES: { id: RecapType; title: string; detail: string }[] = [
  {
    id: "spoiler-free",
    title: "Spoiler-free overview",
    detail: "Public description and credits only. The plot stays closed.",
  },
  {
    id: "full-plot",
    title: "Full plot recap",
    detail: "Sourced plot in prose, cut at your spoiler line.",
  },
  {
    id: "remind-me",
    title: "Remind me what happened",
    detail: "Beats from the part you have already reached.",
  },
];

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || "The request failed.";
  } catch {
    return "The request failed.";
  }
}

function watchCopy(value: number): string {
  if (value <= 0) return "Plot recaps stay closed. The spoiler-free overview still works.";
  if (value >= 100) return "The full sourced plot can be used, including the ending.";
  if (value <= 25) return "Only the opening stretch of the sourced plot is unlocked.";
  if (value <= 50) return "The sourced plot is unlocked through the first half.";
  if (value <= 75) return "Most of the sourced plot is unlocked. The ending stays out.";
  return "The ending is still partly behind the line. Choose Finished to include it.";
}

function minuteHint(value: number, runtime: number | null): string | null {
  if (!runtime || value <= 0) return null;
  const minute = Math.round((runtime * value) / 100);
  return `If the plot follows the film evenly, ${value}% is about minute ${minute} of ${runtime}. That mapping is approximate.`;
}

export function MovieStudio({ movie }: { movie: PublicMovie }) {
  const id = movie.id;
  const [watch, setWatch] = useState(40);
  const [recapType, setRecapType] = useState<RecapType>("remind-me");
  const [length, setLength] = useState<RecapLength>("quick");
  const [recap, setRecap] = useState<RecapResponse | null>(null);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [seenId, setSeenId] = useState(movie.id);

  if (movie.id !== seenId) {
    setSeenId(movie.id);
    setRecap(null);
    setAnswer(null);
    setRecapError(null);
    setAskError(null);
    setQuestion("");
  }

  useEffect(() => {
    document.title = `${movie.title} · Up to here`;
  }, [movie.title]);

  async function onRecap(event: FormEvent) {
    event.preventDefault();
    setWriting(true);
    setRecapError(null);
    try {
      const response = await fetch("/api/recap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId: id, type: recapType, length, watchPercent: watch }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setRecap((await response.json()) as RecapResponse);
    } catch (caught) {
      setRecapError(caught instanceof Error ? caught.message : "Could not write the recap.");
    } finally {
      setWriting(false);
    }
  }

  async function ask(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 2) return;
    setQuestion(trimmed);
    setAsking(true);
    setAskError(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId: id, question: trimmed, watchPercent: watch, length }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setAnswer((await response.json()) as AskResponse);
    } catch (caught) {
      setAskError(caught instanceof Error ? caught.message : "Could not answer that.");
    } finally {
      setAsking(false);
    }
  }

  const stale =
    recap !== null &&
    (recap.watchPercent !== watch || recap.recapType !== recapType || recap.length !== length);
  const endingLocked = watch < 95;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:py-8">
      <Link href="/" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to search
      </Link>

      <header className="flex gap-4 sm:gap-6">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`Poster for ${movie.title}`}
            width={144}
            height={216}
            className="h-40 w-28 shrink-0 rounded-xl object-cover sm:h-52 sm:w-36"
          />
        ) : (
          <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-card font-display text-2xl sm:h-52 sm:w-36">
            {movie.kind === "sample" ? "GH" : "—"}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {movie.kind === "sample" ? <Badge variant="outline">Fictional sample</Badge> : null}
            {movie.year ? <Badge variant="secondary">{movie.year}</Badge> : null}
            {movie.runtimeMinutes ? <Badge variant="secondary">{movie.runtimeMinutes} min</Badge> : null}
            {movie.voteAverage ? <Badge variant="secondary">TMDB {movie.voteAverage}</Badge> : null}
          </div>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-5xl">{movie.title}</h1>
          {movie.genres.length > 0 ? (
            <p className="mt-2 text-xs tracking-wide text-amber uppercase">{movie.genres.join(" · ")}</p>
          ) : null}
          {movie.tagline ? <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{movie.tagline}</p> : null}
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {movie.director ? `Directed by ${movie.director}. ` : ""}
            {movie.cast.length > 0
              ? movie.cast
                  .slice(0, 4)
                  .map((person) => `${person.name} as ${person.character}`)
                  .join(" · ")
              : "No cast list on the source."}
          </p>
          {movie.tmdbUrl ? (
            <a className="mt-2 inline-block text-sm underline decoration-border underline-offset-2" href={movie.tmdbUrl}>
              TMDB record
            </a>
          ) : null}
        </div>
      </header>

      {movie.kind === "sample" ? (
        <p className="rounded-xl border border-sea/30 bg-card px-4 py-3 text-sm leading-6">
          This dossier is bundled with the app. The plot is original sample text, not a TMDB or Wikipedia page.
          The recap stops at the percent you mark, and the ending stays out until you choose Finished.
        </p>
      ) : null}
      {movie.sourceWarning ? (
        <p className="flex gap-2 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm leading-6" role="status">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
          <span>{movie.sourceWarning}</span>
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <form onSubmit={onRecap} className="grid gap-5 lg:sticky lg:top-4">
          <Card className="gap-4">
            <div className="px-(--card-spacing)">
              <Label htmlFor="watch">How far have you watched?</Label>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <p className="font-display text-4xl tabular-nums">{watch}%</p>
                <p className="text-right text-xs leading-5 text-muted-foreground">{watchCopy(watch)}</p>
              </div>
              <Slider
                id="watch"
                value={[watch]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value;
                  if (typeof next === "number") setWatch(next);
                }}
                aria-label="How far you have watched, as a percent of the film"
                className="mt-4"
              />
              <div className="mt-2 flex justify-between text-[10px] tracking-wide text-muted-foreground uppercase">
                <span>Start</span>
                <span>Act I</span>
                <span>Half</span>
                <span>Late</span>
                <span>End</span>
              </div>
              {minuteHint(watch, movie.runtimeMinutes) ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{minuteHint(watch, movie.runtimeMinutes)}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant={watch === preset.value ? "default" : "outline"}
                    onClick={() => setWatch(preset.value)}
                    aria-pressed={watch === preset.value}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Recap</legend>
            {TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                aria-pressed={recapType === type.id}
                onClick={() => setRecapType(type.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  recapType === type.id ? "border-amber bg-amber/10" : "border-border bg-card/60 hover:border-amber/40"
                }`}
              >
                <span className="block text-sm font-medium">{type.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{type.detail}</span>
              </button>
            ))}
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Length</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["quick", "Quick", "About a minute"],
                  ["detailed", "More detail", "A longer read"],
                ] as const
              ).map(([id, title, detail]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={length === id}
                  onClick={() => setLength(id)}
                  className={`rounded-xl border px-3 py-3 text-left ${
                    length === id ? "border-amber bg-amber/10" : "border-border bg-card/60"
                  }`}
                >
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg" className="h-11" disabled={writing}>
            {writing ? "Reading the source…" : "Write the recap"}
          </Button>
        </form>

        <div className="grid gap-5">
          <section className="rounded-2xl bg-paper px-5 py-6 text-ink shadow-xl sm:px-8 sm:py-8" aria-live="polite">
            <p className="text-xs tracking-[0.16em] text-ink-soft uppercase">Recap</p>
            {!recap && !writing ? (
              <div className="mt-4">
                <h2 className="font-display text-3xl text-balance">Nothing is written until you ask.</h2>
                <p className="mt-3 max-w-prose text-base leading-7 text-ink-soft">
                  Set the spoiler line first. A full plot recap and a reminder both stop at that percent. The
                  overview ignores the plot on purpose.
                </p>
              </div>
            ) : null}
            {writing ? <p className="mt-4 text-sm text-ink-soft">Reading the sourced plot inside your line…</p> : null}
            {recapError ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {recapError}
              </p>
            ) : null}
            {recap ? (
              <div className="mt-4">
                {stale ? (
                  <p className="mb-4 rounded-lg bg-[#efe2c4] px-3 py-2 text-sm leading-6">
                    This recap was written for {recap.watchPercent}% · {labelFor(recap.recapType)} ·{" "}
                    {recap.length === "quick" ? "quick" : "more detail"}. The controls have moved. Write it again
                    to match.
                  </p>
                ) : null}
                <h2 className="font-display text-3xl">{labelFor(recap.recapType)}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{recap.boundaryNote}</p>
                <div className="mt-5 max-w-prose text-base leading-7 whitespace-pre-wrap">{recap.recap}</div>
                <MomentList moments={recap.moments} />
                <div className="mt-6 border-t border-ink/10 pt-4 text-xs leading-5 text-ink-soft">
                  <p>{recap.source.generationNote}</p>
                  <p className="mt-2">{recap.source.note}</p>
                  {recap.source.wikipediaUrl ? (
                    <p className="mt-2">
                      Wikipedia plot:{" "}
                      <a className="underline" href={recap.source.wikipediaUrl}>
                        {recap.source.wikipediaTitle}
                      </a>{" "}
                      ({recap.source.wikipediaMatchedVia === "wikidata" ? "linked from TMDB via Wikidata" : "title search"}
                      ). CC BY-SA. {recap.source.allowedPlotChars.toLocaleString()} characters of plot text were
                      inside the line
                      {recap.source.totalPlotChars
                        ? `, out of ${recap.source.totalPlotChars.toLocaleString()} sourced.`
                        : "."}
                    </p>
                  ) : null}
                  {recap.source.excerpt ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-ink">Source excerpt used</summary>
                      <p className="mt-2 whitespace-pre-wrap">{recap.source.excerpt}</p>
                    </details>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <Card>
            <form
              className="grid gap-3 px-(--card-spacing)"
              onSubmit={(event) => {
                event.preventDefault();
                void ask(question);
              }}
            >
              <div>
                <h2 className="font-display text-2xl">Ask about what you&apos;ve seen</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Answers use the same spoiler line as the recap. A question about the ending stays closed until
                  the line is at the end of the film.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "What should I remember so far?",
                  "Who are the main people in the notes?",
                  "Why did the central character make that choice?",
                ].map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={asking}
                    onClick={() => void ask(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={asking}
                  onClick={() => void ask("Explain the ending")}
                  title={endingLocked ? "This stays closed until the spoiler line reaches the end and a plot is available." : undefined}
                >
                  Explain the ending{endingLocked ? " · locked" : ""}
                </Button>
              </div>
              <Label htmlFor="question" className="sr-only">
                Follow-up question
              </Label>
              <Textarea
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Why did they do that?"
                maxLength={400}
                className="min-h-24"
              />
              <div className="flex items-center justify-between gap-3">
                <Button type="submit" className="h-10 px-3" disabled={asking || question.trim().length < 2}>
                  {asking ? "Checking the source…" : "Ask"}
                </Button>
                <span className="text-xs text-muted-foreground">{question.trim().length}/400</span>
              </div>
            </form>
            {askError ? (
              <p className="px-(--card-spacing) text-sm text-destructive" role="alert">
                {askError}
              </p>
            ) : null}
            {answer ? (
              <div
                className={`mx-(--card-spacing) rounded-xl px-4 py-4 ${
                  answer.blocked ? "border border-amber/50 bg-amber/10" : "bg-background/40"
                }`}
                aria-live="polite"
              >
                {answer.watchPercent !== watch ? (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Answered for your line at {answer.watchPercent}%. The slider is now at {watch}%.
                  </p>
                ) : null}
                <p className="text-sm leading-6 whitespace-pre-wrap">{answer.answer}</p>
                <MomentList moments={answer.moments} tone="dark" />
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{answer.note}</p>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

function labelFor(type: RecapType): string {
  return TYPES.find((item) => item.id === type)?.title ?? "Recap";
}

function MomentList({ moments, tone = "paper" }: { moments: Moment[]; tone?: "paper" | "dark" }) {
  if (moments.length === 0) return null;
  const label = tone === "paper" ? "text-ink-soft" : "text-muted-foreground";
  const body = tone === "paper" ? "text-ink" : "text-foreground";
  return (
    <div className="mt-5">
      <h3 className={`text-xs tracking-[0.14em] uppercase ${label}`}>Supporting moments</h3>
      <ul className="mt-2 grid gap-2">
        {moments.map((moment) => (
          <li key={`${moment.label}-${moment.text}`} className="border-l-2 border-amber pl-3">
            <p className={`text-xs ${label}`}>{moment.label}</p>
            <p className={`mt-1 text-sm leading-6 ${body}`}>{moment.text}</p>
          </li>
        ))}
      </ul>
      <p className={`mt-2 text-xs ${label}`}>
        Positions are approximate, based on where the passage sits in the sourced plot.
      </p>
    </div>
  );
}
