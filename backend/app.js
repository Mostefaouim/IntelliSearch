import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import natural from 'natural';
import { removeStopwords } from 'stopword';

const app = express();
const upload = multer({ dest: 'uploads/' });
const stemmer = natural.PorterStemmer;

app.use(cors());
app.use(express.json());

class TFIDFSearchEngine {
  constructor() {
    this.documents = {};
    this.index = {};
    this.documentFrequencies = {};
    this.documentVectors = {};
    this.stopwords = [
      ...['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'en', 'est', 'pour', 'pas', 'que', 'qui', 'par', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces', 'au', 'aux', 'plus', 'moins', 'votre', 'notre', 'leur', 'tous', 'tout', 'toute', 'toutes', 'autre', 'autres', 'même', 'aussi', 'fait'],
      ...['a', 'its', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with']
    ];
  }

  preprocess(text) {
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
    const tokens = normalized.split(/\s+/);
    const filtered = removeStopwords(tokens).filter(token => !this.stopwords.includes(token));
    return filtered.map(token => stemmer.stem(token));
  }

  addDocument(docId, documentText) {
    this.documents[docId] = documentText;
  }

  computeTF(document) {
    const tokens = this.preprocess(document);
    const tfDict = tokens.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});
  
    const maxFreq = Math.max(...Object.values(tfDict));
  
    Object.keys(tfDict).forEach(token => tfDict[token] /= maxFreq);
  
    return tfDict;
  }

  computeDocumentFrequencies() {
    this.documentFrequencies = {};
    Object.values(this.documents).forEach(document => {
      new Set(this.preprocess(document)).forEach(token => {
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
        const idf = Math.log2(totalDocs / (this.documentFrequencies[token] || 1));
        const tfidf = tf * idf;
        this.index[token] = this.index[token] || {};
        this.index[token][docId] = tfidf;
        this.documentVectors[docId][token] = tfidf;
      });
    });
  }

  calculateSimilarity(queryVector, documentVector, method) {
    if (method === 'cosine') {
      let dotProduct = 0, queryNorm = 0, docNorm = 0;
      Object.entries(queryVector).forEach(([term, weight]) => {
        dotProduct += weight * (documentVector[term] || 0);
        queryNorm += weight ** 2;
      });
      Object.values(documentVector).forEach(weight => docNorm += weight ** 2);
      return dotProduct / (Math.sqrt(queryNorm) * Math.sqrt(docNorm) || 1);
    } else {
      const allTerms = new Set([...Object.keys(queryVector), ...Object.keys(documentVector)]);
      let sum = 0;
      allTerms.forEach(term => {
        const diff = (queryVector[term] || 0) - (documentVector[term] || 0);
        sum += diff ** 2;
      });
      return 1 / (Math.sqrt(sum) + 0.0001);
    }
  }

  search(query, method = 'cosine') {
    const tokens = this.preprocess(query);
    const queryTF = tokens.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});
    const length = tokens.length;
    Object.keys(queryTF).forEach(token => queryTF[token] /= length);

    const totalDocs = Object.keys(this.documents).length;
    const queryVector = {};
    Object.entries(queryTF).forEach(([token, tf]) => {
      const idf = Math.log2(totalDocs / (this.documentFrequencies[token] || 1));
      queryVector[token] = tf * idf;
    });

    return Object.entries(this.documentVectors)
      .map(([docId, vector]) => [docId, this.calculateSimilarity(queryVector, vector, method)])
      .sort((a, b) => b[1] - a[1]);
  }
}

const searchEngine = new TFIDFSearchEngine();

app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Aucun fichier trouvé' });

  searchEngine.documents = {};
  req.files.forEach(file => {
    if (path.extname(file.originalname) === '.txt') {
      const content = fs.readFileSync(file.path, 'utf-8');
      searchEngine.addDocument(file.originalname, content);
      fs.unlinkSync(file.path);
    }
  });

  res.json({ message: `${Object.keys(searchEngine.documents).length} fichiers chargés`, documents: Object.keys(searchEngine.documents) });
});

app.post('/api/index', (req, res) => {
  searchEngine.computeTFIDF();
  const indexData = Object.entries(searchEngine.index).reduce((acc, [term, docs]) => {
    acc[term] = Object.entries(docs).map(([docId, tfidf]) => ({ document: docId, tfidf }));
    return acc;
  }, {});
  res.json({ message: 'Indexation terminée', index: indexData, terms_count: Object.keys(indexData).length });
});

app.post('/api/search', (req, res) => {
  const { query, similarity_method = 'cosine' } = req.body;
  if (!query) return res.status(400).json({ error: 'Requête vide' });

  const results = searchEngine.search(query, similarity_method).map(([docId, score]) => ({
    document: docId,
    score,
    content: searchEngine.documents[docId].slice(0, 200) + '...'
  }));
  res.json({ results });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

export default app;