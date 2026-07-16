import { useEffect, useRef } from 'react';

export default function CanvasBoard({ onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6c5ce7';
    let drawing = false;

    const pos = (e) => ({ x: e.offsetX, y: e.offsetY });
    const down = (e) => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const up = () => { drawing = false; onChange?.(canvas.toDataURL()); };

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', up);
    canvas.addEventListener('mouseleave', up);
    return () => {
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', up);
      canvas.removeEventListener('mouseleave', up);
    };
  }, [onChange]);

  const clear = () => {
    const canvas = ref.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange?.('');
  };

  return (
    <div className="canvas-wrap">
      <canvas ref={ref} width="480" height="160" className="drawing-canvas" />
      <button type="button" className="ghost small" onClick={clear}>Clear drawing</button>
    </div>
  );
}
