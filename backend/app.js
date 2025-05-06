import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import natural from 'natural';
const stemmer = natural.PorterStemmer;
import { removeStopwords } from 'stopword';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

class TFIDFSearchEngine {
  constructor() {
    this.documents = {};
    this.index = {};
    this.documentFrequencies = {};
    this.documentVectors = {};
    this.frenchStopwords = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'en', 'est', 'pour', 'pas', 'que', 'qui', 'par', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces', 'au', 'aux', 'plus', 'moins', 'votre', 'notre', 'leur', 'tous', 'tout', 'toute', 'toutes', 'autre', 'autres', 'même', 'aussi', 'fait'];
    this.englishStopwords = ['a', 'its', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'];
    this.stopwords = [...this.frenchStopwords, ...this.englishStopwords];
  }

  normalizeText(text) {
    text = text.toLowerCase();
    text = text.replace(/[^\w\s]/g, '');
    return text;
  }

  tokenize(text) {
    return text.split(/\s+/);
  }

  removeStopwords(tokens) {
    let filteredTokens = removeStopwords(tokens);
    filteredTokens = filteredTokens.filter(token => !this.stopwords.includes(token));
    return filteredTokens;
  }

  stemTokens(tokens) {
    return tokens.map(token => stemmer.stem(token));
  }

  preprocess(text) {
    const normalizedText = this.normalizeText(text);
    const tokens = this.tokenize(normalizedText);
    const tokensWithoutStopwords = this.removeStopwords(tokens);
    const stemmedTokens = this.stemTokens(tokensWithoutStopwords);
    return stemmedTokens;
  }

  addDocument(docId, documentText) {
    this.documents[docId] = documentText;
  }

  computeTF(document) {
    const tokens = this.preprocess(document);
    const tfDict = {};
    tokens.forEach(token => {
      tfDict[token] = (tfDict[token] || 0) + 1;
    });
    const docSize = tokens.length;
    Object.keys(tfDict).forEach(token => {
      tfDict[token] = docSize > 0 ? tfDict[token] / docSize : 0;
    });
    return tfDict;
  }

  computeDocumentFrequencies() {
    this.documentFrequencies = {};
    Object.entries(this.documents).forEach(([docId, document]) => {
      const tokens = new Set(this.preprocess(document));
      tokens.forEach(token => {
        this.documentFrequencies[token] = (this.documentFrequencies[token] || 0) + 1;
      });
    });
  }

  computeTFIDF() {
    this.index = {};
    this.documentVectors = {};
    const totalDocs = Object.keys(this.documents).length;
    this.computeDocumentFrequencies();
    Object.entries(this.documents).forEach(([docId, document]) => {
      const tfDict = this.computeTF(document);
      this.documentVectors[docId] = {};
      Object.entries(tfDict).forEach(([token, tf]) => {
        const df = this.documentFrequencies[token] || 0;
        const idf = Math.log(totalDocs / (df + 1)) + 1;
        const tfidf = tf * idf;
        if (!this.index[token]) {
          this.index[token] = {};
        }
        this.index[token][docId] = tfidf;
        this.documentVectors[docId][token] = tfidf;
      });
    });
  }

  cosineSimilarity(queryVector, documentVector) {
    let dotProduct = 0;
    Object.entries(queryVector).forEach(([term, weight]) => {
      if (documentVector[term]) {
        dotProduct += weight * documentVector[term];
      }
    });
    const queryNorm = Math.sqrt(Object.values(queryVector).reduce((sum, weight) => sum + weight * weight, 0));
    const docNorm = Math.sqrt(Object.values(documentVector).reduce((sum, weight) => sum + weight * weight, 0));
    if (queryNorm === 0 || docNorm === 0) {
      return 0;
    }
    return dotProduct / (queryNorm * docNorm);
  }

  euclideanDistance(queryVector, documentVector) {
    const allTerms = new Set([...Object.keys(queryVector), ...Object.keys(documentVector)]);
    let sumSquaredDiff = 0;
    allTerms.forEach(term => {
      const qVal = queryVector[term] || 0;
      const dVal = documentVector[term] || 0;
      sumSquaredDiff += Math.pow(qVal - dVal, 2);
    });
    const distance = Math.sqrt(sumSquaredDiff);
    return 1 / (distance + 0.0001);
  }

  search(query, similarityMethod = "cosine") {
    const preprocessedQuery = this.preprocess(query);
    const queryTF = {};
    preprocessedQuery.forEach(token => {
      queryTF[token] = (queryTF[token] || 0) + 1;
    });
    const queryLength = preprocessedQuery.length;
    Object.keys(queryTF).forEach(token => {
      queryTF[token] = queryLength > 0 ? queryTF[token] / queryLength : 0;
    });
    const totalDocs = Object.keys(this.documents).length;
    const queryVector = {};
    Object.entries(queryTF).forEach(([token, tf]) => {
      const df = this.documentFrequencies[token] || 0;
      const idf = Math.log2(totalDocs / (df + 1)) + 1;
      queryVector[token] = tf * idf;
    });
    const scores = {};
    Object.entries(this.documentVectors).forEach(([docId, docVector]) => {
      if (similarityMethod === "cosine") {
        scores[docId] = this.cosineSimilarity(queryVector, docVector);
      } else {
        scores[docId] = this.euclideanDistance(queryVector, docVector);
      }
    });
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sortedScores;
  }
}

const searchEngine = new TFIDFSearchEngine();

app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Aucun fichier trouvé' });
  }
  searchEngine.documents = {};
  req.files.forEach(file => {
    if (path.extname(file.originalname) === '.txt') {
      const content = fs.readFileSync(file.path, 'utf-8');
      searchEngine.addDocument(file.originalname, content);
      fs.unlinkSync(file.path);
    }
  });
  return res.json({
    message: `${Object.keys(searchEngine.documents).length} fichiers chargés`,
    documents: Object.keys(searchEngine.documents)
  });
});

app.post('/api/index', (req, res) => {
  searchEngine.computeTFIDF();
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

app.post('/api/search', (req, res) => {
  const { query, similarity_method = 'cosine' } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Requête vide' });
  }
  const searchResults = searchEngine.search(query, similarity_method);
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
