import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Beale Inheritance — An Interactive Noir Mystery" },
      {
        name: "description",
        content:
          "1943. A banquet at the manor, a famous painting, two bodies by morning. Play the detective in a branching noir mystery where every choice can close the case — or close around your neck.",
      },
      { property: "og:title", content: "The Beale Inheritance — An Interactive Noir Mystery" },
      {
        property: "og:description",
        content:
          "1943. A banquet at the manor, two bodies by morning. A branching noir mystery where every choice can close the case — or close around your neck.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ------------------------------------------------------------------ */
/* Story graph                                                         */
/* ------------------------------------------------------------------ */

type Choice = { label: string; next: string };

type Scene = {
  chapter?: string;
  title?: string;
  text: string;
  choices: Choice[];
  /** Fatal branch: red flash + case-collapsed screen */
  fatal?: boolean;
  /** Final scene of the story */
  ending?: boolean;
};

const SCENES: Record<string, Scene> = {
  prologue: {
    chapter: "Prologue — 1916",
    title: "The Promise",
    text: "Smoke and gunpowder fill the battlefield. The sky is torn by the roar of fighter planes. Two young soldiers crawl through the trenches as bombs fall one after another, the rain of explosives sweeping toward them.\n\nSuddenly, one soldier throws himself over the other, shielding him from the blast with his own body. The bomb does not score a direct hit — but the soldier on top is mortally wounded.\n\nBefore dying, he whispers: \"Jack... stay alive. Go to the Baker Street Orphanage, and please... take good care of my children. Emma and William.\"\n\nWith tear-blurred eyes, Jack replies, \"Dickens, you're not going to die! Hold on!\"",
    choices: [{ label: "Twenty-seven years pass…", next: "ch1_arrive" }],
  },

  ch1_arrive: {
    chapter: "Chapter One — The Banquet",
    title: "The Invitation",
    text: "July 11, 1943. Guests in gorgeous evening gowns and sparkling jewelry walk a grand marble corridor toward the manor's banquet hall. Candlelight flickers across silverware, fine porcelain, and crystal glasses.\n\nYou are William Vernon Beale — adopted son of the host, and a detective of some reputation. Your car was delayed in traffic. The banquet began at nine; it is now a quarter past.\n\nAt the door, the elderly butler greets you.",
    choices: [
      { label: "Present your invitation to the butler", next: "ch1_banquet" },
      { label: "Slip in quietly, unnoticed", next: "dead_alibi" },
    ],
  },

  dead_alibi: {
    title: "A Quiet Entrance",
    text: "You slip past the cloakroom without a word. No one marks your arrival.\n\nThe next morning, when the police reconstruct the night, nobody can say when you arrived — or where you were when the shots were fired. To them, an unmarked guest is not a guest at all.\n\nHe is a suspect.",
    fatal: true,
    choices: [],
  },

  ch1_banquet: {
    chapter: "Chapter One — The Banquet",
    title: "Champagne and Candlelight",
    text: "The butler looks at you respectfully. \"Young master, why did you bring an invitation? Come, let me store your coat.\"\n\nDish after dish arrives — Italian pasta, French foie gras, German sausages — each a work of art. Dancers, musicians, and a mysterious magician hold the guests entranced.\n\nAs the night deepens, the butler announces: \"The master is temporarily occupied, but the true essence of the banquet is about to be revealed. Please follow me to the gallery.\"",
    choices: [
      { label: "Follow the guests to the gallery", next: "ch1_gallery" },
      { label: "Stay behind in the emptying hall", next: "ch1_hall" },
    ],
  },

  ch1_hall: {
    chapter: "Chapter One — The Banquet",
    title: "The Empty Hall",
    text: "You linger among the abandoned glasses. From down the corridor come two sharp cracks — gunshots, muffled by music and laughter. No one else seems to notice. After all, the master of this house keeps a target in his room, and practices whenever he has a free hour.\n\nYou wait a moment, then follow the crowd toward the gallery.",
    choices: [{ label: "Enter the gallery", next: "ch1_gallery" }],
  },

  ch1_gallery: {
    chapter: "Chapter One — The Banquet",
    title: "The Painting",
    text: "The gallery houses a famous painting that has hung here for years. The guests murmur in admiration.\n\n\"I didn't expect to see her here again,\" you whisper to yourself.\n\nMore than half an hour passes unnoticed. On your way back from the bathroom, you spot a young lady alongside a man of similar age. The lady looks terrible — disheveled, tears on her face. The drunk man seems to be forcing her toward a room.\n\nYou step in to help. She politely turns you down.",
    choices: [
      { label: "Force the drunk man away from her", next: "dead_leo" },
      { label: "Offer her a cup of strong tea to sober up", next: "ch2_knock" },
    ],
  },

  dead_leo: {
    title: "An Unforgettable Face",
    text: "You seize the drunk man by the collar and hurl him against the wall. Guests stare. Miss Mary begs you to stop. The man — her husband, Mr. Leo — memorizes your face with drunken, burning hatred.\n\nWeeks later, awaiting the gallows for a murder he insists he staged but did not commit, Leo tells the police everything about the meddling young man by the corridor — including what he saw in your hands as you walked away.\n\nThe noose, in the end, is fitted for another neck.",
    fatal: true,
    choices: [],
  },

  ch2_knock: {
    chapter: "Chapter Two — The Knock",
    title: "Two Officers",
    text: "The drunk man barks at you to get out of the way. Luckily, Miss Mary accepts the tea. The evening winds down; you return to your apartment near the manor.\n\nMorning. Knock, knock. \"Is anyone home? Is Mr. William here?\"\n\nTwo young police officers stand at your door. A murder occurred last night. You reply excitedly: \"I am! You've come to the right person — I can solve any case.\"\n\n\"Sir, you misunderstand. The deceased is Mr. Jack Vernon Beale… your adoptive father.\"",
    choices: [
      { label: "Break down and refuse to answer questions", next: "dead_grief" },
      { label: "Stagger — then compose yourself and demand to assist", next: "ch2_interrogate" },
    ],
  },

  dead_grief: {
    title: "Too Much Grief",
    text: "You collapse against the doorframe and wave the officers away. Your grief is theatrical — and the officers have seen theatrical grief before.\n\nAn heir who inherits an arms fortune, alone in his apartment, refusing to give a statement the morning after a murder. The senior officer files one line in his notebook: 'Bring him in.'\n\nSome performances convince no one.",
    fatal: true,
    choices: [],
  },

  ch2_interrogate: {
    chapter: "Chapter Two — The Knock",
    title: "The Interrogation",
    text: "At the station, you detail your entire timeline: delayed fifteen minutes by traffic; a business disagreement with your father; the banquet; accidentally bumping the butler while dancing; the gallery; an upset stomach and the restroom; a near-fight with your partner Mr. Joseph; Miss Mary disheveled, her husband in high spirits; the cup of tea; then home.\n\nThe senior officer stares intently at you. \"You're lying. You were obviously drunk — how can you remember all these details so clearly?\"",
    choices: [
      { label: "Panic and start revising your story", next: "dead_story" },
      { label: "\"Officer, I am a detective. A good memory is essential.\"", next: "ch2_gunshots" },
    ],
  },

  dead_story: {
    title: "The Story Shifts",
    text: "\"Well — perhaps it was half past, not a quarter. Or was I in the restroom before the gallery? No, after—\"\n\nEvery revision is a thread, and the senior officer pulls each one. By the second interrogation your timeline has more holes than the trench lines of '16.\n\nA detective with a perfect memory was plausible. A liar with a shifting one is a suspect with a motive.",
    fatal: true,
    choices: [],
  },

  ch2_gunshots: {
    chapter: "Chapter Two — The Knock",
    title: "The Letters",
    text: "The officer studies you, then asks: \"Did you hear any gunshots?\"\n\n\"I did. But anyone who knows my adoptive father knows he enjoys target shooting — he kept a target in his room. Hearing gunshots there isn't unusual.\" The young officer nods; your statement checks out.\n\nJust then, another officer enters and hands over several envelopes. Written on them: 'I know who you are. You will not survive this month.'",
    choices: [{ label: "Accompany the police to the villa", next: "ch3_villa" }],
  },

  ch3_villa: {
    chapter: "Chapter Three — The Villa",
    title: "Two Bodies",
    text: "With the leads drying up, the police search the villa. You offer to accompany them — it is, after all, your former home.\n\nIn the first-floor bedroom lies a woman's body. Her face bears obvious slap marks, her abdomen signs of a beating.\n\nOn the second floor lies your adoptive father, Jack Vernon Beale. Both victims have gunshot wounds to the temple, the skin around them slightly charred.\n\n\"Do you suspect they both committed suicide?\" you ask. \"It's a possibility,\" the officer replies. \"Though two suicides on the same night seems too much of a coincidence.\"",
    choices: [
      { label: "Agree: two suicides, case nearly closed", next: "dead_suicide" },
      { label: "Examine the photograph on the floor", next: "ch3_photo" },
    ],
  },

  dead_suicide: {
    title: "An Heir's Haste",
    text: "You press the suicide theory a little too eagerly. The senior officer watches you do it.\n\nTwo bodies, one heir, one fortune in wartime arms contracts — and the heir is the only man arguing that nobody murdered anyone. The inquest adjourns with one conclusion: dig deeper into the son.\n\nAnd once they start digging into you, they do not stop.",
    fatal: true,
    choices: [],
  },

  ch3_photo: {
    chapter: "Chapter Three — The Villa",
    title: "The Dickens Family",
    text: "The officer picks up a photograph from the floor: a young father, a terminally ill mother, and a pair of siblings. On the back — 'Dickens Family.'\n\n\"That's what I looked like when I was young!\" you say in shock. \"Those are my biological parents, and my missing sister… but I've never owned this photo. How did my adoptive father get it?\"\n\nThe senior officer rushes downstairs, reaches into the dead woman's pocket, and pulls out a ring. It matches the ring worn by the mother in the picture.\n\n\"Unfortunately, sir… this lady is very likely your missing sister.\"",
    choices: [{ label: "Collapse beside her, weeping", next: "ch3_gun" }],
  },

  ch3_gun: {
    chapter: "Chapter Three — The Villa",
    title: "The Wrong Caliber",
    text: "You weep bitterly by her pale cheek until the officer gently pulls you up. \"If that's the case, the threatening letter was likely written to her. It seems she already knew her true identity.\"\n\nGradually, you recover your composure — and your logic. An Adams revolver rests in the woman's hand, one bullet missing from its cylinder.\n\nOne detail matters more than any other.",
    choices: [
      { label: "Point out: the temple wound doesn't match this gun's caliber — she was murdered", next: "ch4_forensic" },
      { label: "Say nothing about the gun", next: "dead_silence" },
    ],
  },

  dead_silence: {
    title: "The Detail You Kept",
    text: "You look at the Adams revolver in her hand and keep your observation to yourself. But the young officer in the corner is sharper than he looks — he notices your eyes fix on the wound, then on the gun, then look away.\n\n\"What did you just see, sir?\" he asks quietly. \"And why didn't you say it?\"\n\nA detective who hides evidence from the police has only one reason to do so.",
    fatal: true,
    choices: [],
  },

  ch4_forensic: {
    chapter: "Chapter Four — The Theory",
    title: "Pollen and Pills",
    text: "\"When I touched my sister earlier, I caught a faint scent of pollen,\" you note. A professional forensic examiner is brought in. The report confirms it: Miss Mary was drugged before her death.\n\nYou recall the banquet — the disappearance of your adoptive father, of Mary, of her husband — and form a bold theory:\n\nMary was offered to Mr. Jack by her husband Leo, as a 'gift.' Jack violated her, promising Leo a reward. But Mary dropped the family photograph — and Jack's composure shattered. Overcome with guilt, he took his own life. When Mary regained consciousness and confronted Leo hysterically, he beat her, then lured her into a room and murdered her — staging it as suicide.",
    choices: [
      { label: "Present the theory: Leo is the killer", next: "ch4_webley" },
      { label: "Accuse the elderly butler instead", next: "dead_butler" },
    ],
  },

  dead_butler: {
    title: "The Wrong Man",
    text: "You lay out an elaborate case against the butler. The senior officer listens politely — then dismantles it in four sentences. The butler served champagne in front of two hundred witnesses from nine until midnight without leaving the hall.\n\n\"Strange,\" the officer muses, \"that a detective of your talents would build a case that collapses this fast. Unless you needed it to collapse. Unless you needed anyone but the real killer blamed.\"\n\nHe does not say the real killer's name. He doesn't have to.",
    fatal: true,
    choices: [],
  },

  ch4_webley: {
    chapter: "Chapter Four — The Theory",
    title: "The Webley",
    text: "Upstairs, the officers discover a Webley revolver missing two bullets from its cylinder.\n\n\"This model is a staple among military men,\" you state confidently. \"You can match the bullet from my sister's body to it. Both my adoptive father and Leo work in the arms trade — both would own a Webley.\"\n\nThe police act swiftly, tracking down Leo and taking him into custody. He protests: \"What direct evidence do you actually have to prove I'm the killer?\"",
    choices: [{ label: "Find the second Webley revolver", next: "ch5_search" }],
  },

  ch5_search: {
    chapter: "Chapter Five — The Search",
    title: "Something Too Convenient",
    text: "\"Once we locate the second Webley revolver, your guilt will be indisputable,\" the young officer declares. As Leo's face turns pale, the officers join the effort to search for the missing firearm.\n\nOnly the senior officer remains deep in thought. Something feels too convenient — Emma's identity, the two spent rounds in Jack's revolver, the threatening letter.\n\nHe turns and glances at you, sitting in the lobby of the Metropolitan Police Department, lost in thought.",
    choices: [
      { label: "Hold his gaze, calm as still water", next: "ch6_well" },
      { label: "Look away and hurry home", next: "dead_gaze" },
    ],
  },

  dead_gaze: {
    title: "The Man Who Looked Away",
    text: "You drop your eyes and reach for your coat. It lasts two seconds — but in that gesture the senior officer reads an entire confession.\n\nHe never proves anything. He doesn't need to. From that day, an unmarked car sits outside your apartment, your telegrams are read before you receive them, and every favor you ever collected quietly turns to ash.\n\nThere are prisons without walls.",
    fatal: true,
    choices: [],
  },

  ch6_well: {
    chapter: "Chapter Six — The Verdict",
    title: "The Well",
    text: "After a relentless search, officers dredge a damaged Webley revolver from a well near the villa. One bullet missing from its cylinder. Leo's guilt is sealed.\n\nA few days later, Leo is sentenced to death by hanging.\n\nThe senior officer looks at you with renewed suspicion. You simply shake your head, walk over, and whisper softly into his ear:\n\n\"I told you from the start — you found the right person.\"",
    choices: [{ label: "The truth", next: "ch7_truth" }],
  },

  ch7_truth: {
    chapter: "Chapter Seven — The Right Person",
    title: "The Perfect Crime",
    text: "Yes. The police really had found the right person.\n\nYou arrived late so the butler would remember you. You stole Jack's revolver and sleeping pills while he talked business. You knew the threatening letter was addressed to you — written by your dear sister, who knew you were undercutting your adoptive father's arms trade. The tea you served was spiked; this time, Emma would not wake up.\n\nYou swapped Leo's identical Webley into her hands, knowing he would assume he killed her in a drunken stupor and stage her suicide. You provoked a fight with Mr. Joseph to forge your alibi. Then you went upstairs to 'discuss business' — and shot Jack while the guests danced below. The family photograph was your final touch: a guilt-stricken suicide.\n\nOf course, a man like Jack would never end his life over something so trivial.\n\nDickens died so Jack could live. Jack died so you could inherit. And Emma — Emma wrote to the wrong brother.\n\nThe case is closed. The detective solved it.",
    choices: [],
    ending: true,
  },
};

const START_SCENE = "prologue";

/* ------------------------------------------------------------------ */
/* Typewriter hook                                                     */
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
        return l + 2;
      });
    }, 18);
    return () => window.clearInterval(id);
  }, [text]);

  const skip = useCallback(() => setLen(text.length), [text]);
  return { shown: text.slice(0, len), done, skip };
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

function Index() {
  const [sceneId, setSceneId] = useState(START_SCENE);
  const [flashKey, setFlashKey] = useState(0);
  const scene = SCENES[sceneId];
  const { shown, done, skip } = useTypewriter(scene.text);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    if (scene.fatal) setFlashKey((k) => k + 1);
  }, [sceneId, scene.fatal]);

  const restart = () => setSceneId(START_SCENE);

  return (
    <main
      className="vignette grain relative min-h-screen bg-noir-bg font-typewriter text-noir-ink"
      style={{ animation: "lamp-flicker 7s linear infinite" }}
    >
      {/* blood-red flash on fatal choices */}
      {scene.fatal && flashKey > 0 && (
        <div
          key={flashKey}
          className="animate-red-flash pointer-events-none fixed inset-0 z-50 bg-noir-blood-bright"
        />
      )}

      {/* drifting smoke */}
      <div className="smoke pointer-events-none fixed inset-0 z-0" />

      <div ref={scrollRef} className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-14 sm:py-20">
        {/* masthead */}
        <header className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-noir-ink-dim">
            An Interactive Noir Mystery
          </p>
          <h1 className="mt-2 font-noir text-2xl font-bold italic text-noir-brass sm:text-3xl">
            The Beale Inheritance
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-noir-blood" />
        </header>

        {/* scene card */}
        <div key={sceneId} className="animate-fade-in flex flex-1 flex-col">
          {scene.chapter && (
            <p className="mb-1 text-[11px] uppercase tracking-[0.3em] text-noir-blood-bright">
              {scene.chapter}
            </p>
          )}
          {scene.title && (
            <h2
              className={`mb-6 font-noir text-xl italic text-noir-ink sm:text-2xl ${
                scene.fatal || scene.ending ? "animate-tremble text-noir-blood-bright" : ""
              }`}
            >
              {scene.title}
            </h2>
          )}

          {/* story text — click to skip the typewriter */}
          <div
            onClick={skip}
            className={`cursor-pointer text-[15px] leading-relaxed whitespace-pre-line text-noir-ink/90 sm:text-base ${
              done ? "" : "caret"
            }`}
            aria-live="polite"
          >
            {shown}
          </div>

          {/* choices */}
          <div className="mt-10 flex flex-col gap-3">
            {done &&
              !scene.fatal &&
              !scene.ending &&
              scene.choices.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setSceneId(c.next)}
                  className="animate-scale-in border border-noir-brass/40 bg-noir-bg-raised/60 px-5 py-3 text-left text-sm tracking-wide text-noir-ink transition-all duration-200 hover:border-noir-blood-bright hover:bg-noir-blood/20 hover:pl-7 hover:text-noir-blood-bright focus:outline-none focus:ring-1 focus:ring-noir-blood-bright"
                >
                  <span className="mr-2 text-noir-blood-bright">▸</span>
                  {c.label}
                </button>
              ))}

            {done && scene.fatal && (
              <div className="animate-scale-in border border-noir-blood-bright/60 bg-noir-blood/15 px-5 py-6 text-center">
                <p className="font-noir text-lg font-bold uppercase tracking-[0.25em] text-noir-blood-bright">
                  The Trail Goes Cold
                </p>
                <p className="mt-2 text-xs text-noir-ink-dim">
                  One wrong turn, and the case — or the detective — is finished.
                </p>
                <button
                  onClick={restart}
                  className="mt-5 border border-noir-brass/50 px-6 py-2 text-sm tracking-widest text-noir-brass transition-colors hover:border-noir-blood-bright hover:bg-noir-blood/20 hover:text-noir-blood-bright"
                >
                  Begin Again — 1916
                </button>
              </div>
            )}

            {done && scene.ending && (
              <div className="animate-scale-in border border-noir-brass/40 bg-noir-bg-raised/60 px-5 py-6 text-center">
                <p className="font-noir text-lg font-bold uppercase tracking-[0.25em] text-noir-brass">
                  Case Closed
                </p>
                <p className="mt-2 text-xs text-noir-ink-dim">
                  You reached the true ending. Every alibi held. Every thread was cut.
                </p>
                <button
                  onClick={restart}
                  className="mt-5 border border-noir-brass/50 px-6 py-2 text-sm tracking-widest text-noir-brass transition-colors hover:border-noir-blood-bright hover:bg-noir-blood/20 hover:text-noir-blood-bright"
                >
                  Read It Again, Knowing What You Know
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-14 text-center text-[10px] uppercase tracking-[0.3em] text-noir-ink-dim/60">
          London · 1943 · Every choice is evidence
        </footer>
      </div>
    </main>
  );
}
