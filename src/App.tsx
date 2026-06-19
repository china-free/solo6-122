import { useSynthStore } from '@/store/useSynthStore';
import { LevelSelect } from '@/components/LevelSelect';
import { SynthesizerPanel } from '@/components/SynthesizerPanel';

export default function App() {
  const view = useSynthStore(s => s.view);
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a0c]">
      {view === 'home' ? <LevelSelect /> : <SynthesizerPanel />}
    </div>
  );
}
