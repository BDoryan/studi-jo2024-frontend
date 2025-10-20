import React from 'react';
import Section from "@/components/Section";
import Container from "@/components/Container";
import Title from "@/components/Title";

const Presentation: React.FC = () => {
    return (
        <Section className={"relative"} id={"en-savoir-plus"}>
            <Container className={'flex flex-col gap-12 lg:gap-16'}>
                <Title className={"text-center"} level={2}>
                    Jeux Olympiques de Paris 2024
                </Title>
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
                    <div className="w-full lg:w-1/2">
                        <img
                            src="/imgs/display.jpeg"
                            alt="Affiche des Jeux Olympiques 2024"
                            className={"h-full w-full rounded-xl object-cover shadow-lg"}
                        />
                    </div>
                    <div className="flex w-full flex-col gap-4 text-base leading-relaxed text-gray-700 sm:text-lg lg:w-1/2">
                        <p>
                            Les Jeux Olympiques de Paris 2024 marquent un événement historique&nbsp;: cent ans après leur
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
                            fortes&nbsp;: respect, inclusion et durabilité. Paris 2024 s’engage également à organiser les
                            premiers Jeux Olympiques durables avec 95&nbsp;% de sites existants ou temporaires, un impact
                            environnemental réduit et une volonté de laisser un héritage positif pour les générations
                            futures.
                        </p>
                    </div>
                </div>
            </Container>
        </Section>
    );
};

export default Presentation;
