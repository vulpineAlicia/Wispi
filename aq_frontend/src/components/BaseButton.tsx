import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes } from "react";
import type { LinkProps } from "react-router-dom";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  to?: never;
};

type LinkButtonProps = LinkProps & {
  to: string;
};

type Props = ButtonProps | LinkButtonProps;

const BASE =
  "rounded-3xl bg-brand-900 text-brand-50 font-medium transition hover:bg-brand-700";

function isLinkProps(props: Props): props is LinkButtonProps {
  return typeof (props as LinkButtonProps).to === "string";
}

export default function BaseButton(props: Props) {
  const className = props.className ?? "";

  if (isLinkProps(props)) {
    const { className: _className, ...rest } = props;
    return <Link {...rest} className={`${BASE} ${className}`.trim()} />;
  }

  const { className: _className, ...rest } = props;
  return <button {...rest} className={`${BASE} ${className}`.trim()} />;
}