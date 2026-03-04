import { useRef } from "react";
function Background({ onDimensionChange }:{onDimensionChange:Function}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const handleImageLoad = () => { 
    if (imgRef.current) {
      // Get the *rendered* size (affected by CSS)
      const renderedWidth = imgRef.current.clientWidth;
      const renderedHeight = imgRef.current.clientHeight;
      onDimensionChange({ width: renderedWidth, height: renderedHeight });
    }
  };
  return (
    <img
      className="h-screen border-white rounded-md blur-[1px]"
      src="/background.png"
      ref={imgRef}
      onLoad={handleImageLoad}
    />
  );
}

export default Background;
