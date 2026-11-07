import { scenarioOptions, runBusinessJourney, writeSummary } from "../utils/helpers.js";

export const options = scenarioOptions("spike");

export default function () {
  runBusinessJourney("spike");
}

export function handleSummary(data) {
  return writeSummary(data);
}
