function FirePipe({
  angle,
  x,
  y,
  height,
}: {
  angle: number;
  x: number;
  y: number;
  height: number;
}) {
  return (
    <img
      src="/Fire pipe.png"
      className="w-auto absolute"
      style={{
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}

export default FirePipe;
