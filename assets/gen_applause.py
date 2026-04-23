"""
Generate a subtle golf-clap-style applause audio clip.

Produces a ~1.4s mp3. The clap is built from dozens of short,
band-limited noise bursts scattered in time with a gentle amplitude
envelope — nothing sharp, nothing loud, very "polite crowd on the 18th green".

Run:
    python3 gen_applause.py
Output:
    ../assets/golf-clap.mp3
"""
import math
import os
import random
import struct
import subprocess
import sys
import wave

OUT_WAV = "/tmp/golf_clap.wav"
OUT_MP3 = os.path.join(os.path.dirname(__file__), "golf-clap.mp3")
SR = 22050
DUR = 1.4

random.seed(4215)


def lowpass(samples, cutoff_hz, sr=SR):
    """Single-pole IIR lowpass. Cheap but audibly 'softens' noise."""
    out = []
    prev = 0.0
    # RC low-pass coefficient
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / sr
    alpha = dt / (rc + dt)
    for s in samples:
        prev = prev + alpha * (s - prev)
        out.append(prev)
    return out


def highpass(samples, cutoff_hz, sr=SR):
    """Single-pole IIR highpass to kill the low rumble."""
    out = []
    prev_in = 0.0
    prev_out = 0.0
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / sr
    alpha = rc / (rc + dt)
    for s in samples:
        cur = alpha * (prev_out + s - prev_in)
        out.append(cur)
        prev_in = s
        prev_out = cur
    return out


def one_clap(dur_sec=0.04):
    """A single clap = fast-attack, fast-decay filtered noise burst."""
    n = int(dur_sec * SR)
    buf = [random.uniform(-1.0, 1.0) for _ in range(n)]
    # Band-limit to roughly 400 Hz..4 kHz — "hand-against-hand" thwack.
    buf = highpass(buf, 400)
    buf = lowpass(buf, 4200)
    # Amplitude envelope: very fast attack (~1 ms), exponential decay.
    attack = max(1, int(0.001 * SR))
    for i in range(n):
        if i < attack:
            env = i / attack
        else:
            t = (i - attack) / max(1, n - attack)
            env = math.exp(-4.5 * t)
        buf[i] *= env
    return buf


def render():
    total_n = int(DUR * SR)
    track = [0.0] * total_n

    # Scatter ~40 claps over 0.05s..1.15s, concentrated in the middle.
    num_claps = 46
    for _ in range(num_claps):
        # Beta-like distribution centered ~0.45s (most applause is in the middle third)
        t0 = random.triangular(0.05, 1.15, 0.42)
        start = int(t0 * SR)
        amp = random.uniform(0.18, 0.38)
        clap = one_clap(dur_sec=random.uniform(0.025, 0.055))
        for i, s in enumerate(clap):
            if start + i < total_n:
                track[start + i] += s * amp

    # Gentle master envelope: long fade-in & fade-out, so it feels "gathered".
    for i in range(total_n):
        t = i / total_n
        # sin-shaped window so start/end taper to silence
        window = math.sin(math.pi * t) ** 1.3
        track[i] *= window

    # Add a very quiet bed of room noise to feel less synthetic.
    for i in range(total_n):
        bed = random.uniform(-1, 1) * 0.008
        track[i] += bed

    # Normalize conservatively — peak around -6 dB so it feels gentle.
    peak = max(abs(x) for x in track) or 1.0
    target = 0.5  # roughly -6 dBFS
    scale = target / peak
    track = [x * scale for x in track]

    # Write 16-bit mono WAV.
    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for s in track:
            val = int(max(-1, min(1, s)) * 32767)
            frames += struct.pack("<h", val)
        w.writeframes(bytes(frames))

    # Encode to MP3 via ffmpeg (pre-installed per env notes).
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", OUT_WAV,
        "-codec:a", "libmp3lame", "-qscale:a", "5",
        OUT_MP3,
    ]
    subprocess.check_call(cmd)
    print(f"Wrote {OUT_MP3} ({os.path.getsize(OUT_MP3)} bytes)")


if __name__ == "__main__":
    render()
