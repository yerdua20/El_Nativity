# Projet : gestion d'affaires (distribution + bar/restaurant)

## Contexte métier

Application de gestion pour une entreprise qui fait de la distribution
en dépôt-vente et exploite deux bars et un restaurant.

Besoin central : tracer la marchandise confiée aux commerciaux pour
qu'un départ de commercial ne fasse pas perdre le stock ni les créances.

Deux soldes tenus séparément pour chaque client ET chaque commercial :

- solde marchandise = déposé - vendu déclaré - retourné
- solde financier = ventes reconnues - encaissé

## Stack imposé

- Back : Django + Django REST Framework, PostgreSQL (Neon)
- Front : React + Vite, PWA hors ligne (Dexie/IndexedDB, Workbox), Tailwind
- Déploiement : Render (back), Cloudflare Pages (front)
- Ne pas proposer Next.js, MongoDB ou un autre framework.

## Contraintes techniques

- Saisie terrain sur téléphone, souvent hors réseau : toute écriture
  doit pouvoir être créée hors ligne puis synchronisée.
- Chaque mouvement porte un UUID généré côté client (anti-doublon).
- Capture GPS + photo au moment de la saisie d'un dépôt, pas seulement
  sur la fiche client.
- Les prix vivent dans une table Tarif (produit × point de vente ×
  date d'effet). Jamais de champ prix sur le modèle Produit.
- Aucun secret dans le code : tout par variables d'environnement.

## Conventions

- Code et commentaires en français, noms de modèles en français.
- Une seule table de mouvements de stock, typée par un champ `type`.
- Toute écriture touchant un solde passe par une transaction atomique.
