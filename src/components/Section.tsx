import React from 'react';

interface BlockProps {
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
}

const Section: React.FC<BlockProps> = ({children, className, ...rest}) => (
    <section className={`py-8 px-5 lg:px-0 md:py-16 lg:py-24 ${className || ''}`} {...rest}>
        {children}
    </section>
);

export default Section;