function Bread({ y }: { y: number }) {
  return (
    <img
      src="../public/bread.png"
      className="w-28 h-auto absolute z-20"
      style={{ transform: `translateY(${y}px)` }}
    ></img>
  );
}

export default Bread;
