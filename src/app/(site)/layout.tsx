import type { ReactNode } from "react";

import { SiteLayout } from "@components/layouts";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteSectionLayout({ children }: SiteLayoutProps) {
  return <SiteLayout>{children}</SiteLayout>;
}
