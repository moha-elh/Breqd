import { useRef } from "react";

function Bread({
  y,
  width,
  onDimensionChange,
}: {
  y: number;
  width: number;
  onDimensionChange: (dims: { width: number; height: number }) => void;
}) {
  const breadRef = useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    if (breadRef.current) {
      const breadWidth = breadRef.current.width;
      const breadHeight = breadRef.current.height;
      onDimensionChange({ width: breadWidth, height: breadHeight });
    }
  };

  return (
    <img
      src="/bread.png"
      className="h-auto absolute z-20"
      style={{
        width: `${width}px`,
        transform: `translate3d(0, ${y}px, 0)`,
        willChange: "transform",
      }}
      ref={breadRef}
      onLoad={handleLoad}
    />
  );
}

export default Bread;
