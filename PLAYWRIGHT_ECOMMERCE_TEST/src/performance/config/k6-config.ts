export type K6ProfileName = "smoke" | "load" | "stress" | "spike";

export interface K6Profile {
  maxVUs: number;
  description: string;
}

export const k6Profiles: Record<K6ProfileName, K6Profile> = {
  smoke: { maxVUs: 1, description: "Single virtual user for fast availability checks." },
  load: { maxVUs: 3, description: "Normal low-volume business traffic." },
  stress: { maxVUs: 6, description: "Bounded capacity check for a controlled non-production target." },
  spike: { maxVUs: 8, description: "Bounded short arrival-rate increase for a controlled non-production target." },
};

export const k6Thresholds = {
  http_req_failed: ["rate<0.01"],
  checks: ["rate>0.99"],
  http_req_duration: ["p(95)<1000"],
} as const;

export const k6Safety = {
  externalTargetOptIn: "K6_ALLOW_EXTERNAL_TARGET",
  higherLoadOptIn: "K6_ALLOW_HIGHER_LOAD",
} as const;
