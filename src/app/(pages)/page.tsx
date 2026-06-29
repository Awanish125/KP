"use client";

import Billboard, {
  BillboardImperativeHandle,
} from "@/components/ThreeDObject/Billboard";
import { HeroSection, Loading } from "@/components/ui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
gsap.registerPlugin(ScrollTrigger);

const IMAGES = [
  "/homepage/herosection/1.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/2.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/3.png",
  "/homepage/herosection/kp.png",
];

function HomeContent() {
  const billboard = useRef<BillboardImperativeHandle | null>(null);
  useGSAP(() => {
    const board = billboard.current?.group;

    if (!board) return;

    gsap.set(board.scale, {
      x: 0,
      y: 0,
      z: 0,
    });

    gsap.set(board.position, {
      x: 0,
      y: -2,
      z: 0,
    });
  });
  return (
    <>
      <Loading />
      <Billboard
        className="fixed top-0 left-0"
        onReady={(instance) => {
          billboard.current = instance;
        }}
      />
      <div style={{ height: "100vh", position: "relative", zIndex: 5 }}>
        <HeroSection images={IMAGES} />
      </div>
      <div className="bg-red h-screen flex">
        <div className="w-1/2 h-full">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis
          repellendus dolore quo vero aut est voluptates voluptas accusamus et
          facilis commodi, nemo ad maiores omnis, a ipsum eum laborum tenetur.
        </div>
        <div className="w-1/2 h-full bg-amber-200"></div>
      </div>
      <div className="bg-red  flex">
        <div className="w-1/2 h-screen bg-amber-200"></div>
        <div className="w-1/2 h-screen">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis
          repellendus dolore quo vero aut est voluptates voluptas accusamus et
          facilis commodi, nemo ad maiores omnis, a ipsum eum laborum tenetur.
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
