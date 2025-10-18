import React from 'react';
import {Button} from "@/components/Button";
import Header from "@/components/Header";
import Hero from "@/blocks/Hero";
import Presentation from "@/blocks/Presentation";
import Sports from "@/blocks/Sports";

const Home: React.FC = () => {
    return (
        <>
            <Header />
            <Hero />
            <Presentation />
            <Sports />
        </>
    );
};

export default Home;