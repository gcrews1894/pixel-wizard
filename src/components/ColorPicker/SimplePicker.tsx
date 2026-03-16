import { useCanvasStore } from '../../store/canvasStore';
import { SIMPLE_PALETTE } from '../../lib/colors';

export function SimplePicker() {
  const { currentColor, setCurrentColor, addRecentColor } = useCanvasStore();

  function handleSelect(color: string) {
    setCurrentColor(color);
    addRecentColor(color);
  }

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
    >
      {SIMPLE_PALETTE.map(color => (
        <button
          key={color}
          title={color}
          onClick={() => handleSelect(color)}
          style={{ background: color }}
          className={`aspect-square rounded transition-transform hover:scale-125 hover:z-10 relative ${
            currentColor === color
              ? 'outline outline-2 outline-white outline-offset-1 scale-110'
              : ''
          }`}
        />
      ))}
    </div>
  );
}
