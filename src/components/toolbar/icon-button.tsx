import * as React from "react";

export function IconButton({
  label,
  action,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  action: string;
}) {
  return (
    <button type="button" aria-label={label} title={label} data-duo-action={action} {...props}>
      {children}
    </button>
  );
}
