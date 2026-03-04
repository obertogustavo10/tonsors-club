import React from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-amber-400 hover:bg-amber-500 text-black font-semibold",
  secondary:
    "bg-white/10 hover:bg-white/15 text-white font-semibold",
  outline:
    "border border-white/20 text-white hover:bg-white/10 font-semibold",
  ghost:
    "text-white hover:bg-white/10 font-semibold",
};

export default function AppButton({
  children,
  variant = "primary",
  fullWidth = true,
  heightClass = "h-12",
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        fullWidth ? "w-full" : "w-auto",
        "inline-flex", // ✅ crucial para layout consistente
        "items-center justify-center gap-2",
        heightClass,
        "rounded-xl",
        "px-4",
        "transition-colors",
        "whitespace-normal text-center",
        VARIANTS[variant] ?? VARIANTS.primary,
        (disabled || loading) ? "opacity-70 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-5 h-5 shrink-0" />
      ) : null}

      <span className="leading-tight">{children}</span>

      {!loading && RightIcon ? (
        <RightIcon className="w-5 h-5 shrink-0" />
      ) : null}
    </button>
  );
}