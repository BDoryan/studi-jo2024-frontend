import React from 'react';
import {Button} from "@/components/Button";
import Section from "@/components/Section";
import Title from "@/components/Title";

const Hero: React.FC = () => {
    return (
        <Section className={"relative"} style={{backgroundImage: `url('/imgs/hero-bg.jpg'`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
            <div className={"bg-black/45 absolute inset-0"}></div>
            <div className="relative container flex flex-col gap-6 mx-auto px-6 py-32 text-center text-white">
                <Title className="mb-4 uppercase leading-22">
                    BILLETTERIE DES<br/>
                    JEUX OLYMPIQUES de paris
                </Title>
                <p className="text-6xl mb-8 font-bold">
                    Vivez les Jeux Olympiques 2024 en France avec<br/>
                    des e-tickets sécurisés !
                    </p>
                <div className="flex gap-4 justify-center">
                    <Button variant="primary" size="lg">
                        Acheter des billets
                    </Button>
                    <Button variant="secondary" size="lg">
                        En savoir plus
                    </Button>
                </div>
            </div>
        </Section>
    );
};

export default Hero;