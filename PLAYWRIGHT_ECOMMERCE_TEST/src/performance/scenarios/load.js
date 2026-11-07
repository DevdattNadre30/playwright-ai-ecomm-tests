import { scenarioOptions, runBusinessJourney, writeSummary } from "../utils/helpers.js";

export const options = scenarioOptions("load");

export default function () {
  runBusinessJourney("load");
}

export function handleSummary(data) {
  return writeSummary(data);
}
