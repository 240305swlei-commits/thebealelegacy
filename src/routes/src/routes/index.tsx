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
/* Language                                                            */
/* ------------------------------------------------------------------ */

type Lang = "en" | "zh";

const DEFAULT_NAME: Record<Lang, string> = {
  en: "William",
  zh: "威廉",
};

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

/** Items are referenced by a language-independent key; display text is looked
 *  up per-language so switching languages mid-story relabels carried evidence. */
type ItemKey = "invitation" | "tea" | "quarrel" | "letters" | "photograph" | "bloodLetter";
type ItemText = { name: string; detail: string };

const ITEM_TEXT: Record<Lang, Record<ItemKey, ItemText>> = {
  en: {
    invitation: { name: "Engraved Invitation", detail: "Signed by Jack Vernon Beale, 11 July 1943." },
    tea: { name: "Cup of Strong Tea", detail: "Served warm. Spiked with Jack's sleeping pills." },
    quarrel: { name: "Witnessed Quarrel", detail: "A dozen guests saw you nearly come to blows with Joseph." },
    letters: { name: "Threatening Letters", detail: "Elegant hand. Addressed to you — though the police do not know that." },
    photograph: { name: "Family Photograph", detail: "The Dickens family. You left it beside Jack yourself." },
    bloodLetter: { name: "Blood-Stained Letter", detail: "Folded parchment from Emma's corset. Still sealed. Still unread." },
  },
  zh: {
    invitation: { name: "烫金请柬", detail: "由杰克·弗农·比尔签发,1943年7月11日。" },
    tea: { name: "一杯浓茶", detail: "温热奉上,掺了杰克的安眠药。" },
    quarrel: { name: "众目睽睽的争执", detail: "十几名宾客目睹了你与约瑟夫险些大打出手。" },
    letters: { name: "恐吓信", detail: "字迹优雅。是写给你的——尽管警方并不知道这一点。" },
    photograph: { name: "全家福照片", detail: "狄更斯一家。是你亲手放在杰克身边的。" },
    bloodLetter: { name: "染血的信", detail: "从艾玛束身衣中折叠而出的信纸。依然封着口,未曾拆读。" },
  },
};

type Effect = {
  flags?: Partial<Flags>;
  items?: ItemKey[];
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
/* Story graph — English                                               */
/* ------------------------------------------------------------------ */

const SCENES_EN: Record<string, Scene> = {
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
    onEnter: { items: ["invitation"] },
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
    onEnter: { items: ["tea"] },
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
        label: "Step politely away with the slightest brush of his shoulder",
        next: "ch2_knock",
        note: "Weak alibi",
        effect: { flags: { failed_alibi_check: true } },
      },
      {
        label: "Threaten him quietly, mouth close to his ear, so no one else hears",
        next: "ch2_knock",
        note: "Weak alibi — no witnesses",
        effect: { flags: { failed_alibi_check: true } },
      },
      {
        label: "Deliberately insult him and shove him hard — make a scene the whole floor hears",
        next: "ch2_knock",
        note: "Perfect alibi locked",
        effect: { flags: { failed_alibi_check: false }, items: ["quarrel"] },
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
      { label: "Break down and refuse to answer questions", next: "dead_grief" },
      { label: "Stagger — then compose yourself and demand to assist", next: "ch2_interrogate" },
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
      { label: "Panic and start revising your story", next: "dead_story" },
      { label: "\"Officer, I am a detective. A good memory is essential.\"", next: "ch2_letters" },
      { label: "Refuse to answer without your solicitor present", next: "dead_lawyer" },
    ],
  },

  dead_lawyer: {
    title: "Lawyered",
    text: "\"I'll say nothing further without my solicitor.\"\n\nIt is your right. It is also, to a man who has spent thirty years reading rooms, an answer.\n\nThe senior detective closes his notebook, almost kindly. From this morning on, every officer in the building treats the grieving son as the leading suspect — and a suspect cannot steer the investigation.",
    fatal: true,
    choices: [],
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
    onEnter: { items: ["letters"] },
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
    onEnter: { items: ["photograph"] },
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
        effect: { flags: { found_hidden_letter: true }, items: ["bloodLetter"] },
      },
      {
        label: "Ask the constable to search her — you cannot bear to touch her",
        next: "ch3_gun",
        note: "Whatever she carried, it is theirs now",
        effect: { flags: { found_hidden_letter: false } },
      },
    ],
  },

  ch3_gun: {
    chapter: "Chapter Three — The Villa",
    title: "The Wrong Caliber",
    text: "You weep beside her pale cheek until the officer gently lifts you up. An Adams revolver rests in her hand, one round missing from the cylinder.\n\nOne detail matters more than any other, and only you can afford to point it out.",
    choices: [
      { label: "Say nothing about the gun", next: "dead_silence" },
      { label: "\"The temple wound doesn't match this caliber. She was murdered.\"", next: "ch4_forensic" },
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
      { label: "Accuse the elderly butler instead", next: "dead_butler" },
      { label: "Suggest a burglar came in through the garden door", next: "dead_burglar" },
      { label: "Present the theory: Leo is the killer", next: "ch5_search" },
    ],
  },

  dead_burglar: {
    title: "The Garden Door",
    text: "A burglar, you say. In a house with forty servants, two hundred guests and nothing missing but two bullets.\n\nThe senior detective walks you to the garden door himself and shows you the untouched dust on the latch.\n\n\"Detectives don't guess,\" he says. \"They deflect. Which was that?\"",
    fatal: true,
    choices: [],
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
      { label: "Look away and hurry home", next: "dead_gaze" },
      { label: "Hold his gaze, calm as still water", next: "ch6_well" },
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

/* ------------------------------------------------------------------ */
/* Story graph — Simplified Chinese                                    */
/* ------------------------------------------------------------------ */

const SCENES_ZH: Record<string, Scene> = {
  prologue: {
    chapter: "背景故事 — 索姆河,1916年7月",
    title: "承诺",
    text: "1916年7月,索姆河战役。硝烟弥漫,浓重的火药味笼罩着战场的空气。天空被德军轰炸机的轰鸣声撕裂,雷鸣般的炮火震颤着泥泞的大地。尸体散落一地;无数生命在瞬间消逝,只留下冰冷与孤寂。\n\n两名年轻的英国士兵在战壕中匍匐前行,敌机接连投下炸弹。突然,一人扑倒在另一人身上,用自己的身体为他挡下攻击。虽非直接命中——但压在上面的士兵已身负重伤。",
    dialogue: {
      speaker: "狄更斯",
      line: "杰克……活下去。去贝克街孤儿院。求你了——照顾好我的孩子们,艾玛和威廉。",
    },
    choices: [{ label: "二十七年过去了……", next: "ch1_arrive" }],
  },

  ch1_arrive: {
    chapter: "第一章 — 宴会",
    title: "请柬",
    text: "1943年7月11日,伦敦一座豪华庄园。穿着晚礼服、佩戴闪耀珠宝的宾客们沿着大理石走廊走向宴会厅,暖光洒落在光洁的地板上。主人是你的养父杰克·弗农·比尔——如今是生产部的高级官员。名义上,这是一场庆祝胜利的宴会;私底下,却是一个借《租借法案》向美国供应商收取巨额回扣的夜晚。\n\n你是威廉·弗农·比尔——一位小有名气的侦探,而在世人看不见的时刻,也是一名走私战时军火、暗中蚕食父亲生意的军火商。你的车迟到了。宴会九点开始,如今已过了一刻钟,你一进门,厅内所有目光都转向了你。正如你所愿。",
    dialogue: {
      speaker: "管家",
      line: "少爷,您怎么还带着请柬呢?来,让我为您收好外套。",
    },
    onEnter: { items: ["invitation"] },
    choices: [
      { label: "悄悄从仆人通道溜进去,不引人注意", next: "dead_alibi" },
      { label: "在车里等到祝酒结束", next: "dead_late" },
      { label: "让管家大声通报你的到来", next: "ch1_banquet" },
    ],
  },

  dead_alibi: {
    title: "悄然入场",
    text: "你一言不发地绕过衣帽间。没有人留意到你的到来。\n\n第二天早上,当警方重建当晚的时间线时,没有人能说清你是何时进来的——或是枪声响起时你身在何处。对他们而言,一个无人留意的宾客根本算不上宾客。\n\n他是嫌疑人。",
    fatal: true,
    choices: [],
  },

  dead_late: {
    title: "空等的一小时",
    text: "你坐在车里的黑暗中,任由祝酒的时刻流逝,望着窗户里透出的灯光。几乎有种安宁的错觉。\n\n但用分钟精心排演的计划,经不起一整个小时的空缺。等你进门时,画廊已经关闭,艾玛挽着利奥的手臂上楼去了,杰克的房门也已锁上。\n\n你排演了二十七年的那一夜,就这样在没有你的情况下发生了。",
    fatal: true,
    choices: [],
  },

  ch1_banquet: {
    chapter: "第一章 — 宴会",
    title: "香槟与烛光",
    text: "一道道佳肴接连端上——意大利面食、法式鹅肝、德式香肠——每一道都是艺术品。舞者、乐师与一位神秘的魔术师让宾客们如痴如醉,仿佛置身梦境。楼上,一扇紧闭的房门后,杰克正与几名军火商争论合同、配额,还有那个一直在窃取他生意的儿子。\n\n夜色渐深,宴会到达高潮,年迈的管家走上了楼梯平台。",
    dialogue: {
      speaker: "管家",
      line: "主人暂时有事离开,但宴会真正的精彩即将揭幕。请随我前往画廊。",
    },
    choices: [{ label: "跟随宾客前往画廊", next: "ch1_gallery" }],
  },

  ch1_gallery: {
    chapter: "第一章 — 宴会",
    title: "那幅画",
    text: "画廊里陈列着一幅在此悬挂多年的名画。宾客们低声赞叹。\n\n“没想到会在这里再见到她。”你对着无人的空气低语。\n\n半小时悄然流逝。返回途中,你看见一位年轻女士站在一个同龄男人身旁——她衣衫凌乱,泪痕未干;他则醉醺醺地拖着她走向一扇紧闭的房门。你上前干预。她礼貌地拒绝了你的帮助。你转而递上一杯浓茶,她接受了。\n\n五分钟后,房内的争吵声渐渐平息。",
    onEnter: { items: ["tea"] },
    choices: [{ label: "溜进房间", next: "ch1_bathroom" }],
  },

  ch1_bathroom: {
    chapter: "第一章 — 宴会",
    title: "不在场证明",
    text: "事情已经完成。艾玛不会再醒来,利奥那把一模一样的韦伯利手枪此刻躺在她手中,而你的那把则被塞进了你的外套。\n\n现在你需要今晚的另一半:一个足够响亮的不在场证明,让两百名宾客都能为你的位置作证。你走进洗手间外的走廊,你的生意伙伴约瑟夫先生正对着镜子整理领带。\n\n你要如何激怒他?",
    dialogue: {
      speaker: "约瑟夫先生",
      line: "比尔,你脸色发白啊。是香槟喝多了,还是良心发作了?",
    },
    choices: [
      {
        label: "礼貌地侧身让开,轻轻擦过他的肩膀",
        next: "ch2_knock",
        note: "薄弱的不在场证明",
        effect: { flags: { failed_alibi_check: true } },
      },
      {
        label: "凑近他耳边低声威胁,不让旁人听见",
        next: "ch2_knock",
        note: "薄弱的不在场证明——无人见证",
        effect: { flags: { failed_alibi_check: true } },
      },
      {
        label: "故意出言侮辱并用力推搡他——闹得满楼皆知",
        next: "ch2_knock",
        note: "完美的不在场证明已锁定",
        effect: { flags: { failed_alibi_check: false }, items: ["quarrel"] },
      },
    ],
  },

  ch2_knock: {
    chapter: "第二章 — 敲门声",
    title: "两名警官",
    text: "你回到庄园附近的公寓,像一个问心无愧的人那样入睡。\n\n清晨。敲门声响起。\n\n两名警官站在你门前——一个年轻而急切,一个年长而沉默。发生了一起谋杀案。",
    dialogue: {
      speaker: "年轻警官",
      line: "先生,您误会了。死者是杰克·弗农·比尔先生。您的养父。",
    },
    choices: [
      { label: "崩溃痛哭,拒绝回答任何问题", next: "dead_grief" },
      { label: "先是踉跄,随即镇定下来,要求协助调查", next: "ch2_interrogate" },
    ],
  },

  dead_grief: {
    title: "过度的悲伤",
    text: "你靠在门框上崩溃,挥手让警官离开。你的悲痛过于戏剧化——而这些警官见过太多戏剧化的悲痛。\n\n一个军火世家的继承人,独自一人,在谋杀案发生的次日清晨拒绝录口供。年长警官在笔记本上写下一行字:“带他回局里。”",
    fatal: true,
    choices: [],
  },

  ch2_interrogate: {
    chapter: "第二章 — 敲门声",
    title: "审讯",
    text: "在警局里,你如实陈述了自己的时间线:路上出了车祸,迟到一刻钟;与父亲在楼上发生了生意上的争执;宴会;跳舞时撞到管家;画廊;胃部不适;洗手间走廊与约瑟夫先生;衣衫不整的玛丽小姐,以及她那位神情异样兴奋的丈夫;那杯茶;然后回家。\n\n年轻警官向年长警官点了点头——你的说辞对上了。但年长警官没有立刻开口,让沉默拖得很长。",
    dialogue: {
      speaker: "资深探长",
      line: "你在撒谎。你显然喝醉了——怎么会记得这么清楚?",
    },
    choices: [
      { label: "惊慌失措,开始修改自己的说辞", next: "dead_story" },
      { label: "“探长,我是一名侦探。良好的记忆力是必备的素质。”", next: "ch2_letters" },
      { label: "拒绝回答,要求律师在场", next: "dead_lawyer" },
    ],
  },

  dead_lawyer: {
    title: "找律师",
    text: "“在我的律师到场之前,我不会再说什么了。”\n\n这是你的权利。但对一个读人心思读了三十年的人来说,这也是一种回答。\n\n资深探长几乎是温和地合上了笔记本。从今天早上起,局里的每一位警官都会把这个悲痛的儿子当作头号嫌疑人——而嫌疑人无法左右调查的方向。",
    fatal: true,
    choices: [],
  },

  dead_story: {
    title: "说辞的裂痕",
    text: "“嗯——也许是十二点半,不是一刻。或者我是在去画廊之前上的洗手间?不,是之后——”\n\n每一次修改都是一根线头,而年长探长会把每一根都扯出来。到第二次问话时,你的时间线上的漏洞比1916年的战壕还要多。",
    fatal: true,
    choices: [],
  },

  ch2_letters: {
    chapter: "第二章 — 敲门声",
    title: "恐吓信",
    text: "“你听到枪声了吗?”\n\n“听到了。但大家都知道我的养父有打靶的爱好。他在房间里设了个靶子,一有空就练习。那栋房子里的枪声,就跟家具一样寻常。”\n\n年轻警官点头;你的陈述对上了。这时另一名警官走了进来,手里拿着几封在庄园邮件中发现的信。",
    dialogue: {
      speaker: "信件内容",
      line: "我知道你是谁。你活不过这个月。",
    },
    onEnter: { items: ["letters"] },
    choices: [{ label: "陪同警方前往别墅", next: "ch3_villa" }],
  },

  ch3_villa: {
    chapter: "第三章 — 别墅",
    title: "两具尸体",
    text: "一楼卧室里躺着一具女性的尸体——脸上有掌掴的痕迹,腹部有淤青。二楼躺着杰克·弗农·比尔。两人太阳穴处都有枪伤,伤口周围的皮肤略有焦黑。\n\n一名警官从地上捡起一张照片:一位年轻的父亲,一位垂死的母亲,两个孩子。背面写着——“狄更斯一家”。他在女尸的口袋里发现了一枚戒指,与照片中母亲手上的那枚吻合。",
    dialogue: {
      speaker: "资深探长",
      line: "很遗憾,先生……这位女士很可能是您失踪多年的妹妹。",
    },
    onEnter: { items: ["photograph"] },
    choices: [
      {
        label: "随意检查艾玛的口袋,同时在警察面前落泪",
        next: "ch3_gun",
        note: "你保持了双手的清白",
        effect: { flags: { found_hidden_letter: false } },
      },
      {
        label: "冒险引人注意——深入搜查她的束身衣下方",
        next: "ch3_gun",
        note: "你悄悄拿走了什么",
        effect: { flags: { found_hidden_letter: true }, items: ["bloodLetter"] },
      },
      {
        label: "让警员来搜她的身——你无法忍受亲手去碰她",
        next: "ch3_gun",
        note: "无论她身上带着什么,如今都归他们所有",
        effect: { flags: { found_hidden_letter: false } },
      },
    ],
  },

  ch3_gun: {
    chapter: "第三章 — 别墅",
    title: "口径不对",
    text: "你伏在她苍白的脸颊旁哭泣,直到警官轻轻将你扶起。一把亚当斯左轮手枪握在她手中,弹巢里少了一发子弹。\n\n有一个细节比其他任何事都更重要,而只有你才有资格指出它。",
    choices: [
      { label: "对那把枪只字不提", next: "dead_silence" },
      { label: "“太阳穴的伤口和这个口径对不上。她是被谋杀的。”", next: "ch4_forensic" },
    ],
  },

  dead_silence: {
    title: "你藏起的细节",
    text: "你看着那把亚当斯左轮手枪,把自己的发现藏在心里。但那位年轻警官比看上去要敏锐得多——他看见你的目光先落在伤口上,又落在枪上,然后移开。\n\n一个隐瞒证据的侦探,只可能有一个理由。",
    fatal: true,
    choices: [],
  },

  ch4_forensic: {
    chapter: "第四章 — 推论",
    title: "花粉与药丸",
    text: "“我碰到妹妹时,闻到了一丝淡淡的花粉香。”一名法医被请来检验,报告证实她在死前曾被下药。\n\n你为警方拼凑出了他们需要的理论:玛丽是被丈夫利奥先生——战时经济委员会的调查员——作为礼物送给杰克先生,以换取丰厚的军事合同。杰克玷污了她。她不慎掉落了那张全家福照片,杰克的心理防线彻底崩溃,意识到自己背叛了你的父亲后,他绝望地开枪自尽。玛丽醒来后满怀怨恨,质问利奥,利奥殴打了她,随后假意道歉,将她诱入房间杀害,伪造成自杀。\n\n楼上,警官们发现了一把少了两发子弹的制式韦伯利左轮手枪。",
    dialogue: {
      speaker: "威廉·比尔",
      line: "韦伯利手枪在军人中很常见。我父亲和利奥都从事这个行当——两人都可能拥有一把。",
    },
    choices: [
      { label: "反而指控那位年迈的管家", next: "dead_butler" },
      { label: "提出是有窃贼从花园门闯入", next: "dead_burglar" },
      { label: "提出理论:利奥就是凶手", next: "ch5_search" },
    ],
  },

  dead_burglar: {
    title: "花园门",
    text: "窃贼,你说。在一座拥有四十名仆人、两百位宾客的宅邸里,却什么都没丢,只少了两发子弹。\n\n资深探长亲自把你带到花园门前,给你看门闩上未曾扰动的灰尘。\n\n“侦探不靠猜测,”他说,“他们只会转移视线。你刚才做的是哪一种?”",
    fatal: true,
    choices: [],
  },

  dead_butler: {
    title: "找错了人",
    text: "你精心构建了一套针对管家的说辞。资深警官只用四句话就将它拆穿——那个人整晚都在两百名见证人面前斟倒香槟。\n\n“奇怪,像您这样有才华的侦探,建立的案子怎么会这么快就站不住脚。除非,你需要它站不住脚。”",
    fatal: true,
    choices: [],
  },

  ch5_search: {
    chapter: "第五章 — 搜查",
    title: "太过巧合",
    text: "利奥被押了进来,一路抗议。年轻警官保证第二把韦伯利手枪将坐实他的罪行,警局的人几乎倾巢而出投入搜查。\n\n只有资深探长留了下来,反复琢磨着:艾玛的身份、两发缺失的子弹、那些信件。一切都吻合得太过完美。他抬眼隔着大厅望向你。",
    choices: [
      { label: "移开目光,匆匆回家", next: "dead_gaze" },
      { label: "迎上他的目光,平静如水", next: "ch6_well" },
    ],
  },

  dead_gaze: {
    title: "移开目光的人",
    text: "你垂下眼睛,伸手去拿外套。仅仅两秒——资深警官从这个动作里读出了一整篇供词。\n\n他从未证实任何事。他也不需要。有些牢笼,是没有围墙的。",
    fatal: true,
    choices: [],
  },

  ch6_well: {
    chapter: "第六章 — 定论",
    title: "水井",
    text: "潜水员从别墅附近的一口水井中打捞出一把损坏的韦伯利手枪,少了一发子弹。利奥的罪名就此坐实,数日后被判处绞刑。\n\n资深探长隔着法庭望向你。你摇了摇头,走上前去,在他耳边低语:\n\n“我从一开始就说过——你找对人了。”",
    choices: [{ label: "第七章——真相", next: "ch7_truth" }],
  },

  ch7_truth: {
    chapter: "第七章 — 那个对的人",
    title: "完美的犯罪",
    text: "是的。警方确实找对了人。\n\n你故意迟到几分钟,好让管家记住你抵达的时间。你趁着杰克与其他军火商争论之际,溜进他的房间,偷走了他的手枪和安眠药。\n\n你知道杰克会对玛丽做出恶行,你也知道那封恐吓信其实是写给你的——出自你亲爱的妹妹之手。她知道你也是个军火商,暗中走私战时军火,窃取养父的生意。战时黑市军火交易,让你积累了巨额财富。\n\n看完那幅画后,你找到了妹妹。她一度惊慌,以为你发现了她的身份——喝下那杯茶后便放松了下来。五分钟后,争吵声平息,你悄悄溜了进去。药效堪称完美;他们从未料到艾玛会第二次昏迷不醒。你用偷来的手枪杀了她,见那个傻瓜利奥携带着同款韦伯利手枪,便将他的枪调换进她手中——你那多疑的妹妹自己的亚当斯左轮手枪,则让利奥相信自己或许是醉酒后杀了她,并伪造了她的自杀现场。随后是洗手间与约瑟夫的冲突,为你打造不在场证明;上楼与杰克“谈心”;趁宾客们翩翩起舞时开了一枪;再放上那张照片,伪造他因愧疚而自尽的假象。\n\n当然,杰克绝不会为这种“小事”自寻短见。",
    resolveEnding: true,
    choices: [{ label: "看看你这一夜真正的结局", next: ENDING_GATE }],
  },

  /* --------------------------- ENDINGS --------------------------- */

  ending_mastermind: {
    chapter: "结局一",
    title: "主谋的凯旋",
    text: "法槌重重敲在音块上,发出沉闷而终结的声响,在老贝利法院庄严肃穆的大厅里回荡。利奥浑身颤抖,面色如鬼魅般苍白,被两名彪形警卫拖走,他绝望的求饶声淹没在旁听席的窃窃私语中。他被判处绞刑。我缓缓起身,整理着定制西装的翻领,用一副精心排练过的沉痛哀伤的表情,掩盖住内心冰冷的满足。当我走出法庭昏暗的走廊时,资深探长正等在那里。他那双饱经风霜、锐利如刀的眼睛死死盯着我,仿佛想要刮开我所有的谎言。\n\n“这一次你赢了,比尔,”他嘶哑地说,声音里压抑着愤怒与疲惫。“但我知道。时间的安排,水井里的韦伯利手枪,那些恐吓信……一切都完美得不真实。总有一天,你会露出破绽,而我会在那里等着。”\n\n我只是停下脚步,轻轻抬了抬礼帽,朝他靠近一步。俯身,我在他耳边轻声说道:“探长,我一直说,你找对了人。你只是没有胆量去抓住他罢了。”我转身离去,无视他攥紧的拳头,推开了那扇沉重的橡木大门。\n\n外面,伦敦的天空正在哭泣,冷冽的细雨冲刷着城市的鹅卵石街道。我点燃一支香烟,火柴的光亮短暂照亮了黑暗的巷弄。我做到了。我干净利落地清除了威胁我帝国的所有障碍。杰克那套束缚人的道德准则已经消失,艾玛那些危险的秘密也随她一同埋葬。黑市军事合同如今尽数落入我一人之手,一条由这场战争的鲜血浇灌而成的黄金之河,正源源不断地流入我的口袋。我深吸一口烟,那烟雾涌入肺中,仿佛当年索姆河战场上的硝烟。但这一次,我不再是那个在泥泞中无助哭泣的孤儿。我是国王,而这座城市的暗影,都将由我统治。",
    ending: true,
    choices: [],
  },

  ending_tragic: {
    chapter: "结局二",
    title: "悲剧的真相",
    text: "当我依旧以悲痛兄长的伪装,在警员们于犯罪现场忙碌穿梭的注视下,继续搜查妹妹冰冷僵硬的尸体时,双手微微颤抖。在她破损礼服的丝绸衬里之下,紧贴束身衣的地方,我的手指触到了一张折叠的纸。上面沾着一滴她的血迹。我避开警察的视线,将它悄悄塞进口袋。直到数小时后,坐在自己公寓令人窒息的黑暗中,我才鼓起勇气将它展开。\n\n那娟秀的字迹毫无疑问出自艾玛之手。“我最亲爱的威廉,如果你读到这封信,我祈祷你早已远离伦敦。杰克什么都知道了。他知道你的走私路线,知道你的黑市军火交易。战时经济委员会已经步步紧逼,杰克已经与利奥达成协议,要把你交出去当替罪羊,以保全他自己的产业。我写那封恐吓信,不是为了敲诈你,而是想吓得你逃离这里。我不能告诉你真相,因为我知道你的骄傲会让你选择留下来抗争。求你了,哥哥,快跑。我会尽我所能拖住他们。只要你能活下去。”\n\n信纸从我麻木的手指间滑落,像一只垂死的飞蛾般飘落在地。一阵震耳欲聋的轰鸣涌入我的耳中——那不是伦敦的车流声,而是索姆河战场上雷鸣般的炮火声。我看见父亲的脸庞,沾满泥泞与鲜血,用自己的血肉之躯换来了杰克的生存。而现在,我却冷酷地、精心算计地,朝这世上唯一真心爱我的人开了一枪——我的妹妹,那个曾想扑向炸弹保护我的人。愧疚化作实实在在的痛楚,撕扯着我的胸膛,让我几近窒息。我缓缓走到书桌前,拿起艾玛那把小巧的亚当斯左轮手枪——那把我曾如此巧妙地用来嫁祸利奥的枪。我将冰冷的枪管抵住自己的太阳穴。父亲用生命换来了我们的生命,而我却把这生命变成了一场丑陋的噩梦。“对不起,艾玛。”我对着空荡的房间低语。枪响了,噩梦终于结束。",
    ending: true,
    fatal: true,
    choices: [],
  },

  ending_above_law: {
    chapter: "结局三",
    title: "凌驾于法律之上",
    text: "“这说不通,比尔先生。”年轻警官的声音出奇地坚定,在这间狭小无菌的审讯室里回响。他此前那种天真的态度已完全褪去,一份马尼拉纸文件夹重重地摔在金属桌面上。资深探长站在昏暗的角落里一言不发,眼神警惕,或许已经察觉到他们正踏入危险而幽暗的水域。但这位年轻警官被一股鲁莽而天真的正义渴望驱使着。“你的时间线漏洞百出。我们找过约瑟夫先生,他坚决否认在洗手间附近发生过任何肢体冲突。他说你只是从他身边擦肩而过,便径直离开了,根本没有什么‘险些动手’的场面能拖住你,好让楼上的枪声有机可乘。”\n\n我保持镇定,但一滴冷汗顺着脊背滑落。我低估了这个新人;我没能狠狠地推搡约瑟夫,制造出足够持久的场面。还没等我编出反驳的说辞,年轻警官便一拳砸在桌上。“威廉·弗农·比尔,我现在正式以谋杀杰克·弗农·比尔与艾玛·狄更斯的罪名拘留你。你不能离开这间警局。”冰冷的手铐带着一种残酷的终结感,扣在了我的手腕上。我被投入一间潮湿、没有窗户的拘留室,绞刑架的阴影沉甸甸地笼罩着我。\n\n但这位年轻警官从根本上误解了这个世界在战时的真正运作方式。他相信绝对的正义;而我相信的是筹码与权力。我在那间牢房里静静等待了整整四十八个小时。\n\n第三天清晨,沉重的铁门终于打开。国防部的一位高级官员站在门口,身旁跟着我的高价律师团。资深探长也在场,神情失落却并不意外,手里拿着我那件定制外套。而那位年轻警官,却明显不见踪影。\n\n“缺乏确凿的物证,加上主导调查的探员不幸身亡。”国防部官员平淡地宣布,将正式的释放文件递到我手中。我的势力网络——一张由腐败政客与黑市军火买家织成的庞大网络,他们依赖着我的供应链——只是轻轻动用了必要的关系。\n\n我走进伦敦雾气弥漫的清晨,重获自由之身。直到我坐在自己顶层办公室里,啜饮着一杯陈年苏格兰威士忌时,才看到当晚的报纸。第三版一则不起眼的标题吸引了我的目光:悲剧意外:苏格兰场年轻警官被发现溺毙于泰晤士河。据说他昨夜在结冰的河边不慎滑倒落水。我缓缓合上报纸,深深啜了一口那烟熏味的美酒,望向这座庞大而浑然不觉的城市。在这个战火纷飞的世界里,天真的正义是致命的缺陷,而我,是这个市场里最富有的幸存者。",
    ending: true,
    choices: [],
  },
};

const SCENES_BY_LANG: Record<Lang, Record<string, Scene>> = { en: SCENES_EN, zh: SCENES_ZH };

const START_SCENE = "prologue";

function resolveEnding(flags: Flags): string {
  if (flags.found_hidden_letter) return "ending_tragic";
  if (flags.failed_alibi_check) return "ending_above_law";
  return "ending_mastermind";
}

/** Canonical ending order, used for the "Ending 1 of 3" breakdown. */
const ENDING_ORDER = ["ending_mastermind", "ending_tragic", "ending_above_law"] as const;

const SCENE_IMAGE_SRC: Record<string, string> = {
  prologue: imgTrench,
  ch1_arrive: imgBanquet,
  dead_alibi: imgBanquet,
  dead_late: imgRain,
  ch1_banquet: imgBanquet,
  ch1_gallery: imgGallery,
  ch1_bathroom: imgCorridor,
  ch2_knock: imgInterrogation,
  dead_grief: imgInterrogation,
  ch2_interrogate: imgInterrogation,
  dead_story: imgInterrogation,
  dead_lawyer: imgInterrogation,
  ch2_letters: imgInterrogation,
  ch3_villa: imgVilla,
  ch3_gun: imgVilla,
  dead_silence: imgVilla,
  ch4_forensic: imgVilla,
  dead_butler: imgBanquet,
  dead_burglar: imgVilla,
  ch5_search: imgWell,
  dead_gaze: imgRain,
  ch6_well: imgCourtroom,
  ch7_truth: imgConfession,
  ending_mastermind: imgRain,
  ending_tragic: imgVilla,
  ending_above_law: imgCourtroom,
};

const SCENE_IMAGE_ALT: Record<Lang, Record<string, string>> = {
  en: {
    prologue: "A soldier shields another in a trench as bombs fall",
    ch1_arrive: "A candlelit banquet hall full of guests",
    dead_alibi: "A candlelit banquet hall full of guests",
    dead_late: "A rainy London street at night outside the manor",
    ch1_banquet: "A candlelit banquet hall full of guests",
    ch1_gallery: "Guests gaze at a portrait in a dark gallery",
    ch1_bathroom: "Two men in tuxedos quarrel in a mirrored washroom corridor",
    ch2_knock: "A young man questioned by two detectives under a lamp",
    dead_grief: "A young man questioned by two detectives under a lamp",
    ch2_interrogate: "A young man questioned by two detectives under a lamp",
    dead_story: "A young man questioned by two detectives under a lamp",
    dead_lawyer: "An interrogation room lit by a single lamp",
    ch2_letters: "A young man questioned by two detectives under a lamp",
    ch3_villa: "A photograph and revolver on dark floorboards",
    ch3_gun: "A photograph and revolver on dark floorboards",
    dead_silence: "A photograph and revolver on dark floorboards",
    ch4_forensic: "A photograph and revolver on dark floorboards",
    dead_butler: "A candlelit banquet hall full of guests",
    dead_burglar: "A dark villa doorway",
    ch5_search: "Police dredge a revolver from a well at night",
    dead_gaze: "A man hurrying away down a rainy London street",
    ch6_well: "A defendant dragged from the dock in an Old Bailey courtroom",
    ch7_truth: "A detective whispers to a man beneath a streetlamp",
    ending_mastermind: "A man in a fedora walking into the London rain",
    ending_tragic: "A revolver and a bloodstained letter on a desk",
    ending_above_law: "A courtroom in shadow",
  },
  zh: {
    prologue: "一名士兵在炮火中扑到另一人身上为其挡下攻击",
    ch1_arrive: "烛光摇曳、宾客满座的宴会厅",
    dead_alibi: "烛光摇曳、宾客满座的宴会厅",
    dead_late: "庄园外雨夜中的伦敦街道",
    ch1_banquet: "烛光摇曳、宾客满座的宴会厅",
    ch1_gallery: "宾客们在昏暗的画廊中凝视一幅肖像画",
    ch1_bathroom: "两名身着礼服的男子在镜廊中争执",
    ch2_knock: "一名年轻男子在灯下被两名警探审问",
    dead_grief: "一名年轻男子在灯下被两名警探审问",
    ch2_interrogate: "一名年轻男子在灯下被两名警探审问",
    dead_story: "一名年轻男子在灯下被两名警探审问",
    dead_lawyer: "一间由单盏灯照亮的审讯室",
    ch2_letters: "一名年轻男子在灯下被两名警探审问",
    ch3_villa: "昏暗地板上的一张照片与一把左轮手枪",
    ch3_gun: "昏暗地板上的一张照片与一把左轮手枪",
    dead_silence: "昏暗地板上的一张照片与一把左轮手枪",
    ch4_forensic: "昏暗地板上的一张照片与一把左轮手枪",
    dead_butler: "烛光摇曳、宾客满座的宴会厅",
    dead_burglar: "黑暗中的别墅门口",
    ch5_search: "警察在夜间从水井中打捞出一把左轮手枪",
    dead_gaze: "一名男子在雨中的伦敦街道匆匆离去",
    ch6_well: "一名被告在老贝利法庭上被拖离被告席",
    ch7_truth: "一名探长在路灯下对一名男子低语",
    ending_mastermind: "一名戴礼帽的男子走入伦敦的雨中",
    ending_tragic: "书桌上放着一把左轮手枪与一封染血的信",
    ending_above_law: "阴影笼罩下的法庭",
  },
};

/* ------------------------------------------------------------------ */
/* UI strings                                                          */
/* ------------------------------------------------------------------ */

const UI_TEXT: Record<
  Lang,
  {
    tagline: string;
    gameTitle: string;
    introLine: string;
    nameLabel: string;
    nameHint: (name: string) => string;
    startButton: string;
    musicHint: string;
    musicOnAria: string;
    musicOffAria: string;
    musicOnTitle: string;
    musicOffTitle: string;
    musicOnLabel: string;
    musicOffLabel: string;
    caseFileAria: string;
    caseFileTitle: string;
    caseFileLabel: string;
    rewindAria: string;
    rewindTitle: string;
    rewindLabel: string;
    panelCaseFile: string;
    panelPocketWatch: string;
    evidenceHeading: string;
    emptyPockets: string;
    standingHeading: string;
    alibiKey: string;
    alibiWeak: string;
    alibiStrong: string;
    hiddenLetterKey: string;
    hiddenLetterYes: string;
    hiddenLetterNo: string;
    timelineIntro: string;
    wrongTurnFallback: string;
    windBackButton: string;
    trailColdTitle: string;
    trailColdSubtitle: string;
    rewindTimeButton: string;
    beginAgainButton: string;
    endingLabel: (n: number, total: number, title: string) => string;
    caseClosed: string;
    yoursTonight: string;
    twoDecisions: string;
    playAgainButton: string;
    rewindDifferentButton: string;
    footer: string;
    langSwitchAria: string;
  }
> = {
  en: {
    tagline: "An Interactive Noir Mystery",
    gameTitle: "The Somme Echoes",
    introLine: "London, 1943. A banquet, two bodies, and a detective who already knows the killer.",
    nameLabel: "What is your name?",
    nameHint: (name) => `Leave it blank and you will answer to ${name}.`,
    startButton: "Start Game",
    musicHint: "Music fades in when the story begins",
    musicOnAria: "Turn music on",
    musicOffAria: "Mute music",
    musicOnTitle: "Music off — tap to play",
    musicOffTitle: "Music on — tap to mute",
    musicOnLabel: "Music off",
    musicOffLabel: "Music on",
    caseFileAria: "Open case file and inventory",
    caseFileTitle: "Case file — evidence you are carrying",
    caseFileLabel: "Case file",
    rewindAria: "Open the pocket watch timeline",
    rewindTitle: "Pocket watch — rewind to an earlier moment",
    rewindLabel: "Rewind",
    panelCaseFile: "Case File",
    panelPocketWatch: "The Pocket Watch",
    evidenceHeading: "Evidence",
    emptyPockets: "Your pockets are empty.",
    standingHeading: "Standing",
    alibiKey: "Alibi",
    alibiWeak: "Weak — Joseph barely noticed",
    alibiStrong: "Airtight — a scene was made",
    hiddenLetterKey: "Hidden letter",
    hiddenLetterYes: "In your coat pocket",
    hiddenLetterNo: "Never searched for",
    timelineIntro:
      "Turn the hands back. Choose any moment you have lived and play it differently — every choice after it will be forgotten.",
    wrongTurnFallback: "A wrong turn",
    windBackButton: "Wind back to 1916",
    trailColdTitle: "The Trail Goes Cold",
    trailColdSubtitle: "Open the pocket watch to turn back to any earlier moment.",
    rewindTimeButton: "Rewind time",
    beginAgainButton: "Begin again — 1916",
    endingLabel: (n, total, title) => `Ending ${n} of ${total} — ${title}`,
    caseClosed: "Case Closed",
    yoursTonight: " — yours tonight",
    twoDecisions: "Two decisions divide them: the washroom, and your sister's pocket.",
    playAgainButton: "Play again",
    rewindDifferentButton: "Rewind and choose differently",
    footer: "London · 1943 · Every choice is evidence",
    langSwitchAria: "Switch language",
  },
  zh: {
    tagline: "一部互动黑色悬疑游戏",
    gameTitle: "索姆河回声",
    introLine: "1943年,伦敦。一场宴会,两具尸体,还有一位早已知道凶手是谁的侦探。",
    nameLabel: "你叫什么名字?",
    nameHint: (name) => `留空的话,你将以“${name}”自称。`,
    startButton: "开始游戏",
    musicHint: "故事开始时,音乐将渐渐响起",
    musicOnAria: "打开音乐",
    musicOffAria: "静音音乐",
    musicOnTitle: "音乐关闭——点击播放",
    musicOffTitle: "音乐开启——点击静音",
    musicOnLabel: "音乐关闭",
    musicOffLabel: "音乐开启",
    caseFileAria: "打开案卷与物品清单",
    caseFileTitle: "案卷——你随身携带的证据",
    caseFileLabel: "案卷",
    rewindAria: "打开怀表时间线",
    rewindTitle: "怀表——倒回更早的时刻",
    rewindLabel: "倒转",
    panelCaseFile: "案卷",
    panelPocketWatch: "怀表",
    evidenceHeading: "证据",
    emptyPockets: "你的口袋空空如也。",
    standingHeading: "现状",
    alibiKey: "不在场证明",
    alibiWeak: "薄弱——约瑟夫几乎没有注意到",
    alibiStrong: "无懈可击——制造了一场轰动",
    hiddenLetterKey: "藏匿的信",
    hiddenLetterYes: "藏在你的外套口袋里",
    hiddenLetterNo: "从未被搜寻过",
    timelineIntro: "拨动指针倒转。选择你经历过的任意一刻,做出不同的选择——此后的一切选择都将被遗忘。",
    wrongTurnFallback: "一步错棋",
    windBackButton: "倒回1916年",
    trailColdTitle: "线索到此中断",
    trailColdSubtitle: "打开怀表,回到更早的任意时刻。",
    rewindTimeButton: "倒转时间",
    beginAgainButton: "重新开始 — 1916年",
    endingLabel: (n, total, title) => `结局 ${n} / ${total} —— ${title}`,
    caseClosed: "案件已结",
    yoursTonight: " —— 你今晚的结局",
    twoDecisions: "两个决定将它们区分开来:洗手间,以及你妹妹的口袋。",
    playAgainButton: "再玩一次",
    rewindDifferentButton: "倒转时间,做出不同选择",
    footer: "伦敦 · 1943 · 每一个选择都是证据",
    langSwitchAria: "切换语言",
  },
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

type Snapshot = { id: string; flags: Flags; items: ItemKey[] };

function applyEffect(
  effect: Effect | undefined,
  flags: Flags,
  items: ItemKey[],
): { flags: Flags; items: ItemKey[] } {
  if (!effect) return { flags, items };
  const nextFlags = { ...flags, ...(effect.flags ?? {}) };
  const nextItems = [...items];
  for (const key of effect.items ?? []) {
    if (!nextItems.includes(key)) nextItems.push(key);
  }
  return { flags: nextFlags, items: nextItems };
}

function makeStart(lang: Lang): Snapshot {
  const base = applyEffect(SCENES_BY_LANG[lang][START_SCENE]!.onEnter, INITIAL_FLAGS, []);
  return { id: START_SCENE, ...base };
}

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [started, setStarted] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [playerName, setPlayerName] = useState(DEFAULT_NAME.en);
  const [history, setHistory] = useState<Snapshot[]>(() => [makeStart("en")]);
  const [panel, setPanel] = useState<null | "inventory" | "timeline">(null);
  const [flashKey, setFlashKey] = useState(0);

  const ui = UI_TEXT[lang];
  const SCENES = SCENES_BY_LANG[lang];

  const current = history[history.length - 1]!;
  const scene = SCENES[current.id]!;
  const imageSrc = SCENE_IMAGE_SRC[current.id];
  const imageAlt = SCENE_IMAGE_ALT[lang][current.id];
  const named = useCallback(
    (t: string) => t.split(DEFAULT_NAME[lang]).join(playerName),
    [playerName, lang],
  );
  const { shown, done, skip } = useTypewriter(named(scene.text));
  const paragraphs = useMemo(() => shown.split("\n\n"), [shown]);
  const endingNumber = ENDING_ORDER.indexOf(current.id as (typeof ENDING_ORDER)[number]) + 1;
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
    return () => {
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
    setHistory([makeStart(lang)]);
    setPanel(null);
  };

  const toggleLang = () => {
    setLang((l) => (l === "en" ? "zh" : "en"));
  };

  const flagList = useMemo(
    () => [
      { key: ui.alibiKey, value: current.flags.failed_alibi_check ? ui.alibiWeak : ui.alibiStrong },
      { key: ui.hiddenLetterKey, value: current.flags.found_hidden_letter ? ui.hiddenLetterYes : ui.hiddenLetterNo },
    ],
    [current.flags, ui],
  );

  const beginGame = () => {
    const chosen = nameInput.trim() || DEFAULT_NAME[lang];
    setPlayerName(chosen);
    setHistory([makeStart(lang)]);
    setStarted(true);
    // audio may only begin after this user gesture; it fades in from silence
    scoreRef.current?.start();
  };

  if (!started) {
    return (
      <main
        className="vignette grain relative flex min-h-screen items-center justify-center bg-noir-bg px-6 font-typewriter text-noir-ink"
        style={{ animation: "lamp-flicker 7s linear infinite" }}
      >
        <div className="smoke pointer-events-none fixed inset-0 z-0" />

        {/* language toggle */}
        <div className="fixed right-3 top-3 z-40 flex items-center gap-1 rounded-full border border-noir-brass/50 bg-noir-bg-raised/90 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur sm:right-5 sm:top-5">
          <button
            onClick={() => setLang("en")}
            aria-label={ui.langSwitchAria}
            className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
              lang === "en" ? "bg-noir-blood/25 text-noir-blood-bright" : "text-noir-ink-dim hover:text-noir-brass"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("zh")}
            aria-label={ui.langSwitchAria}
            className={`rounded-full px-3 py-1.5 text-[11px] tracking-[0.1em] transition-colors ${
              lang === "zh" ? "bg-noir-blood/25 text-noir-blood-bright" : "text-noir-ink-dim hover:text-noir-brass"
            }`}
          >
            中文
          </button>
        </div>

        <div className="animate-fade-in relative z-10 w-full max-w-md text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-noir-ink-dim">{ui.tagline}</p>
          <h1 className="mt-3 font-noir text-3xl font-bold italic text-noir-brass sm:text-4xl">
            {ui.gameTitle}
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-noir-blood" />
          <p className="mt-6 text-sm leading-relaxed text-noir-ink/85">{ui.introLine}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              beginGame();
            }}
            className="mt-10 text-left"
          >
            <label
              htmlFor="player-name"
              className="block text-[10px] uppercase tracking-[0.3em] text-noir-blood-bright"
            >
              {ui.nameLabel}
            </label>
            <input
              id="player-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={DEFAULT_NAME[lang]}
              maxLength={24}
              autoComplete="off"
              className="mt-3 w-full border border-noir-brass/40 bg-noir-bg-raised/70 px-4 py-3 text-base text-noir-ink placeholder:text-noir-ink-dim/70 focus:border-noir-blood-bright focus:outline-none"
            />
            <p className="mt-2 text-[11px] text-noir-ink-dim">{ui.nameHint(DEFAULT_NAME[lang])}</p>
            <button
              type="submit"
              className="mt-7 w-full border border-noir-blood-bright bg-noir-blood/25 px-6 py-3 text-xs uppercase tracking-[0.3em] text-noir-blood-bright transition-colors hover:bg-noir-blood/40"
            >
              {ui.startButton}
            </button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.25em] text-noir-ink-dim/70">
              {ui.musicHint}
            </p>
          </form>
        </div>
      </main>
    );
  }

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
      <div className="fixed right-3 top-3 z-40 flex items-center gap-2 rounded-full border border-noir-brass/50 bg-noir-bg-raised/90 px-2 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur sm:right-5 sm:top-5">
        <button
          onClick={toggleLang}
          aria-label={ui.langSwitchAria}
          title={ui.langSwitchAria}
          className="flex h-10 items-center rounded-full border border-noir-brass/50 px-3 text-[10px] uppercase tracking-[0.2em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
        >
          {lang === "en" ? "中文" : "EN"}
        </button>
        <button
          onClick={() => {
            scoreRef.current?.start();
            setMuted((m) => !m);
          }}
          aria-label={muted ? ui.musicOnAria : ui.musicOffAria}
          title={muted ? ui.musicOnTitle : ui.musicOffTitle}
          className={`flex h-10 items-center gap-2 rounded-full border px-3 text-[10px] uppercase tracking-[0.2em] transition-colors ${
            muted
              ? "border-noir-brass/40 text-noir-ink-dim hover:text-noir-brass"
              : "border-noir-blood-bright/70 bg-noir-blood/25 text-noir-blood-bright"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" />
            {muted ? (
              <path d="M16 9.5l5 5M21 9.5l-5 5" />
            ) : (
              <path d="M15.5 9.5a4.2 4.2 0 0 1 0 5M18.2 7.2a7.4 7.4 0 0 1 0 9.6" />
            )}
          </svg>
          <span className="hidden sm:inline">{muted ? ui.musicOnLabel : ui.musicOffLabel}</span>
        </button>
        <button
          onClick={() => setPanel(panel === "inventory" ? null : "inventory")}
          aria-label={ui.caseFileAria}
          title={ui.caseFileTitle}
          className={`flex h-10 items-center gap-2 rounded-full border px-3 text-[10px] uppercase tracking-[0.2em] transition-colors ${
            panel === "inventory"
              ? "border-noir-blood-bright bg-noir-blood/25 text-noir-blood-bright"
              : "border-noir-brass/50 text-noir-brass hover:border-noir-blood-bright hover:text-noir-blood-bright"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h5l1.5 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
          </svg>
          <span className="hidden sm:inline">{ui.caseFileLabel}</span>
        </button>
        <button
          onClick={() => setPanel(panel === "timeline" ? null : "timeline")}
          aria-label={ui.rewindAria}
          title={ui.rewindTitle}
          className={`flex h-10 items-center gap-2 rounded-full border px-3 text-[10px] uppercase tracking-[0.2em] transition-colors ${
            panel === "timeline"
              ? "border-noir-blood-bright bg-noir-blood/25 text-noir-blood-bright"
              : "border-noir-brass/50 text-noir-brass hover:border-noir-blood-bright hover:text-noir-blood-bright"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3.5v-1.2M10 2.3h4" />
            <circle cx="12" cy="13" r="7.5" />
            <path d="M12 9.5V13l2.5 1.8" />
          </svg>
          <span className="hidden sm:inline">{ui.rewindLabel}</span>
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
                {panel === "inventory" ? ui.panelCaseFile : ui.panelPocketWatch}
              </h2>
              <div className="mt-1 h-px w-16 bg-noir-blood" />

              <div className="mt-6 flex-1 overflow-y-auto pr-1">
                {panel === "inventory" ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim">{ui.evidenceHeading}</p>
                      <ul className="mt-3 space-y-3">
                        {current.items.length === 0 && (
                          <li className="text-sm text-noir-ink-dim">{ui.emptyPockets}</li>
                        )}
                        {current.items.map((key) => {
                          const it = ITEM_TEXT[lang][key];
                          return (
                            <li key={key} className="border border-noir-brass/25 bg-noir-bg/60 p-3">
                              <p className="text-sm text-noir-brass">{it.name}</p>
                              <p className="mt-1 text-xs leading-relaxed text-noir-ink-dim">{it.detail}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim">{ui.standingHeading}</p>
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
                    <p className="text-xs leading-relaxed text-noir-ink-dim">{ui.timelineIntro}</p>
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
                                {s.chapter ?? ui.wrongTurnFallback}
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
                      {ui.windBackButton}
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
          <p className="text-[11px] uppercase tracking-[0.35em] text-noir-ink-dim">{ui.tagline}</p>
          <h1 className="mt-2 font-noir text-2xl font-bold italic text-noir-brass sm:text-3xl">
            {ui.gameTitle}
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-noir-blood" />
        </header>

        <section key={current.id + history.length + lang} className="animate-fade-in flex flex-1 flex-col">
          {imageSrc && (
            <figure className="mb-8 border border-noir-brass/25 p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
              <img
                src={imageSrc}
                alt={imageAlt}
                width={1280}
                height={720}
                loading="lazy"
                className="w-full object-cover opacity-90 sepia-[0.25]"
              />
            </figure>
          )}

          {scene.chapter && (
            <p className="mb-1 text-[11px] uppercase tracking-[0.3em] text-noir-blood-bright">{scene.chapter}</p>
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
            className="cursor-pointer text-[15px] leading-relaxed text-noir-ink/90 sm:text-base"
            aria-live="polite"
          >
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`animate-fade-in whitespace-pre-line ${i > 0 ? "mt-5" : ""} ${
                  !done && i === paragraphs.length - 1 ? "caret" : ""
                }`}
              >
                {p}
              </p>
            ))}
          </div>

          {/* dialogue plate */}
          {scene.dialogue && done && (
            <div className="animate-fade-in mt-8 border-l-2 border-noir-blood-bright bg-noir-bg-raised/70 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-noir-brass">{named(scene.dialogue.speaker)}</p>
              <p className="mt-2 font-noir text-base italic leading-relaxed text-noir-ink">
                “{named(scene.dialogue.line)}”
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
                  {ui.trailColdTitle}
                </p>
                <p className="mt-2 text-xs text-noir-ink-dim">{ui.trailColdSubtitle}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setPanel("timeline")}
                    className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                  >
                    {ui.rewindTimeButton}
                  </button>
                  <button
                    onClick={restart}
                    className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                  >
                    {ui.beginAgainButton}
                  </button>
                </div>
              </div>
            )}

            {done && scene.ending && (
              <div className="border border-noir-brass/40 bg-noir-bg-raised/60 px-5 py-6 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-noir-blood-bright">
                  {ui.endingLabel(endingNumber, ENDING_ORDER.length, scene.title ?? "")}
                </p>
                <p className="mt-3 font-noir text-lg font-bold uppercase tracking-[0.25em] text-noir-brass">
                  {ui.caseClosed}
                </p>
                <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-xs text-noir-ink-dim">
                  {ENDING_ORDER.map((id, i) => (
                    <li key={id} className={id === current.id ? "text-noir-blood-bright" : ""}>
                      {i + 1}. {SCENES[id]!.title}
                      {id === current.id ? ui.yoursTonight : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-noir-ink-dim">{ui.twoDecisions}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={restart}
                    className="border border-noir-blood-bright bg-noir-blood/25 px-6 py-2 text-xs uppercase tracking-[0.25em] text-noir-blood-bright transition-colors hover:bg-noir-blood/40"
                  >
                    {ui.playAgainButton}
                  </button>
                  <button
                    onClick={() => setPanel("timeline")}
                    className="border border-noir-brass/50 px-5 py-2 text-xs uppercase tracking-[0.25em] text-noir-brass transition-colors hover:border-noir-blood-bright hover:text-noir-blood-bright"
                  >
                    {ui.rewindDifferentButton}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-14 text-center text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim/60">
          {ui.footer}
        </footer>
      </div>
    </main>
  );
}
