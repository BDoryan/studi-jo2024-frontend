import React from 'react';

interface BlockProps {
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
}

const Section: React.FC<BlockProps> = ({children, className, ...rest}) => (
    <div className={`container mx-auto ${className ?? ''}`} {...rest}>
        {children}
    </div>
);

export default Section;