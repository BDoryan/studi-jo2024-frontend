import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    disabled?: boolean;
};

type AnchorButtonProps = BaseProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
    };

type NativeButtonProps = BaseProps &
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: undefined;
    };

type ButtonProps = AnchorButtonProps | NativeButtonProps;

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  variant = "primary",
                                                  size = "md",
                                                  className = "",
                                                  disabled = false,
                                                  href,
                                                  ...props
                                              }) => {
    const base = "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<ButtonVariant, string> = {
        primary: "font-bolder bg-primary-400 text-primary-50 hover:bg-primary-500 hover:text-white focus-visible:ring-primary",
        secondary: "font-bolder bg-primary-50 text-black hover:bg-gray-200 border border-gray-300 focus-visible:ring-primary",
        outline: "border border-primary-400 text-primary-500 hover:bg-primary-400 hover:text-primary-50 focus-visible:ring-primary",
        danger: "border border-red-500 text-red-600 hover:bg-red-500 hover:text-white focus-visible:ring-red-400 focus-visible:ring-offset-red-50",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200",
    };

    const sizes: Record<ButtonSize, string> = {
        sm: "py-1 px-2 text-base",
        md: "py-2 px-4 text-lg",
        lg: "py-3 px-6 text-xl",
    };

    const classes = `${base} ${variants[variant]} ${sizes[size]} ${className} ${
        disabled ? "cursor-not-allowed opacity-[.25] pointer-events-none" : ""
    }`;

    if (href) {
        const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
        const { tabIndex, onClick, ...restAnchorProps } = anchorProps;

        const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
            if (disabled) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (onClick) {
                onClick(event);
            }
        };

        return (
            <a
                className={classes}
                href={disabled ? undefined : href}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : tabIndex}
                role="button"
                onClick={handleClick}
                {...restAnchorProps}
            >
                {children}
            </a>
        );
    }

    const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;

    return (
        <button className={classes} disabled={disabled} {...buttonProps}>
            {children}
        </button>
    );
};
