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
    "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  secondary:
    "border border-stone-300 bg-transparent text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800",
  ghost:
    "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800",
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
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
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
