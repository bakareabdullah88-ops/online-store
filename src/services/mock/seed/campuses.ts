import type { Campus } from "@/services/types";

type CampusSpec = {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  zones: [string, Campus["zones"][number]["kind"]][];
  pickup: [zoneIndex: number, name: string, hint: string][];
};

const specs: CampusSpec[] = [
  {
    slug: "unilag",
    name: "University of Lagos",
    shortName: "UNILAG",
    city: "Akoka",
    state: "Lagos",
    zones: [
      ["Moremi Hall", "hostel"],
      ["Jaja Hall", "hostel"],
      ["Eni Njoku Hall", "hostel"],
      ["Faculty of Engineering", "faculty"],
      ["Faculty of Arts", "faculty"],
      ["Main Gate", "gate"],
      ["Yaba / Akoka (off campus)", "offcampus"],
    ],
    pickup: [
      [4, "Arts car park kiosk", "Opposite the Arts theatre, look for the green umbrella"],
      [5, "Main Gate pickup stand", "Inside the gate, beside the shuttle park"],
      [3, "Engineering foyer", "Ground floor, by the noticeboards"],
    ],
  },
  {
    slug: "ui",
    name: "University of Ibadan",
    shortName: "UI",
    city: "Ibadan",
    state: "Oyo",
    zones: [
      ["Queen Elizabeth II Hall", "hostel"],
      ["Tedder Hall", "hostel"],
      ["Independence Hall", "hostel"],
      ["Faculty of Social Sciences", "faculty"],
      ["SUB", "market"],
      ["Agbowo (off campus)", "offcampus"],
    ],
    pickup: [
      [4, "SUB arcade, stall 4", "Next to the photocopy shops"],
      [3, "Social Sciences quad", "By the big almond tree"],
    ],
  },
  {
    slug: "oau",
    name: "Obafemi Awolowo University",
    shortName: "OAU",
    city: "Ile-Ife",
    state: "Osun",
    zones: [
      ["Moremi Hall", "hostel"],
      ["Awolowo Hall", "hostel"],
      ["Angola Hall", "hostel"],
      ["Fajuyi Hall", "hostel"],
      ["Oduduwa Hall area", "faculty"],
      ["Mozambique Hall", "hostel"],
    ],
    pickup: [
      [4, "Oduduwa Hall steps", "Left side, facing the amphitheatre"],
      [1, "Awo Hall porter's lodge", "Ask for the Kiosk shelf"],
    ],
  },
  {
    slug: "covenant",
    name: "Covenant University",
    shortName: "CU",
    city: "Ota",
    state: "Ogun",
    zones: [
      ["Daniel Hall", "hostel"],
      ["Esther Hall", "hostel"],
      ["Joseph Hall", "hostel"],
      ["Mary Hall", "hostel"],
      ["College of Science & Technology", "faculty"],
      ["Cafeteria 1", "market"],
    ],
    pickup: [
      [5, "Cafeteria 1 entrance", "By the drinks fridge"],
      [4, "CST lobby", "Ground floor reception"],
    ],
  },
  {
    slug: "lasu",
    name: "Lagos State University",
    shortName: "LASU",
    city: "Ojo",
    state: "Lagos",
    zones: [
      ["Main Gate", "gate"],
      ["Faculty of Science", "faculty"],
      ["Faculty of Management Sciences", "faculty"],
      ["Students' Union Building", "market"],
      ["Iba (off campus)", "offcampus"],
    ],
    pickup: [
      [3, "SUB walkway stand", "Under the blue canopy"],
      [0, "Main Gate kiosk", "Right side after security"],
    ],
  },
  {
    slug: "unn",
    name: "University of Nigeria, Nsukka",
    shortName: "UNN",
    city: "Nsukka",
    state: "Enugu",
    zones: [
      ["Bello Hall", "hostel"],
      ["Mary Slessor Hall", "hostel"],
      ["Eni Njoku Hall", "hostel"],
      ["Faculty of Arts", "faculty"],
      ["Hilltop (off campus)", "offcampus"],
    ],
    pickup: [
      [3, "Arts block shelf", "Behind the Faculty office"],
      [0, "Bello Hall junction", "Beside the provision store"],
    ],
  },
  {
    slug: "abu",
    name: "Ahmadu Bello University",
    shortName: "ABU",
    city: "Zaria",
    state: "Kaduna",
    zones: [
      ["Ribadu Hall", "hostel"],
      ["Suleiman Hall", "hostel"],
      ["Amina Hall", "hostel"],
      ["Samaru Gate", "gate"],
      ["Senate area", "faculty"],
    ],
    pickup: [
      [3, "Samaru Gate stand", "Next to the keke park"],
      [4, "Senate building shade", "Under the neem trees"],
    ],
  },
  {
    slug: "babcock",
    name: "Babcock University",
    shortName: "BU",
    city: "Ilishan-Remo",
    state: "Ogun",
    zones: [
      ["Gideon Troopers Hall", "hostel"],
      ["Queen Esther Hall", "hostel"],
      ["Samuel Akande Hall", "hostel"],
      ["Faculty of Science", "faculty"],
      ["BBS area", "market"],
    ],
    pickup: [
      [4, "BBS stall 2", "Inside the shopping arcade"],
      [3, "Science lobby", "Beside the lift"],
    ],
  },
];

export function seedCampuses(): Campus[] {
  return specs.map((s) => {
    const zones = s.zones.map(([name, kind], i) => ({ id: `${s.slug}-z${i + 1}`, name, kind }));
    return {
      id: `c_${s.slug}`,
      slug: s.slug,
      name: s.name,
      shortName: s.shortName,
      city: s.city,
      state: s.state,
      zones,
      pickupPoints: s.pickup.map(([zi, name, hint], i) => ({
        id: `${s.slug}-pp${i + 1}`,
        zoneId: zones[zi]?.id ?? zones[0]!.id,
        name,
        hint,
      })),
    };
  });
}
