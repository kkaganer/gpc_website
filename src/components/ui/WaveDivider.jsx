export default function WaveDivider({ color = 'white', flip = false }) {
  return (
    <div
      className="w-full leading-none overflow-hidden"
      style={{ transform: flip ? 'scaleY(-1)' : undefined }}
    >
      <svg
        viewBox="0 0 1440 70"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block w-full h-[50px] md:h-[70px]"
      >
        <path
          d="M0,40 C180,70 360,0 540,35 C720,70 900,10 1080,40 C1260,70 1380,20 1440,30 L1440,70 L0,70 Z"
          fill={color}
        />
      </svg>
    </div>
  )
}
