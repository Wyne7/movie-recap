# Up to here

A small movie catch-up app. Search for a film, mark how far you have watched, and read a recap that stops there. Follow-up questions use the same spoiler line.

Recaps are grounded in sources the server actually fetched. If those sources are thin, the screen says so. The app does not invent plot from a title.

## MVP flow

1. Search TMDB by title. Year and genre are optional filters on the first page of results.
2. Open a film and set three controls:
   - **How far you have watched** (percent slider, with act presets)
   - **Recap type:** spoiler-free overview, full plot recap, or “remind me what happened”
   - **Length:** quick or more detailed
3. Read the recap. Supporting moments include approximate act or minute markers. Those times are positions in the sourced plot, not official timestamps.
4. Ask a follow-up. Answers stay inside the same watch point. “Explain the ending” stays closed until the line is at the end of the film.

No accounts and no saved history.

## Setup

Use Node 22+.

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | For live search | TMDB v3 API key, or a v4 read access token (starts with `ey`). [Create one](https://www.themoviedb.org/settings/api). |
| `OPENAI_API_KEY` | No | Turns extracts into a shorter paraphrase. Omit it and the app quotes and condenses the source directly. |
| `OPENAI_BASE_URL` | No | OpenAI-compatible chat completions base URL. Default `https://api.openai.com/v1`. |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini`. |

Do not commit `.env.local`. Only `.env.example` belongs in git.

```bash
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Without `TMDB_API_KEY`, search stays off. **Glass Harbor** on the home page is a fictional sample with an original plot, so the spoiler line can be tried offline. It is not a TMDB or Wikipedia record.

```bash
npm test
npm run lint
```

## Where the words come from

- **TMDB** supplies search, title, year, genres, runtime, poster, public overview, tagline, and credits.
- **Wikidata**, using the id TMDB returns, supplies the English Wikipedia title when it can.
- **English Wikipedia’s plot section** (or Synopsis, if that is the section name) is the plot text. Markup is stripped on the server. The article is linked on the recap and attributed under CC BY-SA.
- If Wikipedia has no plot, or the section is a stub, full recaps and answers stay inside the public overview.

The full plot is not sent to the browser. The client receives metadata plus, after you generate a recap, the excerpt that falls inside the spoiler line.

Spoiler handling, in short:

- The plot is split into sentences. A sentence is included only when it starts before your percent.
- Ending questions are refused below 95%. A question whose words match only the locked portion is refused too.
- With an API key, the model sees only the allowed text and is told to ignore outside memory. The reply is dropped if it overlaps the locked plot, and an extract is used instead.
- Minute labels assume the plot runs evenly with the film. The UI calls that approximate.

Studio overviews are usually written to avoid major spoilers. That is not a guarantee, and the spoiler-free recap says so.

## Layout

- `src/app` — pages and route handlers
- `src/components` — search and the recap studio
- `src/lib` — TMDB, Wikipedia, the spoiler window, extracts, and the optional model call
- `tests` — window, grounding, and markup tests. They do not call the network.

## Later

Not in this prototype: character guides, other languages, TV series, and personalization or saved history.
