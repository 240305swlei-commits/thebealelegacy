# Story Weaver

I will give you my story but here are the instructions
Today, you are a Director. You will build an interactive "Choose Your Own Adventure" story app.
The user will read a story segment, make a choice (by clicking a button), and the screen will update with the consequences of that choice.
The Twist: The "Vibe" is the storytelling medium.

A Horror story needs spooky fonts, dark backgrounds, and perhaps a "trembling" effect on the text.

A Sci-Fi story needs a futuristic terminal look, neon green text, and "typing" animations.

A Comedy needs bright colors and bouncy buttons.

Step-by-Step Instructions1. Brainstorm Your Plot (5 Minutes)

Before opening the AI, decide on your scenario. Keep it simple (3-4 "scenes" deep).

Example: You are stuck in a cursed high school at night. Do you go to the cafeteria or the gym?

Phase 1: The Engine (The Logic)Open your AI tool (Replit/Bolt/v0) and ask for the basic structure.

Prompt Template:"Build a text-based adventure game.

There should be a main text area describing the current scene.

Below it, there should be 2 buttons for choices.

When I click a button, the text and buttons should update to the next part of the story.

Start with this scene: [Insert your opening sentence here]."

Phase 2: The Atmosphere (The Vibe)
Now, style the app to match your genre. This is where the magic happens.

Horror Prompt: "Make the background black. Make the text a creepy red serif font. Add a vignette shadow around the edges of the screen."

Retro Prompt: "Make it look like a Windows 95 computer. Use gray buttons and a pixelated font."

Fantasy Prompt: "Make the background look like old parchment paper. Use a calligraphy font in dark brown."

Phase 3: The Content (Branching)Tell the AI how the story progresses. You don't need to write code arrays; just explain the story.

Prompt Example:"Add the logic for the choices:
If they choose 'Open the Door', change the text to 'A goblin jumps out!' and give choices 'Run' or 'Fight'.
If they choose 'Wait', change text to 'You fell asleep.' and show a 'Game Over' button."

Phase 4: Polish & ImmersionAsk for one interactive detail to sell the vibe.

Ideas:

"Make the text type out one character at a time like a typewriter."

"Flash the screen red when the player gets a Game Over."

"Add a background ambient sound of rain."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thebealelegacy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c298e8e-eebb-4676-a8c2-aa392be1b838).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
