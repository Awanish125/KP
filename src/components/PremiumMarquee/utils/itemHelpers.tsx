import React from 'react';

interface ItemLinkProps extends React.HTMLAttributes<HTMLElement> {
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
  className?: string;
  tabIndex?: number;
  // allow data-* passthrough
  [key: string]: unknown;
}

// Renders an <a> when href is present, otherwise a plain <div>.
// All other props (including data-marquee-item) pass through to both.
export function ItemLink({
  href,
  target,
  rel,
  children,
  className,
  tabIndex,
  ...rest
}: ItemLinkProps) {
  if (href) {
    const safeRel =
      rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
    return (
      <a
        href={href}
        target={target}
        rel={safeRel}
        className={className}
        tabIndex={tabIndex}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <div className={className} tabIndex={tabIndex} {...rest}>
      {children}
    </div>
  );
}
