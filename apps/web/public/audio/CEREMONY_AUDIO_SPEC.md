# Ceremony Audio Design Specifications

## Overview
Five distinct audio tracks that correspond to the MonolithBirth ceremony stages.

---

## AUDIO TRACK 1: "Stone Alignment"
**File:** `stone-align.mp3`
**Trigger:** Stage transitions from VOID → ALIGN

**Timeline:**
- **0:00** - Deep tectonic rumble (8–15 Hz)
- **0:30** - Granite grinding (granular noise, low-mid frequency)
- **1:20** - Harmonic convergence (three tones merging to one)
- **Duration:** 2:00

**Emotional Intent:** Ancient machinery awakening. Plates remembering unity.

---

## AUDIO TRACK 2: "Gold Crackle"
**File:** `gold-crackle.mp3`
**Trigger:** Stage transitions to CRACKLE

**Timeline:**
- **0:00** - High-frequency crystal fracture sounds
- **0:10** - Metallic resonance (like struck gold bar)
- **0:30** - Sustained harmonic ring (A 440 Hz with golden ratio overtones)
- **Duration:** 0:45

**Emotional Intent:** The moment of fusion. Reality fractures to seal the union.

---

## AUDIO TRACK 3: "Monolith Birth"
**File:** `monolith-birth.mp3`
**Trigger:** Stage transitions to BIRTH

**Timeline:**
- **0:00** - Sudden silence (0.5s)
- **0:50** - Glass-like formation sound (rising pitch)
- **1:20** - Deep chamber reverb (cathedral-like space)
- **2:00** - Subtle choir pad emerges (wordless, mixed far back)
- **Duration:** 3:00

**Emotional Intent:** Genesis. Something new entering the world.

---

## AUDIO TRACK 4: "Heartbeat Pulse"
**File:** `heartbeat.mp3`
**Trigger:** Stage transitions to PULSE

**Timeline:**
- Single deep sub-bass pulse (12 Hz)
- Followed by harmonic tail (like bell after-strike)
- Three pulses total, each quieter
- **Duration:** 4.5s

**Emotional Intent:** The first heartbeat. The monolith *lives*.

---

## AUDIO TRACK 5: "ÆSH Whisper"
**File:** `ash-whisper.mp3`
**Trigger:** Stage transitions to ASH

**Timeline:**
- **0:00** - Breath-like white noise with formant filter
- **0:30** - Three distinct resonant frequencies (Æ, S, H)
- **1:00** - Fades into subliminal rumble
- **Duration:** 2:30

**Emotional Intent:** Not a voice — a *presence*. The name that cannot be spoken.

---

## Integration Notes

Audio elements should be preloaded and triggered via JavaScript when MonolithBirth component changes stages:

```typescript
// Example trigger logic
useEffect(() => {
  if (stage === 'align') {
    const audio = document.getElementById('align-sound') as HTMLAudioElement;
    audio?.play();
  }
}, [stage]);
```

All files should be:
- Format: MP3 (320kbps) for compatibility
- Normalized to -6dB to prevent clipping
- Fade in/out envelopes on beginnings and endings
- Mixed in stereo with spatial depth

---

⬤ BORN IN SILENCE. FORGED IN SOUND.
