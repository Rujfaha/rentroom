"use client";

import Link from "next/link";
import { useState } from "react";

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  loadingLabel?: string;
  onClick?: () => void;
}

export default function LoadingLink({ href, children, className = "", loadingLabel = "กำลังโหลด...", onClick }: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Link
      href={href}
      aria-busy={isLoading}
      onClick={function () {
        onClick?.();
        setIsLoading(true);
      }}
      className={className}
    >
      {isLoading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
      )}
      <span>{isLoading ? loadingLabel : children}</span>
    </Link>
  );
}
