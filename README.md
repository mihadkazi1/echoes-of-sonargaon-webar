# 🏛️ Echoes of Sonargaon: The Cursed Guardian

### An Immersive Image-Target WebAR Adventure

**A browser-based augmented reality game inspired by ancient heritage, mysterious guardians, and interactive 3D combat.**

[🎮 Play the Game](https://echoes-of-sonargaon-webar.netlify.app) · [💻 View Source Code](https://github.com/mihadkazi1/echoes-of-sonargaon-webar)

---

## 🎮 Gameplay Preview

![Echoes of Sonargaon gameplay screenshot](./GAMEPLAY.jpg)

*Explore the experience, encounter the cursed guardian, and uncover the hidden treasure through augmented reality.*

## ✨ About the Project

**Echoes of Sonargaon: The Cursed Guardian** is an image-target-based WebAR game built with **8th Wall, TypeScript, and interactive 3D assets**.

The experience brings digital content into the real world through image-target tracking. Players can interact with an ancient gate, encounter a guardian, engage with combat mechanics, and discover a hidden treasure—all through a web browser without installing a traditional mobile application.

This project explores the combination of **Augmented Reality (AR), 3D animation, event-driven interactions, gameplay programming, and spatial experiences**.

## 🚀 Play the WebAR Experience

**[▶ Launch Echoes of Sonargaon](https://echoes-of-sonargaon-webar.netlify.app)**

To experience the game, use a compatible smartphone with a working camera and an internet connection.

### 📱 How to Play

1. **Open the game:** Visit the live game link using your smartphone browser.
2. **Allow camera access:** Grant permission when the browser requests access to your camera.
3. **Scan the target:** Point your camera at the image below. You can print it or display it on a separate screen.
4. **Explore the experience:** Follow the on-screen instructions and interact with the AR elements.
5. **Face the guardian:** Discover the environment, experience the combat interactions, and progress toward the treasure reveal.

### 🖼️ Image Target — Scan to Experience

The following image is the target used to activate the augmented reality experience.

![Sonargaon WebAR image target — scan this image](./image-targets/sonargaon-poster_original.png)

**Tips for successful tracking**
- Keep the entire image visible inside the camera frame.
- Use bright, even lighting and avoid glare or reflections.
- Keep the image flat and reasonably stable while tracking.
- If scanning from a screen, increase its brightness and avoid reflections.

> **Important:** The image above is the intended tracking target, not a QR code. Open the game first, then point the camera at the target.

## ⚔️ Key Features

- **Image-Target Augmented Reality** — Activate and experience digital content through image recognition.
- **Interactive 3D Environment** — Integrate 3D models and immersive scene elements into a browser-based experience.
- **Guardian Encounter** — Reveal the cursed guardian through gameplay progression.
- **Combat Interactions** — Implement player attack interactions, sword effects, and guardian damage behavior.
- **Animation Control** — Coordinate character animations with gameplay events and state transitions.
- **Interactive Gate and Treasure** — Unlock progression through gate interactions and treasure-reveal mechanics.
- **Audio Integration** — Use sound effects for gate opening, guardian roars, sword hits, damage, treasure reveals, and game completion.
- **Browser-Based Experience** — Access the deployed experience through a compatible browser without a conventional app installation.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| 8th Wall | WebAR and image-target tracking |
| TypeScript | Gameplay logic and custom controllers |
| JavaScript | Application and interaction logic |
| HTML5 | Web-based experience |
| 3D Assets | Character, environment, weapon, and treasure models |
| Web Audio API | Sound playback and audio interaction |
| Git & GitHub | Version control and source code management |
| Git LFS | Storage for supported large binary assets |
| Netlify | Hosting the exported HTML5 experience |

## 🧩 Technical Highlights

The project includes custom controllers and interaction components for different gameplay systems.

| Component | Responsibility |
|---|---|
| `CursedGuardianController.ts` | Guardian behavior, combat states, and damage handling |
| `GameAudioController.ts` | Audio loading, playback, and gameplay sound events |
| `GuardianCombat.ts` | Guardian combat interactions |
| `SwordSlashController.ts` | Sword-slash behavior |
| `SwordTouchAttack.ts` | Touch-based attack interaction |
| `TapToOpenGate.ts` | Gate interaction |
| `RevealGuardianAfterGate.ts` | Guardian reveal and progression |
| `TapToCollectRelic.ts` | Relic collection interaction |
| `TreasureChestController.ts` | Treasure chest behavior |

The implementation uses separate components to keep gameplay interactions and audio behavior organized.

## 📂 Project Structure

```text
echoes-of-sonargaon-webar/
├── .github/
│   └── workflows/
├── config/
├── image-targets/
│   └── sonargaon-poster_original.png
├── src/
│   ├── assets/
│   │   └── Audio/
│   ├── CursedGuardianController.ts
│   ├── GameAudioController.ts
│   ├── GuardianCombat.ts
│   ├── SwordSlashController.ts
│   ├── SwordTouchAttack.ts
│   ├── TapToOpenGate.ts
│   ├── TapToCollectRelic.ts
│   ├── TreasureChestController.ts
│   └── index.html
├── GAMEPLAY.jpg
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*This is a simplified overview of the repository. Other source files and assets are included.*

## 💻 Source Code and Local Development

Explore or clone the repository:

```bash
git lfs install
git clone https://github.com/mihadkazi1/echoes-of-sonargaon-webar.git
cd echoes-of-sonargaon-webar
```

Install the project dependencies:

```bash
npm install
```

**Running the project:** Open it in the compatible 8th Wall development environment and follow the available project configuration and scripts. The standard exported HTML5 build is hosted separately at the live demo link above; cloning the repository alone does not automatically start the deployed experience.

Git LFS is required to retrieve assets stored through Git LFS. A compatible development environment and the necessary project access may also be required.

## 🌐 Project Links

- **Live WebAR Game:** [echoes-of-sonargaon-webar.netlify.app](https://echoes-of-sonargaon-webar.netlify.app)
- **GitHub Repository:** [mihadkazi1/echoes-of-sonargaon-webar](https://github.com/mihadkazi1/echoes-of-sonargaon-webar)

## 🎯 Learning Outcomes

This project provided practical experience in:

- Developing browser-based augmented reality experiences.
- Working with image-target recognition and tracking.
- Building interactive gameplay mechanics using TypeScript.
- Integrating 3D models and coordinating animations.
- Implementing event-driven audio and combat interactions.
- Managing source code, binary assets, and deployment workflows.

## 👨‍💻 Developer

**Kazi Saqlain Mihad**  
CSE Student | Game Developer | AR Developer

Interested in building immersive experiences through **Augmented Reality, game development, interactive 3D applications, and software engineering**.

- GitHub: [@mihadkazi1](https://github.com/mihadkazi1)

---

## 📜 Asset and License Information

This repository contains source code and project assets used in the WebAR experience. Third-party models, textures, audio, and other assets may be subject to their respective licenses and attribution requirements.

Before redistributing or reusing individual assets, review the applicable license terms. The presence of an asset in this repository does not necessarily grant permission for unrestricted reuse.

---

**Step into the past. Face the guardian. Discover the treasure.** 🏛️⚔️
