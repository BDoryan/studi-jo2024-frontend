# Studi JO 2024 – Frontend

Application React qui expose la billetterie des Jeux Olympiques et Paralympiques de Paris 2024 : parcours marketing, consultation des offres, authentification et accès compte utilisateur.

## Stack principale
- Vite + React 18 (TypeScript)
- Tailwind CSS avec thème personnalisé Paris 2024
- React Router pour la navigation
- Intégration aux APIs métier via `src/lib/api`

## Prérequis
- Node.js 18+
- npm (ou pnpm/yarn selon vos habitudes)

## Installation
```bash
npm install
```

## Lancer le projet
```bash
npm run dev
```
L’application est accessible sur `http://localhost:5173`.

## Scripts utiles
- `npm run dev` : serveur de développement avec hot reload.
- `npm run build` : build de production dans `dist/`.
- `npm run preview` : prévisualisation locale du build.

## Structure rapide
- `src/components` : composants génériques (Header, Footer, Button, etc.).
- `src/blocks` : sections de page réutilisables (Hero, Presentation…).
- `src/pages` : pages complètes utilisées par le routeur.
- `src/lib` : helpers, logique d’authentification et clients API.
- `public/imgs` : assets statiques (logos, visuels).

## Backend
Pour en savoir plus sur le projet backend (API et logique métier), consultez : https://github.com/BDoryan/studi-jo2024-backend
