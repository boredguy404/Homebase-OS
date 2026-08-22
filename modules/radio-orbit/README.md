# Radio Orbit

A terminal-native internet radio player with sound-reactive spinning ASCII 3D
visualizers, powered by Radio Browser. It uses FFmpeg/FFplay already available
in the Chromebook Linux environment.

## Run on Chromebook Linux

```bash
cd ~/homebase/modules/radio-orbit
python3 radio_orbit_tui.py
```

Use the keys shown along the bottom. Press `q` to quit.

You can also open the Chromebook launcher, choose **Linux apps**, and click
**Radio Orbit**. It opens directly inside a persistent tmux terminal session.
If launched from an existing XMatrix Buddy tmux pane, it runs in that pane.

If port 8080 is busy, run `PORT=9090 ./run.sh` and open that port instead.

Some radio stations block browser playback or do not permit audio analysis. Radio Orbit automatically keeps the animation moving in those cases; choose another station if a stream will not start.
