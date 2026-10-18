import { expect, it } from "vitest";
import { ELECTION_PARTIES } from "./party-comparison.data";

it("retains Parliament’s separately reported 2024 Green Party result without combining Scottish Greens", () => {
  const party = ELECTION_PARTIES.find(row => row.id === "green");
  expect(party?.voteShare).toBe(6.4);
  expect(party?.seats).toBe(4);
});

it("retains seats won in 2024 rather than claiming current membership", () => {
  expect(ELECTION_PARTIES.find(row => row.id === "labour")?.seats).toBe(411);
  expect(ELECTION_PARTIES.find(row => row.id === "reform")?.seats).toBe(5);
});