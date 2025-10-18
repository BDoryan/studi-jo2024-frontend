import React from 'react';
import {Button} from "@/components/Button";
import Section from "@/components/Section";
import Container from "@/components/Container";
import Title from "@/components/Title";

const Presentation: React.FC = () => {
    return (
        <Section className={"relative bg-gray-100"}>
            <Container className={'flex flex-col gap-20'}>
                <Title className={"text-center"} level={2}>
                    Retrouvez nos épreuves
                </Title>
                <div className="flex flex-col gap-10 items-center justify-center">
                    <div className="gap-10 items-center justify-center max-w-8/12 flex">
                        <img src={"/imgs/sports/athletisme.jpeg"} className={"max-w-1/3"}/>
                        <div className="flex flex-col gap-6">
                            <Title level={4}>
                                Athlétisme
                            </Title>
                            <p>
                                L’épreuve reine des Jeux : vitesse, endurance et performance se rencontrent sur la piste
                                du Stade de France. Des disciplines légendaires comme le 100 mètres, le marathon ou le
                                saut en longueur captiveront le public.
                            </p>
                            <div>
                                <Button variant={"outline"} size={"lg"}>
                                    Acheter des billets
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="gap-10 items-center justify-center max-w-8/12 flex">
                        <div className="flex flex-col gap-6">
                            <Title level={4}>
                                Natations
                            </Title>
                            <p>
                                Les meilleures nageuses et nageurs du monde s’affronteront à la Paris La Défense Arena
                                dans des courses palpitantes, mêlant vitesse, puissance et technique.
                            </p>
                            <div>
                                <Button variant={"outline"} size={"lg"}>
                                    Acheter des billets
                                </Button>
                            </div>
                        </div>
                        <img src={"/imgs/sports/natation.jpeg"} className={"max-w-1/3"}/>
                    </div>
                    <div className="gap-10 items-center justify-center max-w-8/12 flex">
                        <img src={"/imgs/sports/football.jpeg"} className={"max-w-1/3"}/>
                        <div className="flex flex-col gap-6">
                            <Title level={4}>
                                Football
                            </Title>
                            <p>
                                Des matchs passionnants auront lieu dans plusieurs grandes villes françaises — Paris,
                                Lyon, Marseille ou Bordeaux — rassemblant les fans autour d’un sport universel.
                            </p>
                            <div>
                                <Button variant={"outline"} size={"lg"}>
                                    Acheter des billets
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    )
        ;
};

export default Presentation;