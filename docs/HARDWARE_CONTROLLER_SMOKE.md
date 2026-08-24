# Xbox controller smoke test

Run this on the target Chromebook after connecting one or two Xbox controllers.
It is intentionally short: the result is a real device observation, not a
claim made from browser code alone.

## 1. Browser visibility

1. Open **Settings → Device & permissions → Controller smoke test**.
2. Press a button on each controller once; Chrome may hide a gamepad until its
   first input.
3. Select **Refresh controllers**, then **Start button check**.

Pass when the screen names one or two browser controllers and reports the
player/button that was pressed. Linux’s local count and Chrome’s browser count
may differ; the browser count is the input path used by NovaShell.

## 2. Shelf ownership

1. Open Pocket Archive but do not launch a game.
2. Use D-pad to move focus and A to open a game detail sheet.
3. Press B once.

Pass when B dismisses the sheet or returns to NovaShell. It must never attempt
to change a game input while the shelf has focus.

## 3. Emulator ownership

1. Launch an owned game and wait for its player surface.
2. Press B, A, D-pad, and sticks as the game expects.
3. Confirm Orbit’s mini-player and NovaShell navigation do not react.

Pass when the emulator owns the controller. NovaShell only resumes global
navigation after the player is closed or Home is deliberately chosen.

## 4. Two-player routing

1. Connect two controllers and repeat the browser visibility check.
2. Choose a game with an actual local-versus or multiplayer mode.
3. Use the game’s own player-select/versus screen to verify both pads.
4. For an N64 fighter, confirm both players can move, block, attack, pause, and
   return to the match without either pad driving both fighters.

Pass when the game receives independent player-one and player-two input. A
single-player title is not a multiplayer failure; it should simply show the
second pad as available but unused.

## Record the result

Record the browser/controller names, game title/core, one-pad result,
two-pad result, and any game-specific layout issue on the local Project Board.
Do not commit controller identifiers, ROM names, or screenshots containing
personal library details to the public repository.
