function FirePipe({angle, x, y}:{angle: number, x: number, y: number}){
  return(
    <img src="/Fire pipe.png" 
    className="h-100 w-auto absolute"
    style={{ 
      left: `${x}px`,
      top: `${y}px`,
      transform: `rotate(${angle}deg)` }}
    >
    </img>
  )
}


export default FirePipe;
