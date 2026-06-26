import type { ReactNode } from "react";

import { HomeLayout } from "@components/layouts";

type PagesLayoutProps = {
  children: ReactNode;
};

export default function HomeSectionLayout({ children }: PagesLayoutProps) {
  return <HomeLayout>{children}</HomeLayout>;
}
