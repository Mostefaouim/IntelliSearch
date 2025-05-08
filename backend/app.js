import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import natural from 'natural';
import { removeStopwords } from 'stopword';

const app = express();
const fileUploader = multer({ dest: 'uploads/' });
const wordStemmer = natural.PorterStemmer;

app.use(cors());
app.use(express.json());

class SearchEngine {
  constructor() {
    this.allTexts = {};
    this.invertedIndex = {};
    this.wordDocumentCounts = {};
    this.textVectors = {};
    this.stopWordsList = [
      ...['','le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'en', 'est', 'pour', 'pas', 'que', 'qui', 'par', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces', 'au', 'aux', 'plus', 'moins', 'votre', 'notre', 'leur', 'tous', 'tout', 'toute', 'toutes', 'autre', 'autres', 'même', 'aussi', 'fait'],
      ...[ ' ', 'a', 'its', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with']
    ];
  }

  cleanText(text) {
    const lower = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = lower.split(/\s+/);
    const filtered = removeStopwords(words).filter(word => !this.stopWordsList.includes(word));
    return filtered.map(word => wordStemmer.stem(word));
  }

  addText(fileName, fileText) {
    this.allTexts[fileName] = fileText;
  }

  getTermFrequency(text) {
    const words = this.cleanText(text);
    const freqMap = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
  
    const highest = Math.max(...Object.values(freqMap));
  
    Object.keys(freqMap).forEach(word => freqMap[word] /= highest);
  
    return freqMap;
  }

  countWordsInTexts() {
    this.wordDocumentCounts = {};
    Object.values(this.allTexts).forEach(text => {
      new Set(this.cleanText(text)).forEach(word => {
        this.wordDocumentCounts[word] = (this.wordDocumentCounts[word] || 0) + 1;
      });
    });
  }

  buildTFIDF() {
    this.invertedIndex = {};
    this.textVectors = {};
    const numberOfTexts = Object.keys(this.allTexts).length;
    this.countWordsInTexts();

    Object.entries(this.allTexts).forEach(([fileName, fileText]) => {
      const tfMap = this.getTermFrequency(fileText);
      this.textVectors[fileName] = {};
      Object.entries(tfMap).forEach(([word, tf]) => {
        const idf = Math.log2(numberOfTexts / (this.wordDocumentCounts[word] || 1));
        const tfidf = tf * idf;
        this.invertedIndex[word] = this.invertedIndex[word] || {};
        this.invertedIndex[word][fileName] = tfidf;
        this.textVectors[fileName][word] = tfidf;
      });
    });
  }

  compareVectors(queryVec, docVec, method) {
    if (method === 'cosine') {
      let dot = 0, querySize = 0, docSize = 0;
      Object.entries(queryVec).forEach(([word, value]) => {
        dot += value * (docVec[word] || 0);
        querySize += value ** 2;
      });
      Object.values(docVec).forEach(value => docSize += value ** 2);
      return dot / (Math.sqrt(querySize) * Math.sqrt(docSize));
    } else {
      let dotProduct = 0;
      Object.keys(queryVec).forEach(word => {
        dotProduct += queryVec[word] * (docVec[word] || 0);
      });
      return dotProduct;
    }
  }

  searchText(searchText, method = 'cosine') {
    const words = this.cleanText(searchText);
    const tfMap = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    const totalWords = words.length;
    Object.keys(tfMap).forEach(word => tfMap[word] /= totalWords);

    const totalDocs = Object.keys(this.allTexts).length;
    const queryVec = {};
    Object.entries(tfMap).forEach(([word, tf]) => {
      const idf = Math.log2(totalDocs / (this.wordDocumentCounts[word] || 1));
      queryVec[word] = tf * idf;
    });

    return Object.entries(this.textVectors)
      .map(([fileName, vector]) => [fileName, this.compareVectors(queryVec, vector, method)])
      .sort((a, b) => b[1] - a[1]);
  }
}

const engine = new SearchEngine();

app.post('/api/upload', fileUploader.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: 'No files found' });

  engine.allTexts = {};
  req.files.forEach(uploaded => {
    if (path.extname(uploaded.originalname) === '.txt') {
      const fileData = fs.readFileSync(uploaded.path, 'utf-8');
      engine.addText(uploaded.originalname, fileData);
      fs.unlinkSync(uploaded.path);
    }
  });

  res.json({ message: `${Object.keys(engine.allTexts).length} files uploaded`, documents: Object.keys(engine.allTexts) });
});

app.post('/api/index', (req, res) => {
  engine.buildTFIDF();
  const index = Object.entries(engine.invertedIndex).reduce((acc, [word, docs]) => {
    acc[word] = Object.entries(docs).map(([fileName, tfidf]) => ({ document: fileName, tfidf }));
    return acc;
  }, {});
  res.json({ message: 'Indexing completed', index, terms_count: Object.keys(index).length });
});

app.post('/api/search', (req, res) => {
  const { query, similarity_method = 'cosine' } = req.body;
  if (!query) return res.status(400).json({ error: 'Empty query' });

  const matches = engine.searchText(query, similarity_method).map(([fileName, score]) => ({
    document: fileName,
    score,
    content: engine.allTexts[fileName].slice(0, 200) + '...'
  }));
  res.json({ results: matches });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

export default app;
