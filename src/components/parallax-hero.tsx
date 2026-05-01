import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STARS = [
  { top: '6%', left: '12%', size: 2, opacity: 0.5 },
  { top: '10%', left: '25%', size: 1.5, opacity: 0.4 },
  { top: '4%', left: '45%', size: 2.5, opacity: 0.6 },
  { top: '14%', left: '65%', size: 1, opacity: 0.3 },
  { top: '8%', left: '78%', size: 2, opacity: 0.5 },
  { top: '12%', left: '88%', size: 1.5, opacity: 0.4 },
  { top: '18%', left: '8%', size: 1, opacity: 0.35 },
  { top: '22%', left: '35%', size: 2, opacity: 0.55 },
  { top: '16%', left: '55%', size: 1.5, opacity: 0.45 },
  { top: '20%', left: '72%', size: 2.5, opacity: 0.6 },
  { top: '24%', left: '92%', size: 1, opacity: 0.3 },
  { top: '9%', left: '52%', size: 1.5, opacity: 0.4 },
]

export function ParallaxWrapper({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const midRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const moonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const back = backRef.current
    const mid = midRef.current
    const front = frontRef.current
    const moon = moonRef.current
    if (!wrapper || !back || !mid || !front || !moon) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      })

      tl.to(back, { y: 200, ease: 'none' }, 0)
      tl.to(mid, { y: 380, ease: 'none' }, 0)
      tl.to(front, { y: 580, ease: 'none' }, 0)
      tl.to(moon, { y: -150, opacity: 0.1, ease: 'none' }, 0)
    }, wrapper)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      {/* Sticky background layers */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{ zIndex: 0 }}>
        {/* Sky gradient matching SVG colors */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, #0a0e27 0%, #1a1033 20%, #2d1b4e 45%, #4a2252 65%, #6b2e4a 80%, #282a57 100%)',
          }}
        />

        {/* Stars */}
        <div className="pointer-events-none absolute inset-0">
          {STARS.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: star.top,
                left: star.left,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>

        {/* Moon */}
        <div
          ref={moonRef}
          className="pointer-events-none absolute rounded-full will-change-transform"
          style={{
            top: '8%',
            right: '18%',
            width: '70px',
            height: '70px',
            background: '#FDE68A',
            opacity: 0.6,
            boxShadow: '0 0 60px rgba(253,230,138,0.3)',
          }}
        />

        {/* Back mountain layer — mountain-1 */}
        <div
          ref={backRef}
          className="absolute bottom-0 will-change-transform"
          style={{ width: '140%', left: '-20%' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 4228.796 1129.942" className="block h-auto w-full">
  <defs>
    <linearGradient id="linear-gradient" x1="0.496" y1="-0.121" x2="0.502" y2="0.874" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#de5654"/>
      <stop offset="0.13" stop-color="#ce5254"/>
      <stop offset="0.37" stop-color="#a74854"/>
      <stop offset="0.7" stop-color="#673955"/>
      <stop offset="1" stop-color="#282a57"/>
    </linearGradient>
  </defs>
  <g id="mountain-1" transform="translate(-3898.812 -6192.585)">
    <path id="mountain-1-2" data-name="mountain-1" d="M4224.625,277.857c-54.947-14.279-117.1-30.448-134.882-34.858-33.808-8.469-84.555-8.469-84.555-8.469l-101.494,76.085-109.964,8.469-93.024,67.686-93.025,84.555s-135.3,8.469-160.71,25.338c-25.338,16.939-109.963,59.216-109.963,59.216l-118.433,8.469s-160.71-16.939-194.518-16.939-118.433-16.939-143.771-16.939-223.917-55.017-223.917-55.017-139.991,51.657-165.4,60.126c-25.338,8.469-86.445,71.4-86.445,71.4l-73.916,75.665s-126.833,16.939-152.241,16.939-84.555-50.747-84.555-50.747S1966.981,631.9,1941.573,623.5c-25.339-8.469-109.963-8.469-135.3-16.939s-109.963-25.339-177.579-59.216c-67.686-33.808-118.433-76.085-143.771-84.555s-126.832-42.277-177.579-33.808-143.771,25.338-202.988,25.338-160.71,0-253.735-25.338-287.543-135.3-321.351-160.71C495.46,242.93,326.28,285.207,233.256,319.015,183.559,337.074,80.8,355.133-4.17,368.082v996.39H4224.555V277.788Z" transform="translate(3902.982 5958.055)" fill="url(#linear-gradient)"/>
    <g id="Group_15" data-name="Group 15" transform="translate(4713.731 6385.86)">
      <path id="Path_137" data-name="Path 137" d="M1137.748,1016.61l1142.681-15.049,266.894-266.894,127.812-172.89L2612.7,391.827l-97.014,6.93s-160.71-16.939-194.518-16.939c-20.579,0-59.917-6.23-93.234-11.129-11.409,25.2-26.808,52.077-45.147,67.056-41.368,33.808-165.4,52.637-199.208,56.417s-78.955,56.417-105.274,78.955S1769.32,663.341,1724.173,674.61c-45.077,11.269-127.812,22.539-161.62,15.049s-82.665,0-135.3-33.808-78.955-52.637-131.592-67.686-165.4,18.829-191.718,0c-26.318-18.759-165.4-101.494-233.016-154.131-67.686-52.637-56.417-82.665-154.131-135.3A455.324,455.324,0,0,0,626.569,262.2a123.146,123.146,0,0,0-22.189,1.26c-49.557,8.259-139.292,24.569-198.648,25.268-37.658,23.308-72.8,45.5-79.865,43.747-15.049-3.78-116.543,67.686-116.543,67.686S133.8,467,113.01,472.883c35,20.859,235.4,190.388,235.4,190.388l789.343,353.339Z" transform="translate(-107.719 -262.143)" fill="#282a57" opacity="0.55"/>
      <path id="Path_138" data-name="Path 138" d="M117.475,292.437c-3.64-2.17-5.53-2.73-5.18-1.33C112.715,292.927,114.605,293.207,117.475,292.437Z" transform="translate(-112.254 -92.966)" fill="#282a57"/>
    </g>
  </g>
</svg>
        </div>

        {/* Mid mountain layer — mountain-2 */}
        <div
          ref={midRef}
          className="absolute bottom-0 will-change-transform"
          style={{ width: '130%', left: '-15%' }}
        >
       <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 4228.796 1066.036" className="block h-auto w-full">
  <defs>
    <linearGradient id="linear-gradient" x1="0.476" y1="-0.734" x2="0.504" y2="0.845" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#de5654"/>
      <stop offset="0.13" stop-color="#ce5254"/>
      <stop offset="0.37" stop-color="#a74854"/>
      <stop offset="0.7" stop-color="#673955"/>
      <stop offset="1" stop-color="#282a57"/>
    </linearGradient>
    <linearGradient id="linear-gradient-2" x1="0.595" y1="-0.18" x2="0.485" y2="0.693" xlinkHref="#linear-gradient"/>
    <linearGradient id="linear-gradient-3" x1="0.684" y1="-0.16" x2="0.549" y2="0.69" xlinkHref="#linear-gradient"/>
  </defs>
  <g id="mountain-2" transform="translate(-3898.812 -6245.361)">
    <path id="Path_139" data-name="Path 139" d="M4224.625,474.246C4133.911,436.8,3961.3,363.023,3857.847,343.634c-135.3-25.339-126.833-33.808-194.518-50.747s-262.134-50.747-312.881-8.47-245.265,194.518-287.543,219.857-211.457,84.555-253.735,126.832-422.844,236.8-532.808,219.857-549.677-160.71-710.387-228.326c-160.71-67.686-338.29-177.579-422.845-228.326S830.25,242.07,779.5,242.07s-287.543,76.085-338.29,84.555-194.518,59.216-304.482,59.216c-40.948,0-92.394,3.5-140.9,7.91V1307.9H4224.555V474.106Z" transform="translate(3902.982 6003.291)" fill="url(#linear-gradient)"/>
    <path id="Path_140" data-name="Path 140" d="M136.742,385.861c-40.948,0-92.394,3.5-140.9,7.91v914.145H1679.448C1236.655,1087.779,659.19,790.577,624.682,721.561,568.266,608.8,951.7,417.079,940.433,366.333S779.443,242.09,779.443,242.09c-50.747,0-287.543,76.085-338.29,84.555s-194.518,59.216-304.482,59.216Z" transform="translate(3903.042 6003.412)" fill="url(#linear-gradient-2)"/>
    <path id="Path_141" data-name="Path 141" d="M1166.424,274.088c-59.146-14.769-215.167-42.488-287.4-21l.28,9.939s-50.747,112.763-39.478,169.18,191.718,169.18,191.718,287.543c0,74.616-353.689,364.118-619.533,569.486H1727.721V455.447C1637.006,418,1464.4,344.224,1360.943,324.835,1225.641,299.5,1234.11,291.027,1166.424,274.088Z" transform="translate(6399.886 6022.16)" fill="url(#linear-gradient-3)"/>
  </g>
</svg>
        </div>

        {/* Front mountain layer — mountain-3 */}
        <div
          ref={frontRef}
          className="absolute bottom-0 will-change-transform"
          style={{ width: '120%', left: '-10%' }}
        >
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4228.726 1091.234" className="block h-auto w-full">
  <path id="mountain-3" d="M4224.5,238.46C4202.247,263.8,3976.16,407.57,3942.352,416.04s-143.771,76.085-270.6,160.71c-126.833,84.555-270.6,296.012-380.567,346.759s-287.543,126.832-372.1,126.832-608.893,8.469-676.579,0-735.726-135.3-854.158-169.11S948.563,661.375,872.477,635.966C811.791,615.737,229.146,417.929-4.15,338.694v991H4224.576V238.46Z" transform="translate(4.15 -238.46)" fill="#282a57"/>
</svg>
        </div>
      </div>

      {/* Content overlays the sticky background */}
      <div className="relative" style={{ zIndex: 10, marginTop: '-100vh' }}>
        {children}
      </div>
    </div>
  )
}
