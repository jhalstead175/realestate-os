// app/page.tsx
import GlyphFragments from '@/components/ceremony/GlyphFragments';

export default function Home() {
  return (
    <div className="relative">
      <GlyphFragments />

      {/* Hidden audio for resonance */}
      <audio autoPlay loop className="hidden">
        <source src="/audio/resonance.mp3" type="audio/mpeg" />
      </audio>

      {/* Instructions (fades out) */}
      <div className="absolute top-8 left-8 text-gray-600 text-sm animate-pulse">
        ⬤ Stand witness to the reunion
      </div>
    </div>
  );
}
