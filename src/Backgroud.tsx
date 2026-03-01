import React, { useRef, useState } from "react";
function Background({ onDimensionChange }:{onDimensionChange:Function}) {
  const imgRef = useRef(null);
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
      className="h-screen border-20 border-white rounded-md blur-[1px]"
      src="../public/background.png"
      ref={imgRef}
      onLoad={handleImageLoad}
    />
  );
}

export default Background;
