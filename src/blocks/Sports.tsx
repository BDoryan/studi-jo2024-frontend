import React from 'react';
import {Button} from "@/components/Button";
import Section from "@/components/Section";
import Container from "@/components/Container";
import Title from "@/components/Title";

const sportsData = [
    {
        title: 'Athlétisme',
        description:
            'L’épreuve reine des Jeux : vitesse, endurance et performance se rencontrent sur la piste du Stade de France. Des disciplines légendaires comme le 100 mètres, le marathon ou le saut en longueur captiveront le public.',
        image: '/imgs/sports/athletisme.jpeg',
    },
    {
        title: 'Natation',
        description:
            'Les meilleures nageuses et les meilleurs nageurs du monde s’affronteront à la Paris La Défense Arena dans des courses palpitantes, mêlant vitesse, puissance et technique.',
        image: '/imgs/sports/natation.jpeg',
    },
    {
        title: 'Football',
        description:
            'Des matchs passionnants auront lieu dans plusieurs grandes villes françaises — Paris, Lyon, Marseille ou Bordeaux — rassemblant les fans autour d’un sport universel.',
        image: '/imgs/sports/football.jpeg',
    },
] as const;

const Sports: React.FC = () => {
    return (
        <Section className={"relative bg-gray-100"}>
            <Container className={'flex flex-col gap-16'}>
                <Title className={"text-center"} level={2}>
                    Retrouvez nos épreuves
                </Title>
                <div className="flex flex-col gap-12">
                    {sportsData.map((sport, index) => {
                        const isReversed = index % 2 === 1;

                        return (
                            <article
                                key={sport.title}
                                className={`flex flex-col gap-8 rounded-3xl bg-white/60 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:flex-row lg:items-stretch ${
                                    isReversed ? 'lg:flex-row-reverse' : ''
                                }`}
                            >
                                <div className="w-full overflow-hidden rounded-2xl lg:w-1/2">
                                    <img
                                        src={sport.image}
                                        alt={`${sport.title} - Jeux Olympiques de Paris 2024`}
                                        className="h-full w-full rounded-2xl object-cover"
                                    />
                                </div>
                                <div className="flex w-full flex-col items-center gap-6 text-center lg:w-1/2 lg:items-start lg:justify-center lg:text-left">
                                    <Title level={4} className="text-primary-600">
                                        {sport.title}
                                    </Title>
                                    <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
                                        {sport.description}
                                    </p>
                                    <Button variant={"outline"} size={"lg"} className="w-full sm:w-auto" href={"/offers"}>
                                        Acheter des billets
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </Container>
        </Section>
    );
};

export default Sports;
