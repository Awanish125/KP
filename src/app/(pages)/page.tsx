import Billboard from "@/components/ThreeDObject/Billboard";
import { HeroSection, Scene } from "@/components/ui";

const images = [
  "/homepage/herosection/1.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/2.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/3.png",
  "/homepage/herosection/kp.png",
];

export default function Home() {
  return (
    <>
    <HeroSection images={images}  />
    <Billboard/>
    <div className="h-[300vh]">Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus facilis, adipisci earum minus velit veritatis non pariatur beatae ullam numquam laudantium repudiandae distinctio? Et culpa esse quaerat minima consequuntur quod!</div>
    </>
  );
}
