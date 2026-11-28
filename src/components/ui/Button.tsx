"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

/** One primary per screen area; danger only for removing something. */
export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
/** md is 44 px (main places), sm is 36 px (inside bars). */
export type ButtonSize = "md" | "sm";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const sizeClass: Record<ButtonSize, string> = {
  md: "h-11 px-[1.125rem] text-[0.9375rem]",
  sm: "h-9 px-3.5 text-sm",
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-line-strong bg-transparent text-ink hover:bg-surface-sunken",
  // A link that looks like a link: less side padding than the filled variants.
  quiet: "px-2 text-accent-text hover:underline underline-offset-2",
  danger: "bg-danger text-on-accent hover:opacity-90",
};

function buildClassName({
  variant = "primary",
  size = "md",
  className,
}: BaseProps & { className?: string }) {
  return [
    // The control radius, not a pill: pills are for choices and chips.
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold leading-none whitespace-nowrap",
    "transition-colors duration-press ease-standard",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
    "disabled:opacity-45 disabled:pointer-events-none aria-disabled:opacity-45 aria-disabled:cursor-not-allowed",
    sizeClass[size],
    variantClass[variant],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, leadingIcon, trailingIcon, children, className, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={buildClassName({ variant, size, className })} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});

type ButtonLinkProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    children?: ReactNode;
    external?: boolean;
    /** Passed to next/link; false where a prefetch would download a whole surah again. */
    prefetch?: boolean;
  };

export function ButtonLink({
  variant,
  size,
  leadingIcon,
  trailingIcon,
  children,
  className,
  href,
  external,
  prefetch,
  ...rest
}: ButtonLinkProps) {
  const finalClassName = buildClassName({ variant, size, className });
  if (external) {
    return (
      <a href={href} className={finalClassName} {...rest}>
        {leadingIcon}
        {children}
        {trailingIcon}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={finalClassName} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
