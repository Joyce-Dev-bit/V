# React + Vite

## Messagerie de démonstration

Le panneau « Messagerie » regroupe les conversations par contact. Il peut aussi
être ouvert depuis la fiche d'un produit pour retrouver le vendeur et le contexte
de l'article. La recherche filtre les contacts et les brouillons restent propres
à chaque conversation.

Il s'agit uniquement d'une démonstration côté navigateur : les messages ne sont
pas envoyés à un serveur et les conversations disparaissent au rechargement.

## Organisation du frontend

- `src/App.jsx` est le point d'entrée de l'interface et assemble la page d'accueil.
- `src/pages/HomePage.jsx` compose la page, ses fenêtres et la messagerie.
- `src/components/` contient les parties de la page, les publications et les fenêtres.
- `src/hooks/useHomePage.js` centralise l'état et les actions de la page.
- `src/data/demoData.js` rassemble les exemples de produits, publications et vendeurs.
- `src/MessagingWidget.jsx` gère les conversations locales ; son style est séparé
  dans `src/MessagingWidget.css`. Les autres styles restent dans `src/App.css`.

L'application n'a qu'une seule page pour l'instant : aucun routeur n'est nécessaire.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
