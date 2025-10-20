import React from 'react';
import {Button} from "@/components/Button";
import Section from "@/components/Section";
import Title from "@/components/Title";

const Hero: React.FC = () => {
    return (
        <Section
            className={"relative"}
            style={{
                backgroundImage: "url('/imgs/hero-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            <div className={"bg-black/45 absolute inset-0"}></div>
            <div className="relative container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center text-white sm:px-6 lg:px-8 lg:py-32">
                <Title className="mb-2 uppercase">
                    BILLETTERIE DES<br/>
                    JEUX OLYMPIQUES de paris
                </Title>
                <p className="mx-auto mb-6 max-w-3xl text-lg font-semibold leading-relaxed sm:text-xl md:text-2xl lg:text-3xl">
                    Vivez les Jeux Olympiques 2024 en France avec
                    des e-tickets sécurisés&nbsp;!
                </p>
                <div className="flex w-full flex-col justify-center gap-4 sm:flex-row sm:gap-6 md:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto" href="/offers">
                        Acheter des billets
                    </Button>
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto" href="#en-savoir-plus">
                        En savoir plus
                    </Button>
                </div>
            </div>
        </Section>
    );
};

export default Hero;
