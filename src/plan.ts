// HHF 12 Week Turnover, Start Up phase. Four sessions, used exactly as written.

export interface Exercise {
  id: string;          // unique within the programme
  key: string;         // lifts with the same key share history (e.g. lat pulldown in S2 and S3)
  name: string;
  lo: number | null;   // bottom of rep range (null = to failure)
  hi: number | null;   // top of rep range
  sets: number;
  setsTxt?: string;
  repsTxt?: string;
  rest: number;        // seconds
  inc: number;         // kg to add when progressing
  kind: "bar" | "db" | "machine" | "bw";
  fail?: boolean;
  ss?: string;         // superset group
  cue: string;
}

export interface Session {
  n: number;
  title: string;
  focus: string;
  ex: Exercise[];
  extra: { title: string; detail: string; placeholder: string };
}

export const PLAN: Session[] = [
  {
    n: 1, title: "Session 1", focus: "Squat, push press, row",
    ex: [
      { id: "s1_squat", key: "squat", name: "Barbell squat", lo: 4, hi: 6, sets: 3, setsTxt: "2 to 3 sets", rest: 120, inc: 5, kind: "bar",
        cue: "Add 1 or 2 warm up sets. Superset with 2 or 3 box jumps if there's space. Hack squat or a machine if squats don't suit you." },
      { id: "s1_hamcurl", key: "hamcurl", name: "Hamstring curl", lo: 8, hi: 8, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: "Seated ideally. Lying or standing work too, as do hamstring sliders." },
      { id: "s1_pushpress", key: "pushpress", name: "Push press", lo: 6, hi: 6, sets: 3, rest: 120, inc: 2.5, kind: "bar",
        cue: "Squeeze glutes and brace your core. Only a slight knee bend for the drive. Seated dumbbell shoulder press is the alternative." },
      { id: "s1_row", key: "bbrow", name: "Barbell row", lo: 6, hi: 6, sets: 3, rest: 90, inc: 2.5, kind: "bar",
        cue: "Lifting straps are your friend here." },
      { id: "s1_shrug", key: "shrugs", name: "Barbell shrugs", lo: 6, hi: 8, sets: 3, rest: 90, inc: 5, kind: "bar", ss: "A",
        cue: "Shrug and squeeze each rep at the top. Straps help." },
      { id: "s1_lateral", key: "lateral", name: "Lateral raise", lo: 10, hi: 12, sets: 3, rest: 90, inc: 1, kind: "db", ss: "A",
        cue: "Machine or dumbbell. If you know it, tri-set with banded neck holds." },
    ],
    extra: { title: "Row finisher", detail: "500m row buy in, then 5 rounds of 250m row with 30s rest.", placeholder: "Total time, e.g. 9:40" },
  },
  {
    n: 2, title: "Session 2", focus: "RDL, bench, pull",
    ex: [
      { id: "s2_rdl", key: "rdl", name: "Romanian deadlift", lo: 6, hi: 6, sets: 3, setsTxt: "2 to 3 sets", rest: 120, inc: 5, kind: "bar",
        cue: "Add 1 or 2 warm up sets into the heavy ones. Hex bar, trap bar or dumbbells are good alternatives." },
      { id: "s2_jumplunge", key: "jumplunge", name: "Jump lunge", lo: 10, hi: 10, sets: 3, setsTxt: "2 to 3 sets", repsTxt: "10 total, 5 each leg", rest: 90, inc: 0, kind: "bw",
        cue: "Stationary, not jumping all over the gym. Reverse lunge if you're not confident in the jump." },
      { id: "s2_bench", key: "bench", name: "Barbell bench press", lo: 4, hi: 6, sets: 3, rest: 120, inc: 2.5, kind: "bar",
        cue: "Add 1 or 2 warm up sets. Touch the bar to your chest and control the way down." },
      { id: "s2_fly", key: "fly", name: "Chest fly", lo: null, hi: null, sets: 2, rest: 90, inc: 2.5, kind: "machine", fail: true,
        cue: "Standing or seated. Keep a slight bend at the elbow, like a curled arm rather than a right angle." },
      { id: "s2_pulldown", key: "pulldown", name: "Lat pulldown", lo: 8, hi: 8, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: "HHF's swap for pull ups when you can't manage more than 4. Band assisted pull ups are the other option." },
      { id: "s2_curl", key: "curl", name: "Bicep curl", lo: 10, hi: 10, sets: 3, rest: 60, inc: 1, kind: "db", ss: "B",
        cue: "Curls or hammers, your choice." },
      { id: "s2_pushdown", key: "pushdown", name: "Tricep pushdown", lo: 10, hi: 10, sets: 3, rest: 60, inc: 2.5, kind: "machine", ss: "B",
        cue: "Pushdowns, dips or any tricep movement you like." },
    ],
    extra: { title: "Bike sprints", detail: "Assault bike or standard bike. 2 sets of 8 rounds: 20s sprint, 10s rest, with 2 to 3 min between sets.", placeholder: "Notes, e.g. level 12" },
  },
  {
    n: 3, title: "Session 3", focus: "Box squat, incline, rows",
    ex: [
      { id: "s3_boxsquat", key: "boxsquat", name: "Box squat", lo: 5, hi: 5, sets: 3, rest: 120, inc: 5, kind: "bar",
        cue: "Steady on the way down, quick on the way up. Set the box just above your normal squat depth." },
      { id: "s3_incline", key: "inclinedb", name: "Incline dumbbell press", lo: 6, hi: 8, sets: 3, rest: 90, inc: 2, kind: "db",
        cue: "Get a stretch at the bottom. Going past 90 degrees at the elbow is fine." },
      { id: "s3_pendlay", key: "pendlay", name: "Pendlay row", lo: 5, hi: 5, sets: 3, rest: 90, inc: 2.5, kind: "bar",
        cue: "A barbell row from the floor with quick reps, almost a cheat rep." },
      { id: "s3_pulldown", key: "pulldown", name: "Lat pulldown", lo: 8, hi: 10, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: "Chest up and don't round over at the bottom. Think pull with the elbows." },
      { id: "s3_pop", key: "poppress", name: "Pop press up", lo: 5, hi: 10, sets: 3, rest: 90, inc: 0, kind: "bw",
        cue: "Hands on a raised box for easier reps. Quick, strong reps." },
      { id: "s3_situp", key: "situp", name: "Decline sit up", lo: 10, hi: 12, sets: 3, rest: 60, inc: 2.5, kind: "bw",
        cue: "Weighted if needed. The top of your back touches the bench every rep." },
    ],
    extra: { title: "Row for time", detail: "1000m on the rowing machine, flat out.", placeholder: "Time, e.g. 3:28" },
  },
  {
    n: 4, title: "Session 4", focus: "Lunge, press, arms",
    ex: [
      { id: "s4_lunge", key: "walklunge", name: "Walking lunge", lo: 12, hi: 12, sets: 3, repsTxt: "12 total", rest: 120, inc: 2, kind: "db",
        cue: "Knee to the floor." },
      { id: "s4_dbpress", key: "dbpress", name: "Dumbbell shoulder press", lo: 6, hi: 8, sets: 3, rest: 90, inc: 2, kind: "db",
        cue: "Going past 90 degrees at the elbow is fine." },
      { id: "s4_cablerow", key: "cablerow", name: "Cable row", lo: 8, hi: 8, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: "Get a good stretch and squeeze." },
      { id: "s4_shrug", key: "shrugs", name: "Shrugs", lo: 8, hi: 10, sets: 3, rest: 90, inc: 5, kind: "bar",
        cue: "Dumbbell or barbell." },
      { id: "s4_curl", key: "curl", name: "Bicep curl", lo: 5, hi: 10, sets: 3, rest: 60, inc: 1, kind: "db", ss: "C",
        cue: "Dumbbell, barbell or cable." },
      { id: "s4_skull", key: "skull", name: "Skull crusher", lo: 10, hi: 12, sets: 3, rest: 60, inc: 2.5, kind: "bar", ss: "C",
        cue: "An EZ bar is best for grip. Tricep pushdowns are the swap." },
    ],
    extra: { title: "Steady bike", detail: "20 to 40 minutes at 130 to 160 bpm.", placeholder: "Minutes and avg HR" },
  },
];

export const LIFT_NAMES: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  PLAN.forEach(s => s.ex.forEach(e => { if (!m[e.key]) m[e.key] = e.name; }));
  m.shrugs = "Shrugs"; m.curl = "Bicep curl"; m.pulldown = "Lat pulldown";
  return m;
})();

// Monday first
export const WEEK = [
  { d: "M", t: "Gym", c: "gym" },
  { d: "T", t: "Rugby", c: "rugby" },
  { d: "W", t: "Gym", c: "gym" },
  { d: "T", t: "Rugby", c: "rugby" },
  { d: "F", t: "Gym", c: "gym" },
  { d: "S", t: "Game", c: "game" },
  { d: "S", t: "Rest", c: "rest" },
] as const;

export function findExercise(id: string): Exercise | undefined {
  for (const s of PLAN) for (const e of s.ex) if (e.id === id) return e;
  return undefined;
}
