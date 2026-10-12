import { describe, expect, it } from "vitest";
import { isPrivateHost, linkHostProblem } from "./banner-link";

describe("refusing links that point inside a private network", () => {
  it("blocks loopback, private ranges and cloud metadata addresses", () => {
    for (const host of [
      "localhost",
      "db.internal",
      "127.0.0.1",
      "10.1.2.3",
      "192.168.0.7",
      "172.16.0.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
    ]) {
      expect(isPrivateHost(host), host).toBe(true);
    }
  });

  it("blocks private ipv6 and leaves public ones alone", () => {
    expect(isPrivateHost("::1")).toBe(true);
    expect(isPrivateHost("fd00::1")).toBe(true);
    expect(isPrivateHost("fe80::1")).toBe(true);
    expect(isPrivateHost("2001:db8::1")).toBe(false);
    expect(isPrivateHost("8.8.8.8")).toBe(false);
    expect(isPrivateHost("172.32.0.1")).toBe(false);
    expect(isPrivateHost("cdn.sponsor.example")).toBe(false);
  });

  it("gives a plain reason per bad link", () => {
    expect(linkHostProblem("https://cdn.sponsor.example/banner.jpg")).toBeNull();
    expect(linkHostProblem("http://cdn.sponsor.example/banner.jpg")).toBe("Banner image links must start with https://");
    expect(linkHostProblem("https://localhost/banner.jpg")).toBe("That address points inside a private network, so we won't open it.");
    expect(linkHostProblem("https://169.254.169.254/latest/meta-data")).toBe(
      "That address points inside a private network, so we won't open it.",
    );
    expect(linkHostProblem("https://[::1]/banner.jpg")).toBe("That address points inside a private network, so we won't open it.");
    expect(linkHostProblem("https://user:secret@cdn.example/banner.jpg")).toBe("Banner image links can't carry a password.");
    expect(linkHostProblem("cdn.example/banner.jpg")).toBe("That isn't a web address we can open.");
    expect(linkHostProblem("ftp://cdn.example/banner.jpg")).toBe("Banner image links must start with https://");
  });
});
