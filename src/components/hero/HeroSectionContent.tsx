import React from "react";

const HeroSectionContent = () => {
  return (
    <div className="w-full h-full flex">
      <div className="w-1/2 h-full">
        <h2 className="text-xs md:text-sm uppercase tracking-[0.5em] text-primary font-semibold mb-4 animate-[slideUpFade_1s_ease-out_0.5s_forwards]">
          Premium Outdoor Advertising
        </h2>
        <h1 className="font-heading font-bold tracking-[-0.06em] leading-[0.85] text-6xl md:text-[7rem] lg:text-[8.5rem] xl:text-[9rem] animate-[slideUpFade_1s_ease-out_0.7s_forwards]">
          <span className="block text-white">MAKING BRANDS</span>

          <span
            className="
      block
      text-transparent
      bg-clip-text
      bg-gradient-to-r
      from-[#6F5BFF]
      via-[#B86CCB]
      via-[#F16B57]
      to-[#FF6B1A]
      bg-[length:200%_100%]
      animate-[gradientFlow_6s_linear_infinite]
    "
          >
            IMPOSSIBLE
          </span>

          <span className="block text-white">TO IGNORE</span>
        </h1>
      </div>
      <div className="w-1/2 h-full"></div>
    </div>
  );
};

export default HeroSectionContent;
