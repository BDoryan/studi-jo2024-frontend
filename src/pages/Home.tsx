import React from 'react';
import Header from "@/components/Header";
import Hero from "@/blocks/Hero";
import Presentation from "@/blocks/Presentation";
import Sports from "@/blocks/Sports";
import Layout from "@/components/Layout";

const Home: React.FC = () => {
    return (
        <Layout>
            <Hero/>
            <Presentation/>
            <Sports/>
        </Layout>
    );
};

export default Home;
