import type { MovieDossier } from "./types";

const PLOT = [
  "Mara Voss keeps the night desk at Glass Harbor, where the brass fog bell rings whenever a ferry is late. She logs the weather, the tide, and the names of crews who still answer the radio.",
  "On a Tuesday with no wind, the bell stays quiet and the crossing that should have arrived is missing from the harbor log. Mara checks the carbon copy and finds a blank line where the boat's name should be.",
  "Hart, the lighthouse keeper, comes in for coffee and says the fog hides the channel markers. He tells her boats sometimes wait outside the headland until morning, and he asks her to leave the blank line alone.",
  "After he leaves, Mara kneels by the radio bench and pulls out a green ledger tied with twine. The pages list passengers who were never sold a ticket, each name written in Hart's square hand.",
  "Inspector Phelan arrives from the city with a wet coat and a polite warning. She says curiosity is how small harbors lose their funding, and she asks for the green ledger by name.",
  "Mara hides the ledger in the map drawer and follows Hart to the breakwater. He lifts a red lantern twice, and a dark boat answers from beyond the rocks.",
  "In the lantern light she reads a skipped page: her brother Eli, who she thought had left town years ago, is listed as cargo kept off the manifest. The note beside his name says he asked for Mara and was told she was off shift.",
  "Phelan offers a stack of cash to burn the green ledger before sunrise. Mara refuses, locks the drawer, and tells Hart she will ring the brass fog bell if he tries to move the boat.",
  "Near dawn Mara walks the end of the channel and finds the harbor clock stopped at thirteen. A saltglass key hangs in the clock case, and Eli is on the hidden boat, alive, staying out of sight of Phelan's buyers.",
  "Mara rings the brass fog bell in full daylight. The green ledger goes to the town archive, the saltglass key opens the customs cage, and Phelan's launch is held at the dock. Hart winds the harbor clock himself and the hands move past thirteen.",
].join("\n\n");

export function sampleDossier(): MovieDossier {
  return {
    id: "sample",
    kind: "sample",
    title: "Glass Harbor",
    year: null,
    runtimeMinutes: 104,
    genres: ["Drama", "Mystery"],
    overview:
      "In a fogbound harbor town, night dispatcher Mara Voss starts asking why one ferry crossing vanished from the log.",
    tagline: "A fictional sample, bundled so the spoiler line can be tried offline.",
    posterUrl: null,
    voteAverage: null,
    director: "Nia Feld",
    cast: [
      { name: "Inez Calder", character: "Mara Voss" },
      { name: "Owen Pell", character: "Hart" },
      { name: "June Okada", character: "Inspector Phelan" },
      { name: "Leo Marsh", character: "Eli Voss" },
    ],
    tmdbUrl: null,
    wikipedia: null,
    plot: PLOT,
    plotOrigin: "sample",
    sourceWarning: null,
  };
}
