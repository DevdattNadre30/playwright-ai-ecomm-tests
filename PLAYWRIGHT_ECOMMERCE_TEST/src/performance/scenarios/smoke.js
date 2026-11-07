import { scenarioOptions, runBusinessJourney, writeSummary } from "../utils/helpers.js";

export const options = scenarioOptions("smoke");

export default function () {
  runBusinessJourney("smoke");
}

export function handleSummary(data) {
  return writeSummary(data);
}
