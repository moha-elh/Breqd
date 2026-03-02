import { useRef } from "react";


function Bread({ y, onDimensionChange }: { y: number, onDimensionChange: Function }) {
  const breadRef = useRef(null);
  const handleLoad =()=>{
  if(breadRef.current){
    const breadWidth = breadRef.current.width;
    const breadHeight = breadRef.current.height;

    onDimensionChange({width: breadWidth, height: breadHeight})
  }
  };
  return (
    <img
      src="../public/bread.png"
      className="w-28 h-auto absolute z-20"
      ref= {breadRef}
      onLoad={handleLoad}
      style={{ transform: `translateY(${y}px)` }}
    ></img>
  );
}

export default Bread;
