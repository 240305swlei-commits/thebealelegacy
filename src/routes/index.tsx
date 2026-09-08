import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import imgTrench from "@/assets/scene-trench.gif";
import imgBanquet from "@/assets/scene-banquet.gif";
import imgGallery from "@/assets/scene-gallery.gif";
import imgInterrogation from "@/assets/scene-interrogation.gif";
import imgVilla from "@/assets/scene-villa.gif";
import imgWell from "@/assets/scene-well.gif";
import imgConfession from "@/assets/scene-confession.gif";
import imgCorridor from "@/assets/scene-corridor.gif";
import imgCourtroom from "@/assets/scene-courtroom.gif";
import imgRain from "@/assets/scene-rain.gif";
import { NoirScore, type TrackId } from "@/lib/score";

const SCENE_TRACKS: Record<string, TrackId> = {
  ending_mastermind: "triumph",
  ending_tragic: "tragic",
  ending_above_law: "above_law",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Somme Echoes — A 1940s Noir Mystery Game" },
      {
        name: "description",
        content:
          "London, 1943. A banquet, two bodies, and a detective who already knows the killer. Rewind time with the pocket watch and change your past choices to unlock three very different endings.",
      },
      { property: "og:title", content: "The Somme Echoes — A 1940s Noir Mystery Game" },
      {
        property: "og:description",
        content:
          "A branching noir detective game. Collect evidence, forge your alibi, rewind time — and decide how William Beale's story ends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

type Flags = {
  found_hidden_letter: boolean;
  failed_alibi_check: boolean;
};

const INITIAL_FLAGS: Flags = {
  found_hidden_letter: false,
  failed_alibi_check: false,
};

type Item = { name: string; detail: string };

type Effect = {
  flags?: Partial<Flags>;
  items?: Item[];
};

type Choice = { label: string; next: string; effect?: Effect; note?: string };

type Scene = {
  chapter?: string;
  title?: string;
  text: string;
  dialogue?: { speaker: string; line: string };
  choices: Choice[];
  onEnter?: Effect;
  fatal?: boolean;
  ending?: boolean;
  /** resolve the next scene from the flags instead of a fixed id */
  resolveEnding?: boolean;
};

const ENDING_GATE = "__ending__";

/* ------------------------------------------------------------------ */
/* Story graph                                                         */
/* ------------------------------------------------------------------ */

const SCENES: Record<string, Scene> = {
  prologue: {
    chapter: "Background — The Somme, July 1916",
    title: "The Promise",
    text: "July 1916, the Battle of the Somme. Smoke and the heavy stench of gunpowder fill the battlefield air. The sky is cut by the roar of German bombers, and thunderous artillery shakes the muddy earth. Corpses lie scattered on the ground; countless lives vanish in an instant, leaving only coldness and loneliness.\n\nTwo young British soldiers crawl through the trenches as enemy planes drop bombs one after another. Suddenly one throws himself over the other, shielding him with his own body. It is not a direct hit — but the soldier on top is mortally wounded.",
    dialogue: {
      speaker: "Dickens",
      line: "Jack… stay alive. Go to the Baker Street Orphanage. Please — take good care of my children, Emma and William.",
    },
    choices: [{ label: "Twenty-seven years pass…", next: "ch1_arrive" }],
  },

  ch1_arrive: {
    chapter: "Chapter One — The Banquet",
    title: "The Invitation",
    text: "July 11, 1943, a grand London manor. Guests in evening gowns and sparkling jewelry walk a marble corridor toward the banquet hall, warm light on the polished floor. The host is your adoptive father, Jack Vernon Beale — now a senior official in the Ministry of Production. Nominally a victory celebration; covertly, a night to secure lucrative kickbacks from American suppliers under the Lend-Lease Act.\n\nYou are William Vernon Beale — a detective of some reputation, and, in the hours the world does not see, an arms dealer smuggling wartime munitions and undercutting his own father's business. Your car was delayed. The banquet began at nine; it is now a quarter past, and every eye in the hall turns as you enter. Exactly as you intended.",
    dialogue: {
      speaker: "The Butler",
      line: "Young master, why did you bring an invitation? Come — let me store your coat.",
    },
    onEnter: {
      items: [{ name: "Engraved Invitation", detail: "Signed by Jack Vernon Beale, 11 July 1943." }],
    },
    choices: [
      { label: "Slip in quietly through the servants' door, unnoticed", next: "dead_alibi" },
      { label: "Wait in the car until the toasts are over", next: "dead_late" },
      { label: "Let the butler note your arrival, loudly", next: "ch1_banquet" },
    ],
  },

  dead_alibi: {
    title: "A Quiet Entrance",
    text: "You slip past the cloakroom without a word. No one marks your arrival.\n\nThe next morning, when the police reconstruct the night, nobody can say when you came in — or where you stood when the shots were fired. To them, an unmarked guest is not a guest at all.\n\nHe is a suspect.",
    fatal: true,
    choices: [],
  },

  dead_late: {
    title: "The Empty Hour",
    text: "You sit in the dark of the car and let the toasts pass, watching the windows glow. It is almost peaceful.\n\nBut a plan built on minutes cannot afford an hour. By the time you enter, the gallery has closed, Emma has gone upstairs on Leo's arm, and Jack's door is locked.\n\nThe night you rehearsed for twenty-seven years happens without you.",
    fatal: true,
    choices: [],
  },

  ch1_banquet: {
    chapter: "Chapter One — The Banquet",
    title: "Champagne and Candlelight",
    text: "Dish after dish arrives — Italian pasta, French foie gras, German sausages — each a work of art. Dancers, musicians and a mysterious magician hold the guests entranced, as if they were in a dream. Upstairs, behind a closed door, Jack argues with arms men about contracts, quotas, and a son who has been stealing his business.\n\nAs the night deepens, the banquet reaches its climax and the elderly butler steps onto the landing.",
    dialogue: {
      speaker: "The Butler",
      line: "The master is temporarily occupied, but the true essence of the banquet is about to be revealed. Please follow me to the gallery.",
    },
    choices: [{ label: "Follow the guests to the gallery", next: "ch1_gallery" }],
  },

  ch1_gallery: {
    chapter: "Chapter One — The Banquet",
    title: "The Painting",
    text: "The gallery houses a famous painting that has hung here for years. The guests murmur in admiration.\n\n\"I didn't expect to see her here again,\" you whisper to no one.\n\nHalf an hour slips by. On your way back you see a young lady beside a man of the same age — she is disheveled, tear-streaked; he is drunk and steering her toward a closed door. You step in. She politely refuses your help. You offer strong tea instead, and she accepts it.\n\nFive minutes later the arguing inside the room dies down.",
    onEnter: {
      items: [{ name: "Cup of Strong Tea", detail: "Served warm. Spiked with Jack's sleeping pills." }],
    },
    choices: [{ label: "Slip into the room", next: "ch1_bathroom" }],
  },

  ch1_bathroom: {
    chapter: "Chapter One — The Banquet",
    title: "The Alibi",
    text: "It is done. Emma will not wake again, and Leo's identical Webley now rests in her hand while yours goes into your coat.\n\nNow you need the second half of the night: an alibi loud enough that two hundred guests will swear where you were. You walk into the washroom corridor, where your business partner Mr. Joseph is straightening his tie at the mirror.\n\nHow hard do you push him?",
    dialogue: {
      speaker: "Mr. Joseph",
      line: "Beale. You look pale. Too much champagne, or too much conscience?",
    },
    choices: [
      {
        label: "Deliberately insult him and shove him hard — make a scene the whole floor hears",
        next: "ch2_knock",
        note: "Perfect alibi locked",
        effect: {
          flags: { failed_alibi_check: false },
          items: [{ name: "Witnessed Quarrel", detail: "A dozen guests saw you nearly come to blows with Joseph." }],
        },
      },
      {
        label: "Step politely away with the slightest brush of his shoulder",
        next: "ch2_knock",
        note: "Weak alibi",
        effect: { flags: { failed_alibi_check: true } },
      },
    ],
  },

  ch2_knock: {
    chapter: "Chapter Two — The Knock",
    title: "Two Officers",
    text: "You return to your apartment near the manor and sleep, as a man with nothing to hide would.\n\nMorning. Knock, knock.\n\nTwo officers stand at your door — one young and eager, one senior and quiet. There has been a murder.",
    dialogue: {
      speaker: "Young Officer",
      line: "Sir, you misunderstand. The deceased is Mr. Jack Vernon Beale. Your adoptive father.",
    },
    choices: [
      { label: "Stagger — then compose yourself and demand to assist", next: "ch2_interrogate" },
      { label: "Break down and refuse to answer questions", next: "dead_grief" },
    ],
  },

  dead_grief: {
    title: "Too Much Grief",
    text: "You collapse against the doorframe and wave the officers away. Your grief is theatrical — and these officers have seen theatrical grief before.\n\nAn heir to an arms fortune, alone, refusing to give a statement the morning after a murder. The senior officer writes one line in his notebook: 'Bring him in.'",
    fatal: true,
    choices: [],
  },

  ch2_interrogate: {
    chapter: "Chapter Two — The Knock",
    title: "The Interrogation",
    text: "At the station you truthfully recite your timeline: fifteen minutes late from an accident on the road; an upstairs disagreement with your father over business; the banquet; bumping the butler while dancing; the gallery; an upset stomach; the washroom corridor and Mr. Joseph; Miss Mary disheveled and her husband strangely elated; the cup of tea; then home.\n\nThe young officer nods to the senior one — your story checks out. But the senior officer lets the silence stretch before he speaks.",
    dialogue: {
      speaker: "Senior Detective",
      line: "You're lying. You were obviously drunk — how do you remember all of this so clearly?",
    },
    choices: [
      { label: "\"Officer, I am a detective. A good memory is essential.\"", next: "ch2_letters" },
      { label: "Panic and start revising your story", next: "dead_story" },
    ],
  },

  dead_story: {
    title: "The Story Shifts",
    text: "\"Well — perhaps it was half past, not a quarter. Or was I in the restroom before the gallery? No, after—\"\n\nEvery revision is a thread, and the senior officer pulls each one. By the second interview your timeline has more holes than the trench lines of '16.",
    fatal: true,
    choices: [],
  },

  ch2_letters: {
    chapter: "Chapter Two — The Knock",
    title: "The Threatening Letters",
    text: "\"Did you hear any gunshots?\"\n\n\"I did. But everyone knows my adoptive father has a hobby of target shooting. He made a target in his room and practices when he's free. Gunshots in that house are furniture.\"\n\nThe young officer nods; your statement checks out. Then another officer enters, holding several envelopes found in the estate's mail.",
    dialogue: {
      speaker: "The Letters",
      line: "I know who you are. You will not survive this month.",
    },
    onEnter: {
      items: [{ name: "Threatening Letters", detail: "Elegant hand. Addressed to you — though the police do not know that." }],
    },
    choices: [{ label: "Accompany the police to the villa", next: "ch3_villa" }],
  },

  ch3_villa: {
    chapter: "Chapter Three — The Villa",
    title: "Two Bodies",
    text: "In the first-floor bedroom lies a woman's body — slap marks across her face, bruising at the abdomen. On the second floor lies Jack Vernon Beale. Both have gunshot wounds to the temple, the skin around them slightly charred.\n\nThe officer lifts a photograph from the floor: a young father, a dying mother, two children. On the back — 'Dickens Family.' He finds a ring in the woman's pocket that matches the mother's in the picture.",
    dialogue: {
      speaker: "Senior Detective",
      line: "Unfortunately, sir… this lady is very likely your missing sister.",
    },
    onEnter: {
      items: [{ name: "Family Photograph", detail: "The Dickens family. You left it beside Jack yourself." }],
    },
    choices: [
      {
        label: "Examine Emma's pockets casually, and weep for the police",
        next: "ch3_gun",
        note: "You keep your hands clean",
        effect: { flags: { found_hidden_letter: false } },
      },
      {
        label: "Risk being noticed — search deep beneath her corset",
        next: "ch3_gun",
        note: "You pocket something",
        effect: {
          flags: { found_hidden_letter: true },
          items: [
            {
              name: "Blood-Stained Letter",
              detail: "Folded parchment from Emma's corset. Still sealed. Still unread.",
            },
          ],
        },
      },
    ],
  },

  ch3_gun: {
    chapter: "Chapter Three — The Villa",
    title: "The Wrong Caliber",
    text: "You weep beside her pale cheek until the officer gently lifts you up. An Adams revolver rests in her hand, one round missing from the cylinder.\n\nOne detail matters more than any other, and only you can afford to point it out.",
    choices: [
      { label: "\"The temple wound doesn't match this caliber. She was murdered.\"", next: "ch4_forensic" },
      { label: "Say nothing about the gun", next: "dead_silence" },
    ],
  },

  dead_silence: {
    title: "The Detail You Kept",
    text: "You look at the Adams revolver and keep your observation to yourself. But the young officer is sharper than he looks — he sees your eyes fix on the wound, then the gun, then look away.\n\nA detective who hides evidence has only one reason to do so.",
    fatal: true,
    choices: [],
  },

  ch4_forensic: {
    chapter: "Chapter Four — The Theory",
    title: "Pollen and Pills",
    text: "\"When I touched my sister, I caught a faint scent of pollen.\" A forensic examiner is brought in; the report confirms she was drugged before her death.\n\nYou assemble the theory the police need: Mary was given to Mr. Jack as a gift by her husband, Mr. Leo — an investigator for the War Economy Board — in exchange for lucrative military contracts. Jack violated her. She accidentally dropped the family photograph, Jack's inner defenses shattered, and knowing he had betrayed your father, he shot himself in despair. Mary woke full of resentment, confronted Leo, and Leo beat her, then feigned apology, lured her into a room, murdered her, and faked her suicide.\n\nUpstairs the officers find a standard-issue Webley revolver missing two rounds.",
    dialogue: {
      speaker: "William Beale",
      line: "A Webley is a staple among military men. Both my father and Leo are in the trade — both would own one.",
    },
    choices: [
      { label: "Present the theory: Leo is the killer", next: "ch5_search" },
      { label: "Accuse the elderly butler instead", next: "dead_butler" },
    ],
  },

  dead_butler: {
    title: "The Wrong Man",
    text: "You build an elaborate case against the butler. The senior officer dismantles it in four sentences — the man poured champagne in front of two hundred witnesses all night.\n\n\"Strange that a detective of your talents would build a case that collapses this fast. Unless you needed it to.\"",
    fatal: true,
    choices: [],
  },

  ch5_search: {
    chapter: "Chapter Five — The Search",
    title: "Something Too Convenient",
    text: "Leo is dragged in, protesting. The young officer promises the second Webley will seal his guilt, and the station empties into the search.\n\nOnly the senior detective stays behind, turning it over: Emma's identity, the two spent rounds, the letters. Everything fits a little too well. He looks across the lobby at you.",
    choices: [
      { label: "Hold his gaze, calm as still water", next: "ch6_well" },
      { label: "Look away and hurry home", next: "dead_gaze" },
    ],
  },

  dead_gaze: {
    title: "The Man Who Looked Away",
    text: "You drop your eyes and reach for your coat. Two seconds — and in that gesture the senior officer reads an entire confession.\n\nHe never proves anything. He doesn't need to. There are prisons without walls.",
    fatal: true,
    choices: [],
  },

  ch6_well: {
    chapter: "Chapter Six — The Verdict",
    title: "The Well",
    text: "Divers dredge a damaged Webley from a well near the villa, one round short. Leo's guilt is sealed, and days later he is sentenced to hang.\n\nThe senior detective watches you across the courtroom. You shake your head, walk over, and whisper into his ear:\n\n\"I told you from the start — you found the right person.\"",
    choices: [{ label: "Chapter Seven — the truth", next: "ch7_truth" }],
  },

  ch7_truth: {
    chapter: "Chapter Seven — The Right Person",
    title: "The Perfect Crime",
    text: "Yes. The police really had found the right person.\n\nYou arrived a few minutes late so the housekeeper would remember your arrival time. You took advantage of Jack's discussion with other arms dealers to slip into his room and steal his pistol and sleeping pills.\n\nYou knew Jack would do something bad to Mary, and you knew the threatening letter was actually written to you — by your dear sister. She knew you were an arms dealer too, secretly smuggling wartime munitions and stealing your adoptive father's business. Selling guns on the black market during the war had made you a fortune.\n\nAfter the painting, you found your sister. She panicked, thinking you had discovered her identity — then relaxed over the tea. Five minutes later, when the arguing died down, you sneaked in. The drug in the tea was brilliant; they never imagined Emma would be knocked unconscious a second time. You killed her with the stolen pistol, and seeing that fool Leo carried the same type of Webley, you swapped his gun into her hands — your paranoid sister's own Adams revolver let Leo believe he might have killed her drunk and stage her suicide. Then the bathroom conflict with Joseph for your alibi, upstairs to 'discuss' with Jack, one shot while the guests danced below, and the photograph to fake his guilty suicide.\n\nOf course, Jack would never commit suicide over such a \"small matter.\"",
    resolveEnding: true,
    choices: [{ label: "See how your night truly ends", next: ENDING_GATE }],
  },

  /* --------------------------- ENDINGS --------------------------- */

  ending_mastermind: {
    chapter: "Ending I",
    title: "The Mastermind's Triumph",
    text: "The gavel struck the sound block with a heavy, final thud, echoing through the grand, solemn courtroom of the Old Bailey. Leo, trembling and pale as a ghost, was dragged away by two burly guards, his desperate pleas for mercy drowning in the murmurs of the gallery. He was sentenced to hang by the neck until dead. I stood up slowly, adjusting the lapels of my bespoke suit, masking my cold satisfaction with a perfectly rehearsed expression of solemn grief. As I walked out into the dimly lit corridor of the courthouse, the senior detective was waiting for me. His eyes, weathered and sharp, bored into mine as if trying to scrape away the lies.\n\n\"You won this time, Beale,\" he rasped, his voice thick with suppressed fury and exhaustion. \"But I know. The timing, the Webley in the well, the threatening letters… it's all too perfect. One day, you will slip, and I will be there.\"\n\nI simply stopped, tilted my fedora, and stepped closer to him. Leaning in, I whispered softly into his ear, \"I have always said, Inspector, that you found the right person. You just didn't have the stomach to catch him.\" I turned away, ignoring his clenched fists, and walked out the heavy oak doors.\n\nOutside, the London sky was weeping, a cold drizzle washing the cobblestone streets of the city. I lit a cigarette, the flare of the match briefly illuminating the dark alleyway. I had done it. I had flawlessly eliminated the only threats to my empire. Jack's restrictive morality was gone, and Emma's dangerous knowledge was buried with her. The black market military contracts were now solely in my hands, a steady river of gold flowing from the blood of the ongoing war. I took a deep drag of the tobacco, the smoke filling my lungs like the cordite on the Somme all those years ago. But this time, I wasn't the helpless orphan left crying in the mud. I was the king, and the shadows of this city were mine to rule.",
    ending: true,
    choices: [],
  },

  ending_tragic: {
    chapter: "Ending II",
    title: "The Tragic Truth",
    text: "My hands trembled slightly as I continued the charade of searching my sister's cold, lifeless body under the guise of a grieving brother. Beneath the silk lining of her ruined dress, tucked discreetly against her corset, my fingers brushed against a folded piece of parchment. It was stained with a single drop of her blood. Shielding it from the prying eyes of the police officers bustling around the crime scene, I slipped it into my pocket. It wasn't until hours later, sitting in the suffocating silence of my dark apartment, that I dared to unfold it.\n\nThe elegant handwriting was unmistakably Emma's. \"My dearest William, if you are reading this, I pray you are already miles away from London. Jack knows everything. He knows about your smuggling routes and the black market munitions. The War Economy Board is closing in, and Jack has struck a deal with Leo to hand you over as a scapegoat to save his own empire. I wrote that threatening letter not to extort you, but to terrify you into fleeing. I could not tell you the truth, for I knew your pride would make you stay and fight. Please, brother, run. I will hold them off as long as I can. Just live.\"\n\nThe paper slipped from my numb fingers, fluttering to the floor like a dying moth. A deafening roar rushed into my ears — not the sound of the London traffic, but the thunderous artillery blasts of the Somme. I saw my father's face, covered in mud and blood, sacrificing his own flesh to save Jack. And now, I had coldly, calculatingly, put a bullet through the brain of the only person in the world who genuinely loved me, the sister who had tried to throw herself over the bomb to save me. The guilt was a physical agony, tearing at my chest, suffocating me with its weight. I slowly walked over to my desk and picked up Emma's small Adams revolver, the one I had so cleverly manipulated to frame Leo. I raised the cold steel to my own temple. My father had died to give us life, and I had turned that life into a grotesque nightmare. \"I'm sorry, Emma,\" I whispered to the empty room. The gun fired, and the nightmare finally ended.",
    ending: true,
    fatal: true,
    choices: [],
  },

  ending_above_law: {
    chapter: "Ending III",
    title: "Above the Law",
    text: "\"It doesn't add up, Mr. Beale,\" the young police officer said, his voice surprisingly firm, echoing loudly in the cramped, sterile interrogation room. He had entirely dropped his previously naive demeanor, slamming a manila folder onto the metal table. The senior detective stood silently in the dim corner, his eyes wary, perhaps already sensing the dark and dangerous waters they were treading into. But the young officer was fueled by a reckless, naive thirst for justice. \"Your timeline is a mess. We spoke to Mr. Joseph, and he vehemently denies any physical altercation near the restrooms. He says you merely brushed past him and walked away. There was no 'near fight' to keep you occupied while the shots were fired upstairs.\"\n\nI maintained my composure, but a cold bead of sweat trickled down my spine. I had underestimated this rookie; I hadn't pushed Joseph hard enough to create a lasting scene. Before I could formulate a counter-lie, the young officer slammed his hands on the table. \"William Vernon Beale, I am officially holding you for the murders of Jack Vernon Beale and Emma Dickens. You are not leaving this station.\" The cold steel of the handcuffs clicked around my wrists with a brutal finality. I was thrown into a damp, windowless holding cell, the reality of the gallows looming heavily over me.\n\nBut the young officer fundamentally misunderstood how the world truly operated during wartime. He believed in absolute justice; I believed in leverage and power. I spent exactly forty-eight hours in that cell, waiting patiently in the dark.\n\nOn the morning of the third day, the heavy iron door finally swung open. A high-ranking official from the Ministry of Defense stood there, flanked by my expensive lawyers. The senior detective was there too, looking defeated but unsurprised, holding my tailored coat. The young officer, however, was noticeably absent.\n\n\"Lack of conclusive physical evidence, and a tragic loss of the lead investigator,\" the Ministry official declared flatly, handing over the official release papers. My syndicate — a vast web of corrupt politicians and black-market arms buyers who relied on my supply lines — had simply pulled the necessary strings.\n\nI walked out into the foggy London morning as a free man. It wasn't until I was sipping a vintage Scotch in my penthouse office that I saw the evening paper. A small headline on the third page caught my eye: Tragic Accident: Young Scotland Yard Officer Found Dead in the Thames. He had apparently slipped and fallen into the freezing river late last night. I slowly folded the newspaper, took a deep sip of the smoky liquor, and looked out over the sprawling, ignorant city. In a world burning with war, naive justice was a fatal flaw, and I was the wealthiest survivor in the market.",
    ending: true,
    choices: [],
  },
};

const START_SCENE = "prologue";

function resolveEnding(flags: Flags): string {
  if (flags.found_hidden_letter) return "ending_tragic";
  if (flags.failed_alibi_check) return "ending_above_law";
  return "ending_mastermind";
}

const SCENE_IMAGES: Record<string, { src: string; alt: string }> = {
  prologue: { src: imgTrench, alt: "A soldier shields another in a trench as bombs fall" },
  ch1_arrive: { src: imgBanquet, alt: "A candlelit banquet hall full of guests" },
  dead_alibi: { src: imgBanquet, alt: "A candlelit banquet hall full of guests" },
  ch1_banquet: { src: imgBanquet, alt: "A candlelit banquet hall full of guests" },
  ch1_gallery: { src: imgGallery, alt: "Guests gaze at a portrait in a dark gallery" },
  ch1_bathroom: { src: imgGallery, alt: "A dim corridor outside the gallery" },
  ch2_knock: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  dead_grief: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  ch2_interrogate: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  dead_story: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  ch2_letters: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  ch3_villa: { src: imgVilla, alt: "A photograph and revolver on dark floorboards" },
  ch3_gun: { src: imgVilla, alt: "A photograph and revolver on dark floorboards" },
  dead_silence: { src: imgVilla, alt: "A photograph and revolver on dark floorboards" },
  ch4_forensic: { src: imgVilla, alt: "A photograph and revolver on dark floorboards" },
  dead_butler: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  ch5_search: { src: imgWell, alt: "Police dredge a revolver from a well at night" },
  dead_gaze: { src: imgInterrogation, alt: "A young man questioned by two detectives under a lamp" },
  ch6_well: { src: imgWell, alt: "Police dredge a revolver from a well at night" },
  ch7_truth: { src: imgConfession, alt: "A detective whispers to a man beneath a streetlamp" },
  ending_mastermind: { src: imgConfession, alt: "A man in a fedora walking into the London rain" },
  ending_tragic: { src: imgVilla, alt: "A revolver and a bloodstained letter on a desk" },
  ending_above_law: { src: imgInterrogation, alt: "An interrogation room lit by a single lamp" },
};

/* ------------------------------------------------------------------ */
/* Typewriter                                                          */
/* ------------------------------------------------------------------ */

function useTypewriter(text: string) {
  const [len, setLen] = useState(0);
  const done = len >= text.length;

  useEffect(() => {
    setLen(0);
    const id = window.setInterval(() => {
      setLen((l) => {
        if (l >= text.length) {
          window.clearInterval(id);
          return l;
        }
        return l + 3;
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [text]);

  const skip = useCallback(() => setLen(text.length), [text]);
  return { shown: text.slice(0, len), done, skip };
}

/* ------------------------------------------------------------------ */
/* Game                                                                */
/* ------------------------------------------------------------------ */

type Snapshot = { id: string; flags: Flags; items: Item[] };

function applyEffect(
  effect: Effect | undefined,
  flags: Flags,
  items: Item[],
): { flags: Flags; items: Item[] } {
  if (!effect) return { flags, items };
  const nextFlags = { ...flags, ...(effect.flags ?? {}) };
  const nextItems = [...items];
  for (const it of effect.items ?? []) {
    if (!nextItems.some((x) => x.name === it.name)) nextItems.push(it);
  }
  return { flags: nextFlags, items: nextItems };
}

function makeStart(): Snapshot {
  const base = applyEffect(SCENES[START_SCENE]!.onEnter, INITIAL_FLAGS, []);
  return { id: START_SCENE, ...base };
}

function Index() {
  const [history, setHistory] = useState<Snapshot[]>(() => [makeStart()]);
  const [panel, setPanel] = useState<null | "inventory" | "timeline">(null);
  const [flashKey, setFlashKey] = useState(0);

  const current = history[history.length - 1]!;
  const scene = SCENES[current.id]!;
  const image = SCENE_IMAGES[current.id];
  const { shown, done, skip } = useTypewriter(scene.text);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
    if (scene.fatal) setFlashKey((k) => k + 1);
  }, [current.id, scene.fatal]);

  /* ------------------------ score ------------------------ */
  const scoreRef = useRef<NoirScore | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const score = new NoirScore();
    scoreRef.current = score;
    const kick = () => score.start();
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      score.stop();
      scoreRef.current = null;
    };
  }, []);

  useEffect(() => {
    scoreRef.current?.setTrack(SCENE_TRACKS[current.id] ?? "mystery");
  }, [current.id]);

  useEffect(() => {
    scoreRef.current?.setMuted(muted);
  }, [muted]);


  const go = (choice: Choice) => {
    const afterChoice = applyEffect(choice.effect, current.flags, current.items);
    const nextId =
      choice.next === ENDING_GATE ? resolveEnding(afterChoice.flags) : choice.next;
    const afterEnter = applyEffect(SCENES[nextId]!.onEnter, afterChoice.flags, afterChoice.items);
    setHistory((h) => [...h, { id: nextId, ...afterEnter }]);
  };

  const rewind = (index: number) => {
    setHistory((h) => h.slice(0, index + 1));
    setPanel(null);
  };

  const restart = () => {
    setHistory([makeStart()]);
    setPanel(null);
  };

  const flagList = useMemo(
    () => [
      { key: "Alibi", value: current.flags.failed_alibi_check ? "Weak — Joseph barely noticed" : "Airtight — a scene was made" },
      { key: "Hidden letter", value: current.flags.found_hidden_letter ? "In your coat pocket" : "Never searched for" },
    ],
    [current.flags],
  );

  return (
    <main
      className="vignette grain relative min-h-screen bg-noir-bg font-typewriter text-noir-ink"
      style={{ animation: "lamp-flicker 7s linear infinite" }}
    >
      {scene.fatal && flashKey > 0 && (
        <div
          key={flashKey}
          className="animate-red-flash pointer-events-none fixed inset-0 z-50 bg-noir-blood-bright"
        />
      )}
      <div className="smoke pointer-events-none fixed inset-0 z-0" />

      {/* top-right controls */}
      <div className="fixed right-3 top-3 z-40 flex items-center gap-2 sm:right-5 sm:top-5">
        <button
          onClick={() => {
            scoreRef.current?.start();
            setMuted((m) => !m);
          }}
          aria-label={muted ? "Turn music on" : "Mute music"}
          title={muted ? "Music off — tap to play" : "Music on — tap to mute"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-noir-brass/40 bg-noir-bg-raised/80 text-noir-brass backdrop-blur transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" />
            {muted ? (
              <path d="M16 9.5l5 5M21 9.5l-5 5" />
            ) : (
              <path d="M15.5 9.5a4.2 4.2 0 0 1 0 5M18.2 7.2a7.4 7.4 0 0 1 0 9.6" />
            )}
          </svg>
        </button>
        <button
          onClick={() => setPanel(panel === "inventory" ? null : "inventory")}
          aria-label="Open case file and inventory"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-noir-brass/40 bg-noir-bg-raised/80 text-noir-brass backdrop-blur transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h5l1.5 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
          </svg>
        </button>
        <button
          onClick={() => setPanel(panel === "timeline" ? null : "timeline")}
          aria-label="Open the pocket watch timeline"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-noir-brass/40 bg-noir-bg-raised/80 text-noir-brass backdrop-blur transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3.5v-1.2M10 2.3h4" />
            <circle cx="12" cy="13" r="7.5" />
            <path d="M12 9.5V13l2.5 1.8" />
          </svg>
        </button>
      </div>

      {/* slide-out panel */}
      <>
        {panel && (
          <>
            <div
              className="animate-fade-in fixed inset-0 z-40 bg-noir-bg/70 backdrop-blur-[2px]"
              onClick={() => setPanel(null)}
            />
            <aside
              key={panel}
              className="animate-slide-in-right fixed right-0 top-0 z-50 flex h-full w-[min(23rem,90vw)] flex-col border-l border-noir-brass/30 bg-noir-bg-raised/95 p-6 pt-20 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur"
            >
              <h2 className="font-noir text-lg italic text-noir-brass">
                {panel === "inventory" ? "Case File" : "The Pocket Watch"}
              </h2>
              <div className="mt-1 h-px w-16 bg-noir-blood" />

              <div className="mt-6 flex-1 overflow-y-auto pr-1">
                {panel === "inventory" ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim">Evidence</p>
                      <ul className="mt-3 space-y-3">
                        {current.items.length === 0 && (
                          <li className="text-sm text-noir-ink-dim">Your pockets are empty.</li>
                        )}
                        {current.items.map((it) => (
                          <li key={it.name} className="border border-noir-brass/25 bg-noir-bg/60 p-3">
                            <p className="text-sm text-noir-brass">{it.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-noir-ink-dim">{it.detail}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim">Standing</p>
                      <ul className="mt-3 space-y-2">
                        {flagList.map((f) => (
                          <li key={f.key} className="text-xs leading-relaxed text-noir-ink/90">
                            <span className="text-noir-blood-bright">{f.key}: </span>
                            {f.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs leading-relaxed text-noir-ink-dim">
                      Turn the hands back. Choose any moment you have lived and play it differently — every
                      choice after it will be forgotten.
                    </p>
                    <ol className="mt-5 space-y-1">
                      {history.map((h, i) => {
                        const s = SCENES[h.id]!;
                        const isNow = i === history.length - 1;
                        return (
                          <li key={`${h.id}-${i}`} className="relative pl-6">
                            <span className="absolute left-[7px] top-0 h-full w-px bg-noir-brass/25" />
                            <span
                              className={`absolute left-0 top-3 h-[15px] w-[15px] rounded-full border ${
                                isNow
                                  ? "border-noir-blood-bright bg-noir-blood-bright/70"
                                  : "border-noir-brass/50 bg-noir-bg"
                              }`}
                            />
                            <button
                              disabled={isNow}
                              onClick={() => rewind(i)}
                              className={`w-full py-2 text-left text-sm transition-colors ${
                                isNow
                                  ? "cursor-default text-noir-blood-bright"
                                  : "text-noir-ink/85 hover:text-noir-brass"
                              }`}
                            >
                              <span className="block text-[10px] uppercase tracking-[0.25em] text-noir-ink-dim">
                                {s.chapter ?? "A wrong turn"}
                              </span>
                              {s.title ?? h.id}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                    <button
                      onClick={restart}
                      className="mt-8 w-full border border-noir-brass/50 px-4 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:bg-noir-blood/20 hover:text-noir-blood-bright"
                    >
                      Wind back to 1916
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-14 sm:px-6 sm:py-20">
        <div ref={topRef} />
        <header className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-noir-ink-dim">
            An Interactive Noir Mystery
          </p>
          <h1 className="mt-2 font-noir text-2xl font-bold italic text-noir-brass sm:text-3xl">
            The Somme Echoes
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-noir-blood" />
        </header>

        <section
          key={current.id + history.length}
          className="animate-fade-in flex flex-1 flex-col"
        >
            {image && (
              <figure className="mb-8 border border-noir-brass/25 p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                <img
                  src={image.src}
                  alt={image.alt}
                  width={1280}
                  height={720}
                  loading="lazy"
                  className="w-full object-cover opacity-90 sepia-[0.25]"
                />
              </figure>
            )}

            {scene.chapter && (
              <p className="mb-1 text-[11px] uppercase tracking-[0.3em] text-noir-blood-bright">
                {scene.chapter}
              </p>
            )}
            {scene.title && (
              <h2
                className={`mb-6 font-noir text-xl italic sm:text-2xl ${
                  scene.fatal || scene.ending ? "animate-tremble text-noir-blood-bright" : "text-noir-ink"
                }`}
              >
                {scene.title}
              </h2>
            )}

            <div
              onClick={skip}
              className={`cursor-pointer whitespace-pre-line text-[15px] leading-relaxed text-noir-ink/90 sm:text-base ${
                done ? "" : "caret"
              }`}
              aria-live="polite"
            >
              {shown}
            </div>

            {/* dialogue plate */}
            {scene.dialogue && done && (
              <div
                className="animate-fade-in mt-8 border-l-2 border-noir-blood-bright bg-noir-bg-raised/70 px-5 py-4"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-noir-brass">
                  {scene.dialogue.speaker}
                </p>
                <p className="mt-2 font-noir text-base italic leading-relaxed text-noir-ink">
                  “{scene.dialogue.line}”
                </p>
              </div>
            )}

            {/* choice cards */}
            <div className="mt-10 flex flex-col gap-3">
              {done &&
                !scene.fatal &&
                !scene.ending &&
                scene.choices.map((c, i) => (
                  <button
                    key={c.label}
                    style={{ animationDelay: `${i * 0.12}s`, animationFillMode: "backwards" }}
                    onClick={() => go(c)}
                    className="animate-fade-in group border border-noir-brass/40 bg-noir-bg-raised/60 px-5 py-4 text-left text-sm tracking-wide text-noir-ink transition-colors hover:border-noir-blood-bright hover:bg-noir-blood/20 hover:pl-7 focus:outline-none focus:ring-1 focus:ring-noir-blood-bright"
                  >
                    <span className="mr-2 text-noir-blood-bright">▸</span>
                    {c.label}
                    {c.note && (
                      <span className="mt-2 block text-[10px] uppercase tracking-[0.25em] text-noir-ink-dim">
                        {c.note}
                      </span>
                    )}
                  </button>
                ))}

              {done && scene.fatal && !scene.ending && (
                <div className="border border-noir-blood-bright/60 bg-noir-blood/15 px-5 py-6 text-center">
                  <p className="font-noir text-lg font-bold uppercase tracking-[0.25em] text-noir-blood-bright">
                    The Trail Goes Cold
                  </p>
                  <p className="mt-2 text-xs text-noir-ink-dim">
                    Open the pocket watch to turn back to any earlier moment.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setPanel("timeline")}
                      className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                    >
                      Rewind time
                    </button>
                    <button
                      onClick={restart}
                      className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                    >
                      Begin again — 1916
                    </button>
                  </div>
                </div>
              )}

              {done && scene.ending && (
                <div className="border border-noir-brass/40 bg-noir-bg-raised/60 px-5 py-6 text-center">
                  <p className="font-noir text-lg font-bold uppercase tracking-[0.25em] text-noir-brass">
                    Case Closed
                  </p>
                  <p className="mt-2 text-xs text-noir-ink-dim">
                    Three endings wait behind two decisions: the washroom, and your sister's pocket.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setPanel("timeline")}
                      className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                    >
                      Rewind and choose differently
                    </button>
                    <button
                      onClick={restart}
                      className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                    >
                      Begin again — 1916
                    </button>
                  </div>
                </div>
              )}
            </div>
        </section>

        <footer className="mt-14 text-center text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim/60">
          London · 1943 · Every choice is evidence
        </footer>
      </div>
    </main>
  );
}
