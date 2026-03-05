import { useRef, useEffect } from "react";

function Background({
  onDimensionChange,
}: {
  onDimensionChange: (dims: { width: number; height: number }) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  const reportDimensions = () => {
    if (imgRef.current) {
      const renderedWidth = imgRef.current.clientWidth;
      const renderedHeight = imgRef.current.clientHeight;
      onDimensionChange({ width: renderedWidth, height: renderedHeight });
    }
  };

  // Re-report dimensions on window resize (rotation, browser resize)
  useEffect(() => {
    const handleResize = () => reportDimensions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <img
      className="h-screen max-h-dvh w-auto border-white rounded-md"
      src="/background.webp"
      ref={imgRef}
      onLoad={reportDimensions}
    />
  );
}

export default Background;
