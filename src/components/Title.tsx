import React, {JSX} from 'react';

type TitleProps = {
    children: React.ReactNode;
    className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

const Title: React.FC<TitleProps> = ({ children, className, level = 1 }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const classes = {
    1: 'text-8xl font-bold my-0 py-0',
    2: 'text-7xl font-bold my-0 py-0',
    3: 'text-6xl font-bold my-0 py-0',
    4: 'text-5xl font-bold my-0 py-0',
    5: 'text-4xl font-bold my-0 py-0',
    6: 'text-3xl font-bold my-0 py-0',
  }
  // @ts-ignore
    return <Tag className={classes[level] + ' ' + className}>{children}</Tag>;
};

export default Title;