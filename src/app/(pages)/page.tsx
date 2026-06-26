import { HeroSection } from "@/components/ui";

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
    <HeroSection images={images} />
  );
}
