/**
 * /case-studies/[slug] — immersive campaign story page.
 * Server shell: resolves the slug (async params per Next 16), prerenders
 * every study via generateStaticParams, and hands typed data to the
 * client CaseStudyStory component.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import type { CaseStudy } from "@/components/CaseStudyCard";
import data from "@/data/caseStudies.json";

const STUDIES = data.items as CaseStudy[];

export function generateStaticParams() {
  return STUDIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = STUDIES.find((s) => s.slug === slug);
  if (!study) return { title: "Case Study — Kiran Publicity" };
  return {
    title: `${study.brand}: ${study.title} — Kiran Publicity`,
    description: study.summary,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = STUDIES.findIndex((s) => s.slug === slug);
  if (index === -1) notFound();

  const study = STUDIES[index];
  const prev = STUDIES[(index - 1 + STUDIES.length) % STUDIES.length];
  const next = STUDIES[(index + 1) % STUDIES.length];

  return <CaseStudyStory study={study} prev={prev} next={next} />;
}
