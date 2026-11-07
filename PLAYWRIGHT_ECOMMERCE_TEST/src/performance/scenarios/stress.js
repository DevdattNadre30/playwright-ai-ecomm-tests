import { scenarioOptions, runBusinessJourney, writeSummary } from "../utils/helpers.js";

export const options = scenarioOptions("stress");

export default function () {
  runBusinessJourney("stress");
}

export function handleSummary(data) {
  return writeSummary(data);
}
