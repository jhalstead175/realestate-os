// app/page.tsx
import MonolithBirth from '@/components/ceremony/MonolithBirth';

export default function Home() {
  return (
    <>
      <MonolithBirth />

      {/* Resonance audio cue */}
      <div className="hidden">
        {/* Audio will be triggered by stage changes */}
        <audio id="align-sound" src="/audio/stone-align.mp3" />
        <audio id="crackle-sound" src="/audio/gold-crackle.mp3" />
        <audio id="birth-sound" src="/audio/monolith-birth.mp3" />
        <audio id="pulse-sound" src="/audio/heartbeat.mp3" />
        <audio id="ash-sound" src="/audio/ash-whisper.mp3" />
      </div>

      {/* Hidden instructions */}
      <div className="fixed top-8 left-8 text-gray-600 text-sm animate-pulse z-50">
        ⬤ WITNESS THE BIRTH
      </div>
    </>
  );
}
