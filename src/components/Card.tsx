import React from 'react';
import clsx from 'clsx';

type CardVariant = 'default' | 'muted';

type ElementType = keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>;

type BaseCardProps = {
    variant?: CardVariant;
    className?: string;
    children?: React.ReactNode;
    as?: ElementType;
    padding?: string;
};

type PolymorphicProps<E extends ElementType> = BaseCardProps &
    Omit<React.ComponentPropsWithoutRef<E>, keyof BaseCardProps>;

type CardProps<E extends ElementType = 'div'> = PolymorphicProps<E>;

const variantStyles: Record<CardVariant, string> = {
    default: 'border-gray-100 bg-white',
    muted: 'border-gray-100 bg-gray-50',
};

export const Card = <E extends ElementType = 'div'>({
    variant = 'default',
    className,
    children,
    as,
    padding,
    ...rest
}: CardProps<E>) => {
    const Component = (as ?? 'div') as ElementType;
    const paddingClass = padding ?? 'p-6';

    return (
        <Component
            className={clsx(
                'rounded-2xl border shadow-sm',
                variantStyles[variant],
                paddingClass,
                className,
            )}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default Card;
