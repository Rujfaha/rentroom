import LoadingLink from "@/components/ui/LoadingLink";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  loadingLabel?: string;
}

const baseClasses =
  "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<string, string> = {
  primary:
    "bg-gold text-white hover:bg-gold-dark shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30",
  secondary:
    "bg-forest text-white hover:bg-forest-light shadow-lg shadow-forest/20 hover:shadow-xl",
  outline:
    "border-2 border-gold text-gold hover:bg-gold hover:text-white",
  ghost:
    "text-forest hover:bg-forest/5",
};

const sizeClasses: Record<string, string> = {
  sm: "px-4 py-2 text-sm rounded-md gap-1.5",
  md: "px-6 py-3 text-base rounded-lg gap-2",
  lg: "px-8 py-4 text-lg rounded-xl gap-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  loadingLabel,
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <LoadingLink href={href} className={classes} loadingLabel={loadingLabel}>
        {children}
      </LoadingLink>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
