"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "pill" | "rounded";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:bg-surface-sunken",
  ghost:
    "text-ink hover:bg-surface-sunken",
};

const shapeClass: Record<ButtonShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-lg",
};

function buildClassName({
  variant = "primary",
  size = "md",
  shape = "pill",
  className,
}: BaseProps & { className?: string }) {
  return [
    "inline-flex items-center justify-center gap-2 font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
    "disabled:opacity-50 disabled:pointer-events-none",
    sizeClass[size],
    variantClass[variant],
    shapeClass[shape],
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
  { variant, size, shape, leadingIcon, trailingIcon, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buildClassName({ variant, size, shape, className })}
      {...rest}
    >
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
  };

export function ButtonLink({
  variant,
  size,
  shape,
  leadingIcon,
  trailingIcon,
  children,
  className,
  href,
  external,
  ...rest
}: ButtonLinkProps) {
  const finalClassName = buildClassName({ variant, size, shape, className });
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
    <Link href={href} className={finalClassName} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
