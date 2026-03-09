import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes } from "react";
import type { LinkProps } from "react-router-dom";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

type LinkButtonProps = LinkProps & {
  className?: string;
  to: string;
};

const BASE =
  "rounded-3xl bg-brand-900 text-brand-50 font-medium transition hover:bg-brand-700";

export default function BaseButton(props: ButtonProps | LinkButtonProps) {
  const { className = "", ...rest } = props as any;

  if ("to" in props) {
    return <Link {...(rest as LinkButtonProps)} className={`${BASE} ${className}`} />;
  }

  return <button {...(rest as ButtonProps)} className={`${BASE} ${className}`} />;
}