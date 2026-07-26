# Catan hand tracker

A small Next.js app for tracking your resource and development cards during a
game of Catan. Niche, but handy for a remote player following along over a board cam. 
I made this for a friend. I would share my screen with him, and updated it as the game goes on, so that he would know what is happening in the game.

Icons were downloaded from https://game-icons.net/tags/catan.html


## Run it


```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Counts are saved to the browser's local storage, so they persist if you
reload the page mid-game. Use "Reset hand" to start a new game.

## Deploy

This is a standard Next.js app, so it deploys as-is to Vercel, Netlify, or
any Node hosting: `npm run build && npm start`.
