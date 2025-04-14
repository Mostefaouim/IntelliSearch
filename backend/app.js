// backend/app.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const natural = require('natural');
const stemmer = natural.PorterStemmer;
const { removeStopwords } = require('stopword');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Classe pour gérer l'indexation et la recherche TF-IDF
class TFIDFSearchEngine {
    constructor() {
        this.documents = {};
        this.index = {};
        this.documentFrequencies = {};
        this.documentVectors = {};
        
        // Liste personnalisée de stopwords français
        this.frenchStopwords = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'en', 'est', 'pour', 'pas', 'que', 'qui', 'par', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces', 'au', 'aux', 'plus', 'moins', 'votre', 'notre', 'leur', 'tous', 'tout', 'toute', 'toutes', 'autre', 'autres', 'même', 'aussi', 'fait'];
        
        // Combinaison des stopwords anglais fournis par le module et les français personnalisés
        this.stopwords = [...this.frenchStopwords];
    }

    normalizeText(text) {
        // Normalise le texte : minuscules, suppression caractères spéciaux
        text = text.toLowerCase();
        text = text.replace(/[^\w\s]/g, '');
        return text;
    }

    tokenize(text) {
        // Tokenise le texte en mots
        return text.split(/\s+/);
    }

    removeStopwords(tokens) {
        // Supprime les mots vides (stopwords)
        // Utilise le module stopword pour les mots anglais
        let filteredTokens = removeStopwords(tokens);
        
        // Filtre manuellement les stopwords français
        filteredTokens = filteredTokens.filter(token => !this.frenchStopwords.includes(token));
        
        return filteredTokens;
    }

    stemTokens(tokens) {
        // Applique le stemming sur les tokens
        return tokens.map(token => stemmer.stem(token));
    }

    preprocess(text) {
        // Applique toutes les étapes de prétraitement
        const normalizedText = this.normalizeText(text);
        const tokens = this.tokenize(normalizedText);
        const tokensWithoutStopwords = this.removeStopwords(tokens);
        const stemmedTokens = this.stemTokens(tokensWithoutStopwords);
        return stemmedTokens;
    }

    addDocument(docId, documentText) {
        // Ajoute un document au corpus
        this.documents[docId] = documentText;
    }

    computeTF(document) {
        // Calcule la fréquence des termes (TF)
        const tokens = this.preprocess(document);
        const tfDict = {};
        
        tokens.forEach(token => {
            tfDict[token] = (tfDict[token] || 0) + 1;
        });
        
        // Normalisation du TF par la taille du document
        const docSize = tokens.length;
        Object.keys(tfDict).forEach(token => {
            tfDict[token] = docSize > 0 ? tfDict[token] / docSize : 0;
        });
        
        return tfDict;
    }

    computeDocumentFrequencies() {
        // Calcule la fréquence des documents pour chaque terme
        this.documentFrequencies = {};
        
        Object.entries(this.documents).forEach(([docId, document]) => {
            const tokens = new Set(this.preprocess(document));
            tokens.forEach(token => {
                this.documentFrequencies[token] = (this.documentFrequencies[token] || 0) + 1;
            });
        });
    }

    computeTFIDF() {
        // Calcule le TF-IDF pour tous les documents
        this.index = {};
        this.documentVectors = {};
        
        // D'abord, calculer la fréquence des termes par document
        const totalDocs = Object.keys(this.documents).length;
        
        // Calculer la fréquence des documents pour chaque terme
        this.computeDocumentFrequencies();
        
        // Calculer le TF-IDF pour chaque terme dans chaque document
        Object.entries(this.documents).forEach(([docId, document]) => {
            const tfDict = this.computeTF(document);
            this.documentVectors[docId] = {};
            
            Object.entries(tfDict).forEach(([token, tf]) => {
                // Calculer l'IDF
                const df = this.documentFrequencies[token] || 0;
                const idf = Math.log(totalDocs / (df + 1)) + 1; // +1 pour éviter la division par zéro
                
                // Calculer TF-IDF
                const tfidf = tf * idf;
                
                // Stocker dans l'index et dans le vecteur du document
                if (!this.index[token]) {
                    this.index[token] = {};
                }
                this.index[token][docId] = tfidf;
                this.documentVectors[docId][token] = tfidf;
            });
        });
    }

    cosineSimilarity(queryVector, documentVector) {
        // Calcule la similarité cosinus entre deux vecteurs
        let dotProduct = 0;
        
        Object.entries(queryVector).forEach(([term, weight]) => {
            if (documentVector[term]) {
                dotProduct += weight * documentVector[term];
            }
        });
        
        // Calculer la norme des vecteurs
        const queryNorm = Math.sqrt(Object.values(queryVector).reduce((sum, weight) => sum + weight * weight, 0));
        const docNorm = Math.sqrt(Object.values(documentVector).reduce((sum, weight) => sum + weight * weight, 0));
        
        if (queryNorm === 0 || docNorm === 0) {
            return 0;
        }
        
        return dotProduct / (queryNorm * docNorm);
    }

    euclideanDistance(queryVector, documentVector) {
        // Calcule la distance euclidienne entre deux vecteurs
        // Créer un ensemble de tous les termes dans les deux vecteurs
        const allTerms = new Set([...Object.keys(queryVector), ...Object.keys(documentVector)]);
        
        // Calculer la somme des carrés des différences
        let sumSquaredDiff = 0;
        allTerms.forEach(term => {
            const qVal = queryVector[term] || 0;
            const dVal = documentVector[term] || 0;
            sumSquaredDiff += Math.pow(qVal - dVal, 2);
        });
        
        // La distance euclidienne est la racine carrée de cette somme
        const distance = Math.sqrt(sumSquaredDiff);
        
        // Pour la recherche, nous voulons que des valeurs plus élevées indiquent une meilleure correspondance
        // Donc nous retournons l'inverse de la distance (avec un petit epsilon pour éviter la division par zéro)
        return 1 / (distance + 0.0001);
    }

    search(query, similarityMethod = "cosine") {
        // Recherche les documents correspondant à la requête
        // Prétraiter la requête
        const preprocessedQuery = this.preprocess(query);
        
        // Calculer TF pour la requête
        const queryTF = {};
        preprocessedQuery.forEach(token => {
            queryTF[token] = (queryTF[token] || 0) + 1;
        });
        
        // Normaliser par la longueur de la requête
        const queryLength = preprocessedQuery.length;
        Object.keys(queryTF).forEach(token => {
            queryTF[token] = queryLength > 0 ? queryTF[token] / queryLength : 0;
        });
        
        // Calculer TF-IDF pour la requête
        const totalDocs = Object.keys(this.documents).length;
        const queryVector = {};
        
        Object.entries(queryTF).forEach(([token, tf]) => {
            const df = this.documentFrequencies[token] || 0;
            const idf = Math.log(totalDocs / (df + 1)) + 1;
            queryVector[token] = tf * idf;
        });
        
        // Calculer la similarité/distance avec chaque document
        const scores = {};
        Object.entries(this.documentVectors).forEach(([docId, docVector]) => {
            if (similarityMethod === "cosine") {
                scores[docId] = this.cosineSimilarity(queryVector, docVector);
            } else { // euclidean
                scores[docId] = this.euclideanDistance(queryVector, docVector);
            }
        });
        
        // Trier les résultats par score décroissant
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        
        return sortedScores;
    }
}

// Initialiser le moteur de recherche
const searchEngine = new TFIDFSearchEngine();

// Point d'API pour uploader des fichiers
app.post('/api/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier trouvé' });
    }
    
    // Vider les documents précédents
    searchEngine.documents = {};
    
    req.files.forEach(file => {
        if (path.extname(file.originalname) === '.txt') {
            const content = fs.readFileSync(file.path, 'utf-8');
            searchEngine.addDocument(file.originalname, content);
            
            // Supprimer le fichier temporaire après utilisation
            fs.unlinkSync(file.path);
        }
    });
    
    return res.json({
        message: `${Object.keys(searchEngine.documents).length} fichiers chargés`,
        documents: Object.keys(searchEngine.documents)
    });
});

// Point d'API pour indexer les documents
app.post('/api/index', (req, res) => {
    searchEngine.computeTFIDF();
    
    // Format de retour pour l'affichage dans l'interface
    const indexData = {};
    Object.entries(searchEngine.index).forEach(([term, docs]) => {
        indexData[term] = Object.entries(docs).map(([docId, score]) => ({
            document: docId,
            tfidf: score
        }));
    });
    
    return res.json({
        message: 'Indexation terminée',
        index: indexData,
        terms_count: Object.keys(searchEngine.index).length
    });
});

// Point d'API pour rechercher des documents
app.post('/api/search', (req, res) => {
    const { query, similarity_method = 'cosine' } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Requête vide' });
    }
    
    const searchResults = searchEngine.search(query, similarity_method);
    
    // Format de retour pour l'affichage
    const formattedResults = searchResults.map(([docId, score]) => {
        const content = searchEngine.documents[docId];
        return {
            document: docId,
            score: score,
            content: content.length > 200 ? content.substring(0, 200) + "..." : content
        };
    });
    
    return res.json({
        results: formattedResults
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;