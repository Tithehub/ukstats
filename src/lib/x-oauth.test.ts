import { describe, expect, it } from "vitest";
import { oauthHeader } from "./x-oauth";

// X's documented example: https://developer.x.com/en/docs/authentication/oauth-1-0a/creating-a-signature
describe("X OAuth 1.0a signing", () => {
  it("matches X's documented signature", async () => {
    const h = await oauthHeader(
      "POST",
      "https://api.twitter.com/1.1/statuses/update.json",
      {
        apiKey: "xvz1evFS4wEEPTGEFPHBog",
        apiSecret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw",
        accessToken: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb",
        accessSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE",
      },
      { include_entities: "true", status: "Hello Ladies + Gentlemen, a signed OAuth request!" },
      "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg",
      "1318622958",
    );
    expect(h).toContain(`oauth_signature="${encodeURIComponent("hCtSmYh+iHYCEqBWrE7C7hYmtUk=")}"`);
  });
});
