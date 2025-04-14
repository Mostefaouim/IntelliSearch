# Application de Recherche d'Information TF-IDF

Cette application permet de charger des documents textuels, de les indexer en utilisant la méthode TF-IDF (Term Frequency-Inverse Document Frequency) et d'effectuer des recherches dans ces documents.

## Fonctionnalités

- Chargement de fichiers texte (.txt) via une interface graphique
- Prétraitement des textes:
  - Normalisation (minuscules, suppression des caractères spéciaux)
  - Suppression des mots vides (stopwords)
  - Stemming (réduction des mots à leur racine)
- Calcul de l'index TF-IDF
- Visualisation de l'index
- Recherche par requête textuelle
- Choix entre deux méthodes de similarité:
  - Similarité cosinus
  - Distance euclidienne
- Affichage des résultats triés par pertinence

## Structure du Projet

```
tf-idf-search-app/
├── backend/
│   ├── app.js               # API express js et logique métier
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js    # Composant de chargement de fichiers
│   │   │   ├── IndexViewer.js   # Composant de visualisation de l'index
│   │   │   ├── SearchForm.js    # Formulaire de recherche
│   │   │   └── SearchResults.js # Affichage des résultats
│   │   ├── App.js           # Composant principal
│   │   ├── App.css          # Styles CSS
│   │   └── index.js         # Point d'entrée React
│   ├── package.json         # Dépendances
│   └── Dockerfile           # Configuration Docker pour le frontend
├── docker-compose.yml       # Configuration Docker Compose
└── README.md                # Ce fichier
```

## Installation et Exécution

### Prérequis

- Node.js 14+
- npm ou yarn

### Installation du Backend

1. Naviguer vers le dossier backend:
   ```
   cd backend
   ```

2. Installer les dépendances:
   ```
   npm init -y

   npm install express cors multer natural stopword nodemon 

   ```

3. Créez un dossier uploads à la racine du projet :
   ```
   mkdir uploads
   ```
4. Lancer le serveur:
   ```
   nodemon app.js
   ```
   Le serveur démarrera sur http://localhost:5000

### Installation du Frontend

1. Naviguer vers le dossier frontend:
   ```
   cd frontend
   ```

2. Installer les dépendances:
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
   - Cliquez sur "Sélectionner des fichiers" pour charger un ou plusieurs fichiers texte (.txt)
   - Une fois les fichiers chargés, vous verrez la liste des fichiers importés
   - Cliquez sur "Indexer" pour lancer le processus d'indexation TF-IDF

2. **Visualisation de l'Index**
   - Après l'indexation, l'application vous redirigera vers l'onglet "Visualisation de l'Index"
   - Vous pouvez rechercher des termes spécifiques dans la barre de recherche
   - Vous pouvez trier les termes par ordre alphabétique ou par fréquence
   - Le tableau affiche chaque terme avec ses scores TF-IDF pour chaque document

3. **Recherche**
   - Accédez à l'onglet "Recherche"
   - Saisissez votre requête dans le champ prévu
   - Choisissez la méthode de similarité (Cosinus ou Euclidienne)
   - Cliquez sur "Rechercher" pour lancer la recherche
   - Les résultats s'afficheront en dessous, triés par ordre décroissant de pertinence

## Explications Techniques

### TF-IDF

Le TF-IDF (Term Frequency-Inverse Document Frequency) est une méthode statistique utilisée en recherche d'information pour évaluer l'importance d'un terme dans un document par rapport à une collection de documents.

- **TF (Term Frequency)** : Mesure la fréquence d'un terme dans un document.
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

### Méthodes de Similarité

- **Similarité Cosinus** : Mesure l'angle entre deux vecteurs dans un espace multidimensionnel. Plus l'angle est petit, plus les documents sont similaires.
  ```
  cos(θ) = (q · d) / (||q|| × ||d||)
  ```
  où q est le vecteur de la requête et d est le vecteur du document.

- **Distance Euclidienne** : Mesure la distance "en ligne droite" entre deux vecteurs. Plus la distance est petite, plus les documents sont similaires.
  ```
  d(q, d) = √(Σ(qi - di)²)
  ```
  où q est le vecteur de la requête et d est le vecteur du document.

### Prétraitement du Texte

1. **Normalisation** : 
   - Conversion en minuscules pour éliminer les différences de casse
   - Suppression des caractères non alphanumériques (ponctuation, symboles...)

2. **Suppression des Stopwords** :
   - Élimination des mots vides ou mots outils (articles, prépositions, etc.)
   - Ces mots très fréquents apportent peu de valeur sémantique

3. **Stemming** :
   - Réduction des mots à leur racine (ex: "marchons", "marcher", "marchait" → "march")
   - Permet de regrouper les variantes morphologiques d'un même mot

## Architecture Technique

### Backend (Python/Flask)

- Utilisation de **Flask** comme framework web léger
- Bibliothèque **NLTK** pour le traitement du langage naturel (stopwords, stemming)
- API RESTful avec 3 points d'entrée principaux:
  - `/api/upload` : Réception des fichiers texte
  - `/api/index` : Indexation TF-IDF des documents
  - `/api/search` : Recherche dans les documents indexés

### Frontend (React)

- Interface utilisateur construite avec **React**
- Architecture à base de composants pour une meilleure maintenabilité
- 4 composants principaux:
  - `FileUpload` : Gestion du téléchargement des fichiers
  - `IndexViewer` : Affichage de l'index TF-IDF
  - `SearchForm` : Formulaire de recherche
  - `SearchResults` : Affichage des résultats de recherche

## Fonctionnement Détaillé du Code

### Backend (app.py)

Le backend est construit autour de la classe `TFIDFSearchEngine` qui implémente toutes les fonctionnalités d'indexation et de recherche:

1. **Prétraitement** : Le texte passe par plusieurs étapes (normalisation, tokenization, suppression des stopwords, stemming).
2. **Indexation** : Calcul des scores TF pour chaque document, puis des scores IDF et finalement des scores TF-IDF.
3. **Recherche** : La requête subit le même prétraitement, puis les scores de similarité sont calculés entre le vecteur de la requête et chaque document.

Les API REST (Flask) exposent ces fonctionnalités au frontend:
- `/api/upload` : Pour uploader les fichiers texte
- `/api/index` : Pour lancer l'indexation
- `/api/search` : Pour effectuer une recherche

### Frontend (React)

L'interface utilisateur est divisée en composants React:

1. `App.js` : Gère l'état global et la navigation entre les onglets.
2. `FileUpload.js` : S'occupe du téléchargement des fichiers et du déclenchement de l'indexation.
3. `IndexViewer.js` : Affiche l'index TF-IDF sous forme de tableau avec des fonctionnalités de tri et de filtrage.
4. `SearchForm.js` : Permet de saisir une requête et de choisir la méthode de similarité.
5. `SearchResults.js` : Affiche les résultats de recherche triés par pertinence.

## Pistes d'Amélioration

- Ajouter la prise en charge d'autres formats de fichiers (PDF, DOC, etc.)
- Implémenter d'autres méthodes de similarité (Jaccard, etc.)
- Ajouter une visualisation graphique des documents et leurs relations
- Optimiser l'indexation pour de grands volumes de documents
- Ajouter des fonctionnalités de filtrage et de facettes pour les résultats de recherche
- Implémenter la correction orthographique et les suggestions de requêtes
- Sauvegarder l'index pour éviter de recalculer à chaque session