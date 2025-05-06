# Application de Recherche d'Information TF-IDF

Cette application permet de charger des documents textuels, de les indexer en utilisant la methode TF-IDF (Term Frequency-Inverse Document Frequency) et d'effectuer des recherches dans ces documents.

## Fonctionnalites

- Chargement de fichiers texte (.txt) via une interface graphique
- Pretraitement des textes:
  - Normalisation (minuscules, suppression des caractères speciaux)
  - Suppression des mots vides (stopwords)
  - Stemming (reduction des mots à leur racine)
- Calcul de l'index TF-IDF
- Visualisation de l'index
- Recherche par requête textuelle
- Choix entre deux methodes de similarite:
  - Similarite cosinus
  - Distance euclidienne
- Affichage des resultats tries par pertinence

## Structure du Projet

```
TP_RI/
├── backend/
│   ├── app.js               # API express js et logique metier
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js    # Composant de chargement de fichiers
│   │   │   ├── IndexViewer.js   # Composant de visualisation de l'index
│   │   │   ├── SearchForm.js    # Formulaire de recherche
│   │   │   └── SearchResults.js # Affichage des resultats
│   │   ├── App.js           # Composant principal
│   │   ├── App.css          # Styles CSS
│   │   └── index.js         # Point d'entree React
│   ├── package.json         # Dependances
└── README.md                # Ce fichier
```

## Installation et Execution

### Prerequis

- Node.js 14+
- npm ou yarn

### Installation du Backend

1. Naviguer vers le dossier backend:

   ```
   cd backend
   ```

2. Installer les dependances:

   ```
   npm init -y

   npm install express cors multer natural stopword nodemon

   ```

3. Creez un dossier uploads à la racine du projet :
   ```
   mkdir uploads
   ```
4. Lancer le serveur:
   ```
   nodemon app.js
   ```
   Le serveur demarrera sur http://localhost:5000

### Installation du Frontend

1. Naviguer vers le dossier frontend:

   ```
   cd frontend
   ```

2. Installer les dependances:

   ```
   npm install
   ```

   ou

   ```
   yarn install
   ```

3. Lancer l'application:
   ```
   npm start
   ```
   ou
   ```
   yarn start
   ```
   L'application sera accessible sur http://localhost:3000

## Guide d'Utilisation

1. **Chargement des Documents**

   - Cliquez sur "Selectionner des fichiers" pour charger un ou plusieurs fichiers texte (.txt)
   - Une fois les fichiers charges, vous verrez la liste des fichiers importes
   - Cliquez sur "Indexer" pour lancer le processus d'indexation TF-IDF

2. **Visualisation de l'Index**

   - Après l'indexation, l'application vous redirigera vers l'onglet "Visualisation de l'Index"
   - Vous pouvez rechercher des termes specifiques dans la barre de recherche
   - Vous pouvez trier les termes par ordre alphabetique ou par frequence
   - Le tableau affiche chaque terme avec ses scores TF-IDF pour chaque document

3. **Recherche**
   - Accedez à l'onglet "Recherche"
   - Saisissez votre requête dans le champ prevu
   - Choisissez la methode de similarite (Cosinus ou Euclidienne)
   - Cliquez sur "Rechercher" pour lancer la recherche
   - Les resultats s'afficheront en dessous, tries par ordre decroissant de pertinence

## Explications Techniques

### TF-IDF

Le TF-IDF (Term Frequency-Inverse Document Frequency) est une methode statistique utilisee en recherche d'information pour evaluer l'importance d'un terme dans un document par rapport à une collection de documents.

- **TF (Term Frequency)** : Mesure la frequence d'un terme dans un document.

  ```
  TF(t, d) = (Nombre d'occurrences de t dans d) / (Nombre total de termes dans d)
  ```

- **IDF (Inverse Document Frequency)** : Mesure l'importance du terme dans l'ensemble de la collection.

  ```
  IDF(t) = log(Nombre total de documents / Nombre de documents contenant t)
  ```

- **TF-IDF** : Combinaison des deux mesures.
  ```
  TF-IDF(t, d) = TF(t, d) × IDF(t)
  ```

### Methodes de Similarite

- **Similarite Cosinus** : Mesure l'angle entre deux vecteurs dans un espace multidimensionnel. Plus l'angle est petit, plus les documents sont similaires.

  ```
  cos(θ) = (q · d) / (||q|| × ||d||)
  ```

  où q est le vecteur de la requête et d est le vecteur du document.

- **Distance Euclidienne** : Mesure la distance "en ligne droite" entre deux vecteurs. Plus la distance est petite, plus les documents sont similaires.
  ```
  d(q, d) = √(Σ(qi - di)²)
  ```
  où q est le vecteur de la requête et d est le vecteur du document.

### Pretraitement du Texte

1. **Normalisation** :

   - Conversion en minuscules pour eliminer les differences de casse
   - Suppression des caractères non alphanumeriques (ponctuation, symboles...)

2. **Suppression des Stopwords** :

   - elimination des mots vides ou mots outils (articles, prepositions, etc.)
   - Ces mots très frequents apportent peu de valeur semantique

3. **Stemming** :
   - Reduction des mots à leur racine (ex: "marchons", "marcher", "marchait" → "march")
   - Permet de regrouper les variantes morphologiques d'un même mot

## Architecture Technique

### Backend (NodeJS /ExpressJS)

- Utilisation de **ExpressJS** comme framework web leger
- Bibliothèque **natural** pour le traitement du langage naturel (stopwords, stemming)
- API RESTful avec 3 points d'entree principaux:
  - `/api/upload` : Reception des fichiers texte
  - `/api/index` : Indexation TF-IDF des documents
  - `/api/search` : Recherche dans les documents indexes

### Frontend (React)

- Interface utilisateur construite avec **React**
- Architecture à base de composants pour une meilleure maintenabilite
- 4 composants principaux:
  - `FileUpload` : Gestion du telechargement des fichiers
  - `IndexViewer` : Affichage de l'index TF-IDF
  - `SearchForm` : Formulaire de recherche
  - `SearchResults` : Affichage des resultats de recherche

## Fonctionnement Detaille du Code

### Backend (app.js)

Le backend est construit autour de la classe `TFIDFSearchEngine` qui implemente toutes les fonctionnalites d'indexation et de recherche:

1. **Pretraitement** : Le texte passe par plusieurs etapes (normalisation, tokenization, suppression des stopwords, stemming).
2. **Indexation** : Calcul des scores TF pour chaque document, puis des scores IDF et finalement des scores TF-IDF.
3. **Recherche** : La requête subit le même pretraitement, puis les scores de similarite sont calcules entre le vecteur de la requête et chaque document.

Les API REST exposent ces fonctionnalites au frontend:

- `/api/upload` : Pour uploader les fichiers texte
- `/api/index` : Pour lancer l'indexation
- `/api/search` : Pour effectuer une recherche

### Frontend (React)

L'interface utilisateur est divisee en composants React:

1. `App.js` : Gère l'etat global et la navigation entre les onglets.
2. `FileUpload.js` : S'occupe du telechargement des fichiers et du declenchement de l'indexation.
3. `IndexViewer.js` : Affiche l'index TF-IDF sous forme de tableau avec des fonctionnalites de tri et de filtrage.
4. `SearchForm.js` : Permet de saisir une requête et de choisir la methode de similarite.
5. `SearchResults.js` : Affiche les resultats de recherche tries par pertinence.
