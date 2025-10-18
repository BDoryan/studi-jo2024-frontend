import React from 'react';
import {Button} from "@/components/Button";

const Header: React.FC = () => {
  return (
      <div className={'py-2 shadow'}>
          <div className="mx-auto container flex">
              <a className={'flex flex-1 gap-6'} href={"/"}>
                  <img src={"/imgs/logo.png"} alt={"Logo"} className={'h-16 w-16'}/>
                  <img src={"/imgs/logo-paralympiques.png"} alt={"Logo"} className={'h-16 w-16'}/>
              </a>
              <div className="flex justify-center items-center flex-1 gap-4">
                  <a href="#" className="text-lg uppercase font-bold text-gray-600 hover:text-primary-500 transition">Accueil</a>
                  <a href="#" className="text-lg uppercase font-bold text-gray-600 hover:text-primary-500 transition">Les offres</a>
              </div>
              <div className="flex flex-1 justify-end items-center gap-2">
                  <Button variant="primary">Se connecter</Button>
                  <Button variant="outline">Créer un compte</Button>
              </div>
          </div>
      </div>
  );
};

export default Header;