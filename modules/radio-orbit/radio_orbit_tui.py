#!/usr/bin/env python3
"""Radio Orbit — terminal-native internet radio and ASCII visualizers."""
import curses
import json
import math
import os
import random
import signal
import struct
import subprocess
import threading
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

APIS = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://at1.api.radio-browser.info"]
FAV_FILE = Path.home() / ".config" / "radio-orbit" / "favorites.json"


class Orbit:
    def __init__(self, screen):
        self.s = screen
        self.items, self.filtered = [], []
        self.selected = self.scroll = 0
        self.query, self.message = "Lo", "SCANNING AIRWAVES..."
        self.mode, self.playing, self.player, self.decoder = 0, False, None, None
        self.energy, self.peaks = .15, [0.1] * 32
        self.audio_floor, self.audio_peak, self.last_audio = .02, .12, 0
        self.current, self.searching, self.favs_only = None, False, False
        self.favorites = self.load_favorites()
        self.fetch(self.query)

    def load_favorites(self):
        try: return set(json.loads(FAV_FILE.read_text()))
        except Exception: return set()

    def save_favorites(self):
        FAV_FILE.parent.mkdir(parents=True, exist_ok=True)
        FAV_FILE.write_text(json.dumps(sorted(self.favorites)))

    def fetch(self, query):
        self.message = "SCANNING AIRWAVES..."
        def work():
            error = "station servers unavailable"
            for host in APIS:
                try:
                    params = urlencode({"limit": 60, "hidebroken": "true", "order": "clickcount", "reverse": "true", "name": query})
                    req = Request(host + "/json/stations/search?" + params, headers={"User-Agent": "RadioOrbit/1.0"})
                    with urlopen(req, timeout=12) as r: data = json.load(r)
                    self.items = [x for x in data if x.get("url_resolved") and x.get("name")]
                    self.apply_filter(); self.message = f"{len(self.filtered)} SIGNALS FOUND"; return
                except Exception as e: error = str(e)
            self.message = "SIGNAL LOST: " + error[:55]
        threading.Thread(target=work, daemon=True).start()

    def sid(self, item): return item.get("stationuuid") or item.get("url_resolved", "")
    def apply_filter(self):
        self.filtered = [x for x in self.items if not self.favs_only or self.sid(x) in self.favorites]
        self.selected = min(self.selected, max(0, len(self.filtered)-1)); self.scroll = 0

    def play(self, item):
        self.stop()
        try:
            url=item["url_resolved"]
            self.player = subprocess.Popen(["mpv", "--no-video", "--really-quiet", "--audio-display=no", "--cache=yes", "--cache-secs=8", url], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.decoder = subprocess.Popen(["ffmpeg", "-loglevel", "quiet", "-i", url, "-vn", "-f", "s16le", "-ac", "1", "-ar", "8000", "pipe:1"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            threading.Thread(target=self.pump_audio, daemon=True).start()
            self.current, self.playing = item, True; self.message = "CONNECTED"
        except Exception as e: self.message = "PLAYBACK ERROR: " + str(e)[:45]

    def pump_audio(self):
        """Forward decoded PCM to the player while deriving live visual energy."""
        try:
            while self.decoder and self.player:
                chunk = self.decoder.stdout.read(4096)
                if not chunk: break
                samples = struct.unpack("<" + "h" * (len(chunk)//2), chunk[:len(chunk)//2*2])
                if samples:
                    rms = math.sqrt(sum(x*x for x in samples) / len(samples)) / 32768
                    self.audio_floor=min(rms,self.audio_floor*.995+rms*.005)
                    self.audio_peak=max(rms,self.audio_peak*.985)
                    reactive=max(0,min(1,(rms-self.audio_floor)/max(.008,self.audio_peak-self.audio_floor)))
                    self.energy += (reactive - self.energy) * (.55 if reactive>self.energy else .18)
                    self.last_audio=time.time()
                    size = max(1, len(samples)//len(self.peaks))
                    fresh=[]
                    for i in range(len(self.peaks)):
                        part=samples[i*size:(i+1)*size]
                        raw=sum(abs(x) for x in part)/max(1,len(part))/32768
                        fresh.append(max(0,min(1,(raw-self.audio_floor)/max(.008,self.audio_peak-self.audio_floor))))
                    self.peaks=[old*.55+new*.45 for old,new in zip(self.peaks,fresh)]
        except (BrokenPipeError, OSError, ValueError): pass

    def stop(self):
        for proc in (self.decoder, self.player):
            if proc and proc.poll() is None:
                proc.terminate()
                try: proc.wait(timeout=.4)
                except subprocess.TimeoutExpired: proc.kill()
        self.decoder, self.player, self.playing = None, None, False

    def pause(self):
        if not self.player or self.player.poll() is not None: return
        for proc in (self.decoder,self.player):
            if proc and proc.poll() is None: os.kill(proc.pid, signal.SIGSTOP if self.playing else signal.SIGCONT)
        self.playing = not self.playing

    def text(self, y, x, value, attr=0, width=None):
        h, w = self.s.getmaxyx()
        if 0 <= y < h and x < w:
            value = str(value); value = value[:max(0, (width if width is not None else w-x)-1)]
            try: self.s.addstr(y, max(0,x), value, attr)
            except curses.error: pass

    def visual(self, top, height, width, now):
        if height < 3: return
        synced=self.playing and now-self.last_audio<2
        e = self.energy if synced else .12+.04*math.sin(now*2)
        cx, cy = width//2, top+height//2
        def project(p, scale=1):
            x,y,z=p; ax=now*(.55+e*1.8); ay=now*(.38+e*1.1)
            x,z=x*math.cos(ax)-z*math.sin(ax),x*math.sin(ax)+z*math.cos(ax)
            y,z=y*math.cos(ay)-z*math.sin(ay),y*math.sin(ay)+z*math.cos(ay)
            depth=3.8+z; return int(cx+x*width*.12*scale/depth),int(cy+y*height*.24*scale/depth),z
        if self.mode == 0: # cube
            verts=[(x,y,z) for x in (-1,1) for y in (-1,1) for z in (-1,1)]
            edges=[(i,j) for i,a in enumerate(verts) for j,b in enumerate(verts) if j>i and sum(a[k]!=b[k] for k in range(3))==1]
            pts=[project(v,2.0+e*3.2) for v in verts]
            for a,b in edges:
                x1,y1,_=pts[a];x2,y2,_=pts[b]; steps=max(abs(x2-x1),abs(y2-y1),1)
                for n in range(steps+1): self.text(round(y1+(y2-y1)*n/steps),round(x1+(x2-x1)*n/steps),"◆" if n in (0,steps) else "·",curses.color_pair(1 if e>.35 else 2))
        elif self.mode == 1: # torus
            for i in range(36):
                u=i*math.pi/18
                for j in range(12):
                    v=j*math.pi/6; r=1.25+(.42+e*.28)*math.cos(v)
                    x,y,z=r*math.cos(u),(.42+e*.28)*math.sin(v),r*math.sin(u)
                    px,py,pz=project((x,y,z),2.3)
                    self.text(py,px,"@" if pz>.2 else "·",curses.color_pair(1 if pz>.2 else 2))
        elif self.mode == 2: # reactive orb
            for lat in range(-4,5):
                phi=lat*math.pi/10
                for i in range(32):
                    a=i*math.pi/16; bump=1+self.peaks[i%len(self.peaks)]*.55
                    p=(math.cos(phi)*math.cos(a)*bump,math.sin(phi)*bump,math.cos(phi)*math.sin(a)*bump)
                    px,py,pz=project(p,2.5); self.text(py,px,"●" if pz>0 else "·",curses.color_pair(1 if self.peaks[i%32]>.35 else 2))
        elif self.mode == 3: # spectrum
            for x in range(1,width-1,2):
                level=int(self.peaks[(x*len(self.peaks)//max(1,width))%len(self.peaks)]*height*.9)
                for j in range(max(1,level)): self.text(top+height-1-j,x,"█",curses.color_pair(1 if j>height*.6 else 2))
        elif self.mode == 4: # DNA helix
            for y in range(height):
                phase=now*2+y*.42; span=(width*.18)*(1+e*.5)
                x1=int(cx+math.sin(phase)*span); x2=int(cx-math.sin(phase)*span)
                self.text(top+y,x1,"●",curses.color_pair(1)); self.text(top+y,x2,"◆",curses.color_pair(2))
                if y%3==0:
                    for x in range(min(x1,x2)+1,max(x1,x2),2): self.text(top+y,x,"─",curses.color_pair(3))
        elif self.mode == 5: # starfield vortex
            random.seed(42)
            for i in range(180):
                base=random.random(); a=random.random()*math.tau+now*(.25+base)+e*2
                r=(base*min(width*.42,height*.9)+now*8*(.5+e))%(min(width*.42,height*.9))
                x=int(cx+math.cos(a)*r*1.8); y=int(cy+math.sin(a)*r*.55)
                self.text(y,x,"✦" if base>.86 else "·",curses.color_pair(1 if base>.7 else 2))
        elif self.mode == 6: # waveform tunnel
            for ring in range(12):
                z=((ring/12+now*.18)%1); rx=max(2,int(z*width*.43)); ry=max(1,int(z*height*.46))
                amp=self.peaks[ring*2%32]
                for i in range(32):
                    a=i*math.pi/16; x=int(cx+math.cos(a)*rx*(1+amp*.18)); y=int(cy+math.sin(a)*ry)
                    self.text(y,x,"#" if z>.7 else "·",curses.color_pair(1 if amp>.3 else 2))
        else: # rotating pyramid
            verts=[(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(0,1.4,0)]
            pts=[project(v,2.4+e*1.5) for v in verts]
            for a,b in [(0,1),(1,2),(2,3),(3,0),(0,4),(1,4),(2,4),(3,4)]:
                x1,y1,_=pts[a];x2,y2,_=pts[b]; steps=max(abs(x2-x1),abs(y2-y1),1)
                for n in range(steps+1): self.text(round(y1+(y2-y1)*n/steps),round(x1+(x2-x1)*n/steps),"▲" if n in (0,steps) else "·",curses.color_pair(1))
        # A universal beat halo makes the live audio response unmistakable.
        radius=max(2,int((min(width*.36,height*.45))*(.45+e*.75)))
        for i in range(40):
            a=i*math.tau/40; x=int(cx+math.cos(a)*radius*1.8); y=int(cy+math.sin(a)*radius*.55)
            self.text(y,x,"✦" if e>.62 and i%3==0 else "·",curses.color_pair(1 if e>.45 else 3))

    def draw(self):
        self.s.erase(); h,w=self.s.getmaxyx(); now=time.time()
        if h<18 or w<65:
            self.text(1,2,"RADIO ORBIT",curses.A_BOLD|curses.color_pair(1)); self.text(3,2,"Make the terminal at least 65 × 18."); self.s.refresh(); return
        split=max(30,int(w*.43)); left=w-split-1
        self.text(1,2,"◉ RADIO ORBIT",curses.A_BOLD|curses.color_pair(1)); self.text(1,w-18,"● LIVE SIGNAL",curses.color_pair(1))
        self.text(3,2,"TERMINAL TRANSMISSION / WORLDWIDE",curses.color_pair(3))
        name=(self.current or {}).get("name","FIND YOUR FREQUENCY")
        self.text(5,2,name.upper(),curses.A_BOLD,width=left-2)
        meta="NO SIGNAL SELECTED" if not self.current else " · ".join(filter(None,[self.current.get("country"),self.current.get("codec"),str(self.current.get("bitrate") or "")+" KBPS"]))
        self.text(6,2,meta,curses.color_pair(3),left-2)
        vtop=8; vheight=max(5,h-13); self.visual(vtop,vheight,left,now)
        for y in range(h): self.text(y,left,"│",curses.color_pair(3))
        self.text(3,left+3,"01  BROWSE SIGNALS",curses.A_BOLD)
        self.text(5,left+3,"/ SEARCH   f FAVORITES   ♥ SAVE",curses.color_pair(3),split-3)
        self.text(6,left+3,"> "+self.query+("_" if self.searching else ""),curses.color_pair(1),split-3)
        self.text(8,left+3,self.message,curses.color_pair(3),split-3)
        list_top=10; available=h-list_top-3
        if self.selected < self.scroll: self.scroll=self.selected
        if self.selected >= self.scroll+available: self.scroll=self.selected-available+1
        for row,item in enumerate(self.filtered[self.scroll:self.scroll+available]):
            idx=self.scroll+row; y=list_top+row; chosen=idx==self.selected
            attr=(curses.A_REVERSE|curses.A_BOLD) if chosen else 0
            star="★" if self.sid(item) in self.favorites else " "
            line=f" {idx+1:02} {star} {item['name']}"
            self.text(y,left+2,line,attr,split-2)
        status="PLAYING" if self.playing else ("PAUSED" if self.current else "IDLE")
        meter="▰"*int(self.energy*8)+"▱"*(8-int(self.energy*8))
        sync="SYNC" if self.playing and time.time()-self.last_audio<2 else ("NO AUDIO DATA" if self.playing else "IDLE")
        modes=['3D CUBE','3D TORUS','3D ORB','SPECTRUM','DNA HELIX','VORTEX','TUNNEL','PYRAMID']
        self.text(h-2,2,f"[SPACE] {status} {sync} {meter}  [ENTER] PLAY  [m] {modes[self.mode]}  [q] QUIT",curses.color_pair(1 if sync=='SYNC' else 3),w-3)
        self.s.refresh()

    def handle_mouse(self):
        try: _,mx,my,_,_=curses.getmouse()
        except curses.error: return
        h,w=self.s.getmaxyx(); left=w-max(30,int(w*.43))-1
        idx=self.scroll+my-10
        if mx>left and 0<=idx<len(self.filtered): self.selected=idx; self.play(self.filtered[idx])

    def run(self):
        curses.curs_set(0); self.s.nodelay(True); self.s.timeout(80); curses.mousemask(curses.ALL_MOUSE_EVENTS)
        while True:
            if self.playing and self.player and self.player.poll() is not None:
                self.playing=False; self.message="STREAM ENDED — TRY ANOTHER SIGNAL"
            self.draw(); key=self.s.getch()
            if key in (ord('q'),27): break
            if self.searching:
                if key in (10,13): self.searching=False; self.fetch(self.query)
                elif key in (27,): self.searching=False
                elif key in (curses.KEY_BACKSPACE,127,8): self.query=self.query[:-1]
                elif 32<=key<=126: self.query+=chr(key)
                continue
            if key in (curses.KEY_UP,ord('k')): self.selected=max(0,self.selected-1)
            elif key in (curses.KEY_DOWN,ord('j')): self.selected=min(len(self.filtered)-1,self.selected+1)
            elif key in (10,13) and self.filtered: self.play(self.filtered[self.selected])
            elif key==ord(' '): self.pause()
            elif key==ord('/'): self.searching=True; self.query=""
            elif key==ord('m'): self.mode=(self.mode+1)%8
            elif key==ord('f'): self.favs_only=not self.favs_only; self.apply_filter(); self.message="SAVED SIGNALS" if self.favs_only else f"{len(self.filtered)} SIGNALS FOUND"
            elif key in (ord('s'),ord('♥')) and self.current:
                sid=self.sid(self.current); self.favorites.symmetric_difference_update({sid}); self.save_favorites(); self.apply_filter()
            elif key==curses.KEY_MOUSE: self.handle_mouse()
        self.stop()


def main(screen):
    curses.start_color(); curses.use_default_colors()
    curses.init_pair(1, 226, -1); curses.init_pair(2, 154, -1); curses.init_pair(3, 244, -1)
    Orbit(screen).run()

if __name__ == "__main__":
    try: curses.wrapper(main)
    except KeyboardInterrupt: pass
