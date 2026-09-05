# AnimPrompt — AADS V25.6 DevPost Build

AnimPrompt converts an animation scene idea into a structured, renderer-ready production prompt using Google Gemini and the AADS animation-direction framework.

## Live Demo

https://anim-prompt-dev-post-rescue.replit.app

## Features

- Google Gemini-powered prompt generation
- Multiple animation-engine targets
- Visual, directing, performance, emotional, and action controls
- Exact-once dialogue handling
- Character, camera, object, and environmental continuity
- Subject-aware living holds
- Configurable AADS modules
- Vertical and horizontal aspect ratios

## Technology

- Node.js
- JavaScript
- HTML and CSS
- Replit
- Google Gemini API

## Open-Source Submission

This repository contains the complete runnable source code for the DevPost demonstration, including its web interface, Gemini integration, prompt-assembly logic, and focused AADS V25.6 contest kernel.

Separate commercial versions of AADS may contain additional proprietary modules, but they are not required to install or run this submission.

## Local Setup

1. Install dependencies:

   npm install

2. Configure environment variables:

   GEMINI_API_KEY=your_key
   GEMINI_MODEL=gemini-3.6-flash
   SESSION_SECRET=your_session_secret

3. Start the application:

   npm start

Never commit API keys or other secret values to this repository.

## License

Released under the MIT License. See `LICENSE`.
