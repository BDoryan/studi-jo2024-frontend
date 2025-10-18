import React from 'react';
import {Button} from "@/components/Button";
import Section from "@/components/Section";
import Container from "@/components/Container";
import Title from "@/components/Title";

const Presentation: React.FC = () => {
    return (
        <Section className={"relative"}>
            <Container className={'flex flex-col gap-16'}>
                <Title className={"text-center"} level={2}>
                    Jeux Olympiques de Paris 2024
                </Title>
                <div className="flex gap-10">
                    <div className="flex-1">
                        <img src="/imgs/display.jpeg" alt="Affiche des Jeux Olympiques 2024" className={"w-full"}/>
                    </div>
                    <div className="flex-1 items-center justify-center leading-5 flex text-xl flex-col gap-4">
                        <p>
                            Les Jeux Olympiques de Paris 2024 marquent un événement historique : cent ans après leur
                            dernière édition dans la capitale française, les Jeux reviennent pour célébrer l’excellence,
                            la passion et le partage à travers le sport.
                        </p>
                        <p>
                            Du 26 juillet au 11 août 2024, la France accueille des athlètes venus du monde entier pour
                            concourir dans plus de 30 disciplines olympiques, au cœur de sites mythiques comme le Stade
                            de France, Roland-Garros, la Tour Eiffel ou encore la Seine transformée en scène d’ouverture
                            spectaculaire.
                        </p>
                        <p>
                            L’objectif de ces Jeux est de rendre le sport accessible à tous et de promouvoir des valeurs
                            fortes : respect, inclusion et durabilité. Paris 2024 s’engage également à organiser les
                            premiers Jeux Olympiques durables avec 95 % de sites existants ou temporaires, un impact
                            environnemental réduit et une volonté de laisser un héritage positif pour les générations
                            futures.
                        </p>
                    </div>
                </div>
            </Container>
        </Section>
    )
        ;
};

export default Presentation;