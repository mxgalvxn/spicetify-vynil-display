#  Vinyl Fullscreen for Spicetify

![Built with Claude](https://shields.io)

A [Spicetify](https://spicetify.app) extension that adds a **fullscreen mode featuring a spinning vinyl record**. While a song is playing, a vinyl record spins with the album artwork at its center, and a turntable tonearm lowers onto the grooves. When playback is paused, the record gradually slows down with inertia and the tonearm lifts.

## Screenshots

<img width="1920" height="1079" alt="Fullscreen Preview" src="https://github.com/user-attachments/assets/8defebc1-c761-4e0e-99dd-a2aaa5e928b0" />
<p align="center">
  <img width="453" height="139" alt="Bar Icon" src="https://github.com/user-attachments/assets/c0d1daac-0f47-4a55-9a74-5bd79953f862" />
</p>

## Features

- **Realistic vinyl record:** Dark record with concentric grooves, a fixed highlight that does not rotate with the record, and a static shadow.
- **Center album artwork:** Takes up 15% of the record and rotates along with it.
- **Smooth acceleration and deceleration:** The record gradually speeds up and slows down when playback starts or pauses, rather than stopping abruptly.
- **Turntable tonearm:** Features a grid-patterned base, silver tonearm, and black headshell with a red stylus. It lowers during playback, moves toward the center as the song progresses, and lifts when paused.
- **Blurred background:** Fullscreen background featuring the current album artwork, blurred and darkened.
- **Complete music player:** Displays the song title, artist, progress bar with timestamps (click to seek), shuffle, previous, play/pause, next, and repeat controls.
- **Multiple ways to open:** Button in the player bar, button in the top bar, and keyboard shortcut `Ctrl + Shift + V`.

##  Requirements

- [Spicetify CLI](https://spicetify.app/docs/getting-started) installed and applied to your Spotify desktop client.
- Spotify desktop application (Windows, macOS, or Linux).

>  Spotify updates frequently and may occasionally break Spicetify functionality. If something stops working after an update, first make sure you are running the latest version of Spicetify.

##  Installation

**1. Copy `vinyl-fullscreen.js` into the Spicetify extensions folder:**

| Operating System | Path |
|---|---|
| Windows | `%appdata%\spicetify\Extensions\` |
| macOS / Linux | `~/.config/spicetify/Extensions/` |

If you don't know where the folder is, run:

```bash
spicetify path userdata
```

**2. Enable the extension and apply the changes:**

```bash
spicetify config extensions vinyl-fullscreen.js
spicetify apply
```

**3. Open Spotify.** A button with an icon will appear in the player bar (and another one in the top bar).

##  Usage

1. Play a song.
2. Click the vinyl button or use `Ctrl + Shift + V`.
3. To exit, press `Esc` or click the `×` button in the corner.

##  Customization

At the beginning of `vinyl-fullscreen.js`, you'll find several constants that are easy to modify:

| Constant | Description | Default Value |
|---|---|---|
| `RPM` | Vinyl rotation speed | `33` |
| `EASE` | How quickly the record accelerates and decelerates (lower values = more inertia) | `2.2` |
| `LABEL_RATIO` | Album artwork size relative to the record | `0.15` (15%) |
| `ARM_REST` | Angle of the raised tonearm (degrees) | `11.5` |
| `ARM_PLAY_START` | Tonearm angle at the beginning of a song | `-10.5` |
| `ARM_PLAY_END` | Tonearm angle at the end of a song | `-25` |
| `ARM_EASE` | Speed at which the tonearm moves up and down | `2.2` |

The colors, highlights, and shapes of the vinyl record and tonearm can be found in the CSS section of the same file. For example, the tonearm's metallic color is defined in the `#vf-shaft` rule.

##  Development

To see your changes live while editing:

```bash
spicetify watch -e vinyl-fullscreen.js
```

To debug, enable the developer tools with `spicetify enable-devtool` and open them inside Spotify using `Ctrl + Shift + I`.

##  How It Works

- Creates its own fullscreen *overlay* instead of modifying Spotify's native fullscreen player, which is minified and changes with every update.
- Retrieves the current track, playback state, and progress using the `Spicetify.Player` API.
- The record rotation and tonearm movement are calculated in a loop using `requestAnimationFrame`, gradually approaching their target speed and angle. This creates smooth acceleration and deceleration instead of abrupt stops.
- The highlight and shadow are placed on separate elements that do not rotate, keeping the lighting fixed while the record spins.

##  Troubleshooting

**The button does not appear.**

- Check that `vinyl-fullscreen.js` appears under `extensions` when running `spicetify config`, then run `spicetify apply` again.
- Open the developer console and run `document.getElementById("vf-overlay")`. If it returns `null`, the extension did not load.
- Try the `Ctrl + Shift + V` shortcut, which works even if the button is not visible.

**The button appears, but the icon is missing.**

- Use a native Spicetify icon instead of a custom SVG (the extension already does this by default).

**The album artwork is not visible.**

- Try playing another song. Some content (such as certain podcasts) may not provide artwork in the expected format.
