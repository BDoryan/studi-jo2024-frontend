import React, { JSX } from 'react';

type TitleProps = {
    children: React.ReactNode;
    className?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
};

const Title: React.FC<TitleProps> = ({ children, className, level = 1 }) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

const classes: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
    1: 'text-3xl md:text-5xl lg:text-7xl leading-tight font-bold my-0 py-0',
    2: 'text-2xl md:text-4xl lg:text-6xl leading-tight font-bold my-0 py-0',
    3: 'text-xl md:text-3xl lg:text-5xl leading-snug font-bold my-0 py-0',
    4: 'text-lg md:text-2xl lg:text-4xl leading-snug font-bold my-0 py-0',
    5: 'text-base md:text-xl lg:text-3xl leading-normal font-bold my-0 py-0',
    6: 'text-sm md:text-base lg:text-2xl leading-relaxed font-bold my-0 py-0',
};

    const finalClass = [classes[level], className].filter(Boolean).join(' ');

    return <Tag className={finalClass}>{children}</Tag>;
};

export default Title;