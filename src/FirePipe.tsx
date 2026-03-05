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
      src="/Fire pipe.webp"
      className="w-auto absolute left-0 top-0"
      style={{
        height: `${height}px`,
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`,
        willChange: "transform",
      }}
    />
  );
}

export default FirePipe;
