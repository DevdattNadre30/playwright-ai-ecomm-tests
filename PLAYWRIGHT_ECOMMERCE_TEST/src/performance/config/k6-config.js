export const profiles = {
  smoke: {
    thresholds: {
      http_req_failed: ["rate<0.01"],
      checks: ["rate>0.99"],
      http_req_duration: ["p(95)<1000"],
    },
    scenario: { executor: "constant-vus", vus: 1, duration: "10s" },
  },
  load: {
    thresholds: {
      http_req_failed: ["rate<0.01"],
      checks: ["rate>0.99"],
      http_req_duration: ["p(95)<1000"],
    },
    scenario: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "15s", target: 3 },
        { duration: "40s", target: 3 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  stress: {
    thresholds: {
      http_req_failed: ["rate<0.01"],
      checks: ["rate>0.99"],
      http_req_duration: ["p(95)<1500"],
    },
    scenario: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "10s", target: 3 },
        { duration: "15s", target: 6 },
        { duration: "10s", target: 6 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  spike: {
    thresholds: {
      http_req_failed: ["rate<0.01"],
      checks: ["rate>0.99"],
      http_req_duration: ["p(95)<1500"],
    },
    scenario: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 2,
      maxVUs: 8,
      stages: [
        { duration: "5s", target: 1 },
        { duration: "5s", target: 5 },
        { duration: "10s", target: 5 },
        { duration: "5s", target: 1 },
      ],
      gracefulStop: "5s",
    },
  },
};
