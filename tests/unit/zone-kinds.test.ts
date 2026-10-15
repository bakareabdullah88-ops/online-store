import { describe, expect, it } from "vitest";
import { detailCopy, kindOrder, matchesSpot, spotGroups } from "@/config/zone-kinds";
import { seedCampuses } from "@/services/mock/seed/campuses";

const unilag = seedCampuses().find((c) => c.id === "c_unilag")!;

describe("spot picker lists", () => {
  it("groups every spot on the campus by kind, in a fixed order, sorted by name", () => {
    const groups = spotGroups(unilag);
    expect(groups.flatMap((g) => g.options)).toHaveLength(unilag.zones.length);
    const order = groups.map((g) => kindOrder.indexOf(g.kind));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(groups[0]?.label).toBe("Halls");
    const halls = groups[0]!.options.map((o) => o.name);
    expect([...halls].sort((a, b) => a.localeCompare(b, "en"))).toEqual(halls);
  });

  it("narrows to kinds or to given spots", () => {
    const halls = spotGroups(unilag, { kinds: ["hostel"] });
    expect(halls).toHaveLength(1);
    expect(halls[0]!.options.every((o) => o.kind === "hostel")).toBe(true);
    expect(spotGroups(unilag, { zoneIds: ["unilag-z1", "unilag-z4"] }).map((g) => g.kind)).toEqual([
      "hostel",
      "faculty",
    ]);
    expect(spotGroups(undefined)).toEqual([]);
  });

  it("filters by the start of any word: name, kind or pickup point", () => {
    const names = (q: string) =>
      spotGroups(unilag, { query: q }).flatMap((g) => g.options.map((o) => o.name));
    expect(names("eng")).toEqual(["Faculty of Engineering"]);
    expect(names("el kan")).toEqual(["El-Kanemi Hall"]);
    expect(names("foyer")).toEqual(["Faculty of Engineering"]);
    expect(names("off")).toEqual(["Yaba / Akoka (off campus)"]);
    // "am" starts no word of Madam Tinubu or Makama, only Amina.
    expect(names("am")).toEqual(["Queen Amina Hall"]);
    expect(names("halls").length).toBe(unilag.zones.filter((z) => z.kind === "hostel").length);
    expect(names("zzz")).toEqual([]);
  });

  it("shows the pickup point under spots that have one", () => {
    const eng = spotGroups(unilag, { query: "engineering" })[0]!.options[0]!;
    expect(eng.hint).toBe("Pickup: Engineering foyer");
    expect(matchesSpot(eng, "")).toBe(true);
  });
});

describe("detail line copy", () => {
  it("asks for what makes sense for the kind of spot", () => {
    expect(detailCopy("hostel").label).toBe("Room and block");
    expect(detailCopy("faculty").label).toBe("Department or lecture theatre");
    expect(detailCopy("gate").label).toBe("Where exactly");
    expect(detailCopy("offcampus")).toMatchObject({ label: "Street address", required: true });
    expect(detailCopy("hostel").required).toBe(false);
    expect(detailCopy(undefined).label).toBe("Room, block or landmark");
  });
});
