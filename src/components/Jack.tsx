import React, { useEffect, useRef } from 'react';
import { useSynthStore } from '@/store/useSynthStore';
import { getJackDef } from '@/data/moduleDefs';

interface JackProps {
  jackId: string;
  moduleEl: HTMLElement | null;
  panelEl: HTMLElement | null;
}

export const Jack: React.FC<JackProps> = ({ jackId, moduleEl, panelEl }) => {
  const socketRef = useRef<HTMLDivElement>(null);
  const def = getJackDef(jackId);
  const {
    cables,
    dragFrom,
    hoverJack,
    startDrag,
    endDrag,
    setHoverJack,
    setJackPosition,
  } = useSynthStore();

  const isOutput = def?.type === 'audio_out' || def?.type === 'cv_out';
  const isInput = def?.type === 'audio_in' || def?.type === 'cv_in';
  const isConnected = cables.some(c => c.from === jackId || c.to === jackId);
  const isHover = hoverJack === jackId;
  const canDrop = dragFrom && (
    (dragFrom !== jackId) && (
      (isOutput && !isInput) ||
      (isInput && !isOutput)
    )
  );

  useEffect(() => {
    if (!socketRef.current || !panelEl) return;
    const update = () => {
      const socketRect = socketRef.current?.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();
      if (!socketRect || !panelRect) return;
      setJackPosition(
        jackId,
        socketRect.left - panelRect.left + socketRect.width / 2,
        socketRect.top - panelRect.top + socketRect.height / 2
      );
    };
    update();
    const ro = new ResizeObserver(update);
    if (moduleEl) ro.observe(moduleEl);
    ro.observe(panelEl);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [jackId, moduleEl, panelEl, setJackPosition]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutput) startDrag(jackId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragFrom && isInput) endDrag(jackId);
    else if (dragFrom) endDrag(null);
  };

  const handleEnter = () => {
    if (canDrop) setHoverJack(jackId);
  };
  const handleLeave = () => {
    if (hoverJack === jackId) setHoverJack(null);
  };

  if (!def) return null;

  return (
    <div
      className="flex flex-col items-center gap-1 absolute"
      style={{
        left: def.x - 11,
        top: def.y - 30,
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span
        className={`label-tag ${isOutput ? 'out' : 'in'}`}
      >
        {def.name}
      </span>
      <div
        ref={socketRef}
        className={[
          'jack-socket',
          def.type,
          isConnected ? 'connected' : '',
          isHover ? 'hover-target' : '',
        ].join(' ')}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};
