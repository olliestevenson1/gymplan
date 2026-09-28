// HHF 12 Week Turnover, Start Up phase. Four sessions, with Ollie's swaps:
// S1 dumbbell shrugs, S2 cable curls and cable pushdowns.

export interface Cue {
  setup: string;       // how to get into position
  steps: string[];     // one rep, in order
  avoid: string;       // the common mistakes
  note?: string;       // HHF's programme notes (warm ups, swaps)
}

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
  cue: Cue;
}

export interface Session {
  n: number;
  title: string;
  focus: string;
  ex: Exercise[];
  extra: { title: string; detail: string; placeholder: string };
}

/* ---------- shared cues ---------- */

const SHRUG_STEPS = [
  "Lift your shoulders straight up towards your ears.",
  "Hold and squeeze your traps for a second at the top.",
  "Lower slowly until you feel a stretch across the top of your shoulders.",
];
const SHRUG_AVOID = "Rolling your shoulders in circles or bending your elbows to help the weight up.";

const PULLDOWN: Omit<Cue, "note"> = {
  setup: "Knees locked under the pads, overhand grip just wider than your shoulders, sitting tall.",
  steps: [
    "Lean back very slightly and pull your shoulder blades down first.",
    "Pull the bar to your upper chest, driving your elbows down to your sides.",
    "Squeeze your back for a second, then let the bar rise until your arms are fully straight.",
  ],
  avoid: "Leaning right back and swinging the weight, or pulling the bar behind your neck.",
};

const CURL_STEPS = [
  "Curl the weight up towards your shoulders without letting your elbows move forward.",
  "Squeeze your biceps at the top for a second.",
  "Lower slowly, over 2 to 3 seconds, until your arms are fully straight.",
];
const CURL_AVOID = "Rocking your body to swing the weight up, or elbows drifting forward.";

export const PLAN: Session[] = [
  {
    n: 1, title: "Session 1", focus: "Squat, push press, row",
    ex: [
      { id: "s1_squat", key: "squat", name: "Barbell squat", lo: 4, hi: 6, sets: 3, setsTxt: "2 to 3 sets", rest: 120, inc: 5, kind: "bar",
        cue: {
          setup: "Bar across your upper back, not your neck. Hands just outside your shoulders, feet shoulder width, toes turned out slightly.",
          steps: [
            "Take a big breath into your belly and brace before every rep.",
            "Sit down between your heels, pushing your knees out over your toes.",
            "Go down until your hip crease is just below your knee, or as deep as you can while keeping your back flat.",
            "Drive up through your whole foot, chest and hips rising together.",
          ],
          avoid: "Knees caving in, heels lifting, or your chest dropping so your hips shoot up first.",
          note: "Do 1 or 2 lighter warm up sets first. If there's space, pair each set with 2 or 3 box jumps. Hack squat or a squat machine if back squats don't suit you.",
        } },
      { id: "s1_hamcurl", key: "hamcurl", name: "Hamstring curl", lo: 8, hi: 8, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: {
          setup: "Seated machine: knees lined up with the machine's pivot, ankle pad just above your heels, thigh pad snug on your legs.",
          steps: [
            "Hold the handles and keep your hips pressed down into the seat.",
            "Curl your heels under as far as they will go and squeeze for a second.",
            "Lower slowly, over 2 to 3 seconds, until your legs are almost straight.",
          ],
          avoid: "Hips lifting off the seat, or letting the weight stack crash down between reps.",
          note: "Seated is best. Lying or standing machines work too, as do hamstring sliders on the floor.",
        } },
      { id: "s1_pushpress", key: "pushpress", name: "Push press", lo: 6, hi: 6, sets: 3, rest: 120, inc: 2.5, kind: "bar",
        cue: {
          setup: "Bar resting on the front of your shoulders, hands just outside shoulder width, elbows slightly in front of the bar. Feet hip width.",
          steps: [
            "Brace and squeeze your glutes, then dip a few inches by bending your knees. Keep your torso upright and your weight in your heels.",
            "With no pause at the bottom, drive hard through your legs so the bar pops off your shoulders.",
            "Only now press with your arms, moving your head back so the bar travels straight up.",
            "Finish with your arms locked and the bar over your midfoot, then lower it back to your shoulders under control.",
          ],
          avoid: "Leaning forward in the dip, dipping so deep it becomes a squat, or pressing with your arms before your legs have finished.",
          note: "Seated dumbbell shoulder press is the swap if you need one.",
        } },
      { id: "s1_row", key: "bbrow", name: "Barbell row", lo: 6, hi: 6, sets: 3, rest: 90, inc: 2.5, kind: "bar",
        cue: {
          setup: "Hinge at your hips with a slight knee bend until your torso is around 45 degrees. Overhand grip just outside your knees, back flat.",
          steps: [
            "Pull the bar to your lower ribs, driving your elbows back past your body.",
            "Squeeze your shoulder blades together at the top.",
            "Lower until your arms are straight, holding the same back angle throughout.",
          ],
          avoid: "Standing up a little more on every rep, or jerking the weight up with your hips.",
          note: "Lifting straps help so your grip doesn't give out before your back.",
        } },
      { id: "s1_shrug", key: "dbshrugs", name: "Dumbbell shrugs", lo: 6, hi: 8, sets: 3, rest: 90, inc: 2, kind: "db", ss: "A",
        cue: {
          setup: "Stand tall with a dumbbell in each hand by your sides, palms facing in.",
          steps: SHRUG_STEPS,
          avoid: SHRUG_AVOID,
          note: "Go straight into lateral raises, then rest. Straps help once the dumbbells get heavy.",
        } },
      { id: "s1_lateral", key: "lateral", name: "Lateral raise", lo: 10, hi: 12, sets: 3, rest: 90, inc: 1, kind: "db", ss: "A",
        cue: {
          setup: "Stand with a light dumbbell in each hand by your sides, a slight bend in your elbows, leaning a touch forward.",
          steps: [
            "Raise the dumbbells out to the side, leading with your elbows.",
            "Stop at shoulder height, hands no higher than your elbows.",
            "Lower slowly, over 2 to 3 seconds.",
          ],
          avoid: "Swinging your body to get the weight up, or shrugging your shoulders towards your ears.",
          note: "Machine or dumbbells both fine. If you know banded neck holds, add them as a third exercise here.",
        } },
    ],
    extra: { title: "Row finisher", detail: "500m row buy in, then 5 rounds of 250m row with 30s rest.", placeholder: "Total time, e.g. 9:40" },
  },
  {
    n: 2, title: "Session 2", focus: "RDL, bench, pull",
    ex: [
      { id: "s2_rdl", key: "rdl", name: "Romanian deadlift", lo: 6, hi: 6, sets: 3, setsTxt: "2 to 3 sets", rest: 120, inc: 5, kind: "bar",
        cue: {
          setup: "Stand holding the bar at hip height, feet hip width, hands just outside your legs. Soft bend in the knees.",
          steps: [
            "Brace and push your hips straight back, letting the bar slide down your thighs.",
            "Keep the same slight knee bend and a flat back the whole way.",
            "Lower until you feel a strong stretch in your hamstrings, usually around mid shin.",
            "Drive your hips forward to stand back up, squeezing your glutes at the top.",
          ],
          avoid: "Rounding your lower back, bending your knees so it turns into a squat, or letting the bar drift away from your legs.",
          note: "Do 1 or 2 warm up sets before the heavy ones. Hex bar, trap bar or dumbbells are all good alternatives.",
        } },
      { id: "s2_jumplunge", key: "jumplunge", name: "Jump lunge", lo: 10, hi: 10, sets: 3, setsTxt: "2 to 3 sets", repsTxt: "10 total, 5 each leg", rest: 90, inc: 0, kind: "bw",
        cue: {
          setup: "Lunge position: one foot well forward, back knee just off the floor, chest up.",
          steps: [
            "Jump straight up, swinging your arms to help.",
            "Switch your legs in the air.",
            "Land softly on the balls of your feet into a lunge with the other leg forward.",
            "Go straight into the next rep without a pause.",
          ],
          avoid: "Your front knee caving inwards when you land, or drifting forward across the floor.",
          note: "Stay on the spot. Reverse lunges are fine if you're not confident with the jump.",
        } },
      { id: "s2_bench", key: "bench", name: "Barbell bench press", lo: 4, hi: 6, sets: 3, rest: 120, inc: 2.5, kind: "bar",
        cue: {
          setup: "Lie with your eyes under the bar. Squeeze your shoulder blades together and down, feet flat, slight arch in your upper back. Grip just wider than your shoulders.",
          steps: [
            "Unrack and hold the bar over your shoulders with straight arms.",
            "Lower under control to your lower chest, elbows about 45 degrees from your body.",
            "Touch your chest without bouncing.",
            "Press back up and slightly back towards your face to lockout.",
          ],
          avoid: "Elbows flared out at 90 degrees, bouncing the bar off your chest, or your bum lifting off the bench.",
          note: "Do 1 or 2 warm up sets. Use safety bars or a spotter on the heavy sets.",
        } },
      { id: "s2_fly", key: "fly", name: "Chest fly", lo: null, hi: null, sets: 2, rest: 90, inc: 2.5, kind: "machine", fail: true,
        cue: {
          setup: "Cables set at shoulder height, or a pec deck. Split stance if standing, with a slight bend in your elbows.",
          steps: [
            "Keeping that elbow bend fixed, bring your hands together in a wide arc in front of your chest.",
            "Squeeze your chest hard for a second.",
            "Open back out slowly until you feel a stretch across your chest.",
          ],
          avoid: "Bending and straightening your elbows so it turns into a press.",
          note: "Standing or seated both fine. Keep the arms curved, not bent to a right angle. Take both sets to failure.",
        } },
      { id: "s2_pulldown", key: "pulldown", name: "Lat pulldown", lo: 8, hi: 8, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: { ...PULLDOWN, note: "HHF's swap for pull ups when you can't do more than 4. Band assisted pull ups are the other option." } },
      { id: "s2_curl", key: "cablecurl", name: "Cable bicep curl", lo: 10, hi: 10, sets: 3, rest: 60, inc: 2.5, kind: "machine", ss: "B",
        cue: {
          setup: "Straight bar or EZ bar on a low cable. Stand close to the stack, elbows tucked against your sides.",
          steps: CURL_STEPS,
          avoid: CURL_AVOID,
          note: "Go straight into cable pushdowns, then rest.",
        } },
      { id: "s2_pushdown", key: "pushdown", name: "Cable tricep pushdown", lo: 10, hi: 10, sets: 3, rest: 60, inc: 2.5, kind: "machine", ss: "B",
        cue: {
          setup: "Rope or straight bar on a high cable. Stand tall, elbows pinned to your sides, slight forward lean.",
          steps: [
            "Push down until your arms are fully straight.",
            "Squeeze your triceps at the bottom. With a rope, pull the ends apart.",
            "Let the handle rise until your forearms pass parallel to the floor, elbows staying put.",
          ],
          avoid: "Elbows flaring or drifting forward, or leaning your bodyweight over the handle.",
          note: "Rest once you've done both exercises.",
        } },
    ],
    extra: { title: "Bike sprints", detail: "Assault bike or standard bike. 2 sets of 8 rounds: 20s sprint, 10s rest, with 2 to 3 min between sets.", placeholder: "Notes, e.g. level 12" },
  },
  {
    n: 3, title: "Session 3", focus: "Box squat, incline, rows",
    ex: [
      { id: "s3_boxsquat", key: "boxsquat", name: "Box squat", lo: 5, hi: 5, sets: 3, rest: 120, inc: 5, kind: "bar",
        cue: {
          setup: "Box behind you set just above your normal squat depth. Bar on your upper back, stance slightly wider than a normal squat.",
          steps: [
            "Brace, then sit your hips back and down slowly until you touch the box.",
            "Pause for a second while staying tight. Don't relax onto the box.",
            "Drive up fast, pushing your knees out.",
          ],
          avoid: "Crashing onto the box, rocking backwards on it, or bouncing off it.",
          note: "Steady on the way down, quick on the way up.",
        } },
      { id: "s3_incline", key: "inclinedb", name: "Incline dumbbell press", lo: 6, hi: 8, sets: 3, rest: 90, inc: 2, kind: "db",
        cue: {
          setup: "Bench at about 30 degrees. Dumbbells at shoulder height, shoulder blades pulled back, feet flat.",
          steps: [
            "Press the dumbbells up over your upper chest until your arms are straight.",
            "Lower slowly with your elbows about 45 degrees from your body.",
            "Go deep enough to feel a good stretch across your chest.",
          ],
          avoid: "Setting the bench too steep, which turns it into a shoulder press, or clanging the dumbbells together at the top.",
          note: "Going past 90 degrees at the elbow is fine.",
        } },
      { id: "s3_pendlay", key: "pendlay", name: "Pendlay row", lo: 5, hi: 5, sets: 3, rest: 90, inc: 2.5, kind: "bar",
        cue: {
          setup: "Bar on the floor over your midfoot. Hinge until your back is flat and close to parallel with the floor, slight knee bend, grip just wider than your shoulders.",
          steps: [
            "Pull the bar explosively off the floor to your lower chest or upper stomach.",
            "Drive your elbows back and squeeze your shoulder blades.",
            "Lower it back to the floor so it comes to a complete stop.",
            "Reset your brace before the next rep.",
          ],
          avoid: "Standing up as you pull, or bouncing the bar off the floor into the next rep.",
          note: "Quick, powerful reps, almost a cheat rep, but every rep starts from a dead stop.",
        } },
      { id: "s3_pulldown", key: "pulldown", name: "Lat pulldown", lo: 8, hi: 10, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: { ...PULLDOWN, note: "Chest up and don't round over at the bottom. Think pull with the elbows." } },
      { id: "s3_pop", key: "poppress", name: "Pop press up", lo: 5, hi: 10, sets: 3, rest: 90, inc: 0, kind: "bw",
        cue: {
          setup: "Press up position, hands just wider than your shoulders, body in a straight line from head to heels.",
          steps: [
            "Lower your chest towards the floor under control.",
            "Push up as hard as you can so your hands leave the floor.",
            "Land softly with your elbows bent and go straight into the next rep.",
          ],
          avoid: "Hips sagging, or landing on locked arms.",
          note: "Hands on a bench or box makes it easier. Quick, strong reps, and stop the set once they slow down.",
        } },
      { id: "s3_situp", key: "situp", name: "Decline sit up", lo: 10, hi: 12, sets: 3, rest: 60, inc: 2.5, kind: "bw",
        cue: {
          setup: "Decline bench at 30 to 45 degrees, feet hooked under the pads, knees bent. Hands across your chest.",
          steps: [
            "Brace your stomach and curl your torso up off the bench, chin tucked.",
            "Keep going until you're sitting upright.",
            "Lower back down slowly until the top of your back touches the bench.",
          ],
          avoid: "Pulling on your neck, or dropping back down fast.",
          note: "Hold a plate on your chest once 12 reps gets easy.",
        } },
    ],
    extra: { title: "Row for time", detail: "1000m on the rowing machine, flat out.", placeholder: "Time, e.g. 3:28" },
  },
  {
    n: 4, title: "Session 4", focus: "Lunge, press, arms",
    ex: [
      { id: "s4_lunge", key: "walklunge", name: "Walking lunge", lo: 12, hi: 12, sets: 3, repsTxt: "12 total", rest: 120, inc: 2, kind: "db",
        cue: {
          setup: "Stand tall with a dumbbell in each hand by your sides.",
          steps: [
            "Take a long step forward.",
            "Lower until your back knee gently touches the floor, front knee over your midfoot.",
            "Drive through your front heel to stand, bringing your back leg through into the next step.",
          ],
          avoid: "Short steps that push your front knee well past your toes, or that knee caving inwards.",
          note: "12 total, so 6 each leg.",
        } },
      { id: "s4_dbpress", key: "dbpress", name: "Dumbbell shoulder press", lo: 6, hi: 8, sets: 3, rest: 90, inc: 2, kind: "db",
        cue: {
          setup: "Sit on a bench with the back upright. Dumbbells at shoulder height, palms facing forward, elbows slightly in front of your body.",
          steps: [
            "Brace and press straight up until your arms lock out over your head.",
            "Lower slowly back to shoulder height or just below.",
          ],
          avoid: "Arching your lower back off the bench to get the weight up.",
          note: "Going past 90 degrees at the elbow is fine.",
        } },
      { id: "s4_cablerow", key: "cablerow", name: "Cable row", lo: 8, hi: 8, sets: 3, rest: 90, inc: 2.5, kind: "machine",
        cue: {
          setup: "Sit with your feet on the platform, knees slightly bent, back upright. V handle or close grip.",
          steps: [
            "Let your arms reach forward so your shoulder blades stretch apart.",
            "Pull the handle to your stomach, driving your elbows back and squeezing your shoulder blades together.",
            "Return slowly to a full stretch.",
          ],
          avoid: "Rocking your torso back and forth to move the weight.",
          note: "Get a good stretch and a good squeeze on every rep.",
        } },
      { id: "s4_shrug", key: "shrugs", name: "Shrugs", lo: 8, hi: 10, sets: 3, rest: 90, inc: 5, kind: "bar",
        cue: {
          setup: "Stand tall holding dumbbells by your sides, or a barbell at arm's length just outside your thighs.",
          steps: SHRUG_STEPS,
          avoid: SHRUG_AVOID,
          note: "Dumbbell or barbell.",
        } },
      { id: "s4_curl", key: "curl", name: "Bicep curl", lo: 5, hi: 10, sets: 3, rest: 60, inc: 1, kind: "db", ss: "C",
        cue: {
          setup: "Stand tall with dumbbells, a barbell or a cable, elbows tucked at your sides.",
          steps: CURL_STEPS,
          avoid: CURL_AVOID,
          note: "Dumbbell, barbell or cable. Go straight into skull crushers, then rest.",
        } },
      { id: "s4_skull", key: "skull", name: "Skull crusher", lo: 10, hi: 12, sets: 3, rest: 60, inc: 2.5, kind: "bar", ss: "C",
        cue: {
          setup: "Lie on a flat bench holding an EZ bar over your chest with straight arms.",
          steps: [
            "Tilt the bar back slightly so it sits over your forehead.",
            "Bending only at the elbows, lower it towards your forehead or just behind your head.",
            "Straighten your arms back to the start, elbows pointing at the ceiling.",
          ],
          avoid: "Elbows flaring out wide, or your upper arms swinging back and forth.",
          note: "An EZ bar is easiest on the wrists. Cable tricep pushdowns are the swap.",
        } },
    ],
    extra: { title: "Steady bike", detail: "20 to 40 minutes at 130 to 160 bpm.", placeholder: "Minutes and avg HR" },
  },
];

export const LIFT_NAMES: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  PLAN.forEach(s => s.ex.forEach(e => { if (!m[e.key]) m[e.key] = e.name; }));
  m.shrugs = "Shrugs"; m.curl = "Bicep curl"; m.pulldown = "Lat pulldown"; m.dbshrugs = "Dumbbell shrugs";
  return m;
})();

// s = the session suggested for that day
export const WEEK = [
  { d: "M", t: "S1", c: "gym", s: 1 },
  { d: "T", t: "Rugby", c: "rugby", s: 0 },
  { d: "W", t: "S2", c: "gym", s: 2 },
  { d: "T", t: "Rugby", c: "rugby", s: 0 },
  { d: "F", t: "S3", c: "gym", s: 3 },
  { d: "S", t: "Game", c: "game", s: 0 },
  { d: "S", t: "S4/Rest", c: "rest", s: 4 },
] as const;

export const SESSION_DAY: Record<number, string> = { 1: "Mon", 2: "Wed", 3: "Fri", 4: "Sun" };

export function findExercise(id: string): Exercise | undefined {
  for (const s of PLAN) for (const e of s.ex) if (e.id === id) return e;
  return undefined;
}
