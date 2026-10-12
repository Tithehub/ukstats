import { describe, expect, it } from "vitest";
import { bannerObjectPath, isOwnBannerPath } from "./banner-paths";

const ME = "3f2b7c1a-9d4e-4a1b-8c2f-5e6d7a8b9c0d";
const OTHER = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("where a sponsor's banner picture may live", () => {
  it("keeps a new upload inside the owner's own folder with a picture name", () => {
    expect(bannerObjectPath(ME, "my banner.PNG")).toMatch(new RegExp(`^${ME}/\\d+\\.png$`));
    expect(bannerObjectPath(ME, "noextension")).toMatch(new RegExp(`^${ME}/\\d+\\.jpg$`));
  });

  it("only accepts a single file straight inside the owner's folder", () => {
    expect(isOwnBannerPath(`${ME}/1700000000.jpg`, ME)).toBe(true);
    expect(isOwnBannerPath(`${OTHER}/1700000000.jpg`, ME)).toBe(false);
    expect(isOwnBannerPath(`${ME}/deep/1700000000.jpg`, ME)).toBe(false);
    expect(isOwnBannerPath(`${ME}/1700000000.exe`, ME)).toBe(false);
    expect(isOwnBannerPath(`../${OTHER}/x.png`, ME)).toBe(false);
    expect(isOwnBannerPath(`/${ME}/x.png`, ME)).toBe(false);
    expect(isOwnBannerPath(`${ME}/..%2Fx.png`, ME)).toBe(false);
    expect(isOwnBannerPath("", ME)).toBe(false);
  });
});
