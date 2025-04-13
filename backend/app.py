# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import math
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

# Téléchargement des ressources NLTK nécessaires
nltk.download('stopwords')

app = Flask(__name__)
CORS(app)  # Pour permettre les requêtes cross-origin depuis le frontend

# Classe pour gérer l'indexation et la recherche TF-IDF
class TFIDFSearchEngine:
    def __init__(self):
        self.documents = {}
        self.index = {}
        self.document_frequencies = {}
        self.document_vectors = {}
        self.stemmer = PorterStemmer()
        self.stopwords = set(stopwords.words('french') + stopwords.words('english'))
    
    def normalize_text(self, text):
        """Normalise le texte : minuscules, suppression caractères spéciaux"""
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        return text
    
    def tokenize(self, text):
        """Tokenise le texte en mots"""
        return text.split()
    
    def remove_stopwords(self, tokens):
        """Supprime les mots vides (stopwords)"""
        return [token for token in tokens if token not in self.stopwords]
    
    def stem_tokens(self, tokens):
        """Applique le stemming sur les tokens"""
        return [self.stemmer.stem(token) for token in tokens]
    
    def preprocess(self, text):
        """Applique toutes les étapes de prétraitement"""
        normalized_text = self.normalize_text(text)
        tokens = self.tokenize(normalized_text)
        tokens = self.remove_stopwords(tokens)
        tokens = self.stem_tokens(tokens)
        return tokens
    
    def add_document(self, doc_id, document_text):
        """Ajoute un document au corpus"""
        self.documents[doc_id] = document_text
    
    def compute_tf(self, document):
        """Calcule la fréquence des termes (TF)"""
        tokens = self.preprocess(document)
        tf_dict = {}
        for token in tokens:
            tf_dict[token] = tf_dict.get(token, 0) + 1
        
        # Normalisation du TF par la taille du document
        doc_size = len(tokens)
        for token, count in tf_dict.items():
            tf_dict[token] = count / doc_size if doc_size > 0 else 0
            
        return tf_dict
    
    def compute_document_frequencies(self):
        """Calcule la fréquence des documents pour chaque terme"""
        self.document_frequencies = {}
        for doc_id, document in self.documents.items():
            tokens = set(self.preprocess(document))
            for token in tokens:
                self.document_frequencies[token] = self.document_frequencies.get(token, 0) + 1
    
    def compute_tfidf(self):
        """Calcule le TF-IDF pour tous les documents"""
        self.index = {}
        self.document_vectors = {}
        
        # D'abord, calculer la fréquence des termes par document
        total_docs = len(self.documents)
        
        # Calculer la fréquence des documents pour chaque terme
        self.compute_document_frequencies()
        
        # Calculer le TF-IDF pour chaque terme dans chaque document
        for doc_id, document in self.documents.items():
            tf_dict = self.compute_tf(document)
            self.document_vectors[doc_id] = {}
            
            for token, tf in tf_dict.items():
                # Calculer l'IDF
                df = self.document_frequencies.get(token, 0)
                idf = math.log(total_docs / (df + 1)) + 1  # +1 pour éviter la division par zéro
                
                # Calculer TF-IDF
                tfidf = tf * idf
                
                # Stocker dans l'index et dans le vecteur du document
                if token not in self.index:
                    self.index[token] = {}
                self.index[token][doc_id] = tfidf
                self.document_vectors[doc_id][token] = tfidf
    
    def cosine_similarity(self, query_vector, document_vector):
        """Calcule la similarité cosinus entre deux vecteurs"""
        dot_product = 0
        for term, weight in query_vector.items():
            if term in document_vector:
                dot_product += weight * document_vector[term]
        
        # Calculer la norme des vecteurs
        query_norm = math.sqrt(sum(w * w for w in query_vector.values()))
        doc_norm = math.sqrt(sum(w * w for w in document_vector.values()))
        
        if query_norm == 0 or doc_norm == 0:
            return 0
        
        return dot_product / (query_norm * doc_norm)
    
    def euclidean_distance(self, query_vector, document_vector):
        """Calcule la distance euclidienne entre deux vecteurs"""
        # Créer un ensemble de tous les termes dans les deux vecteurs
        all_terms = set(query_vector.keys()) | set(document_vector.keys())
        
        # Calculer la somme des carrés des différences
        sum_squared_diff = 0
        for term in all_terms:
            q_val = query_vector.get(term, 0)
            d_val = document_vector.get(term, 0)
            sum_squared_diff += (q_val - d_val) ** 2
        
        # La distance euclidienne est la racine carrée de cette somme
        distance = math.sqrt(sum_squared_diff)
        
        # Pour la recherche, nous voulons que des valeurs plus élevées indiquent une meilleure correspondance
        # Donc nous retournons l'inverse de la distance (avec un petit epsilon pour éviter la division par zéro)
        return 1 / (distance + 0.0001)
    
    def search(self, query, similarity_method="cosine"):
        """Recherche les documents correspondant à la requête"""
        # Prétraiter la requête
        preprocessed_query = self.preprocess(query)
        
        # Calculer TF pour la requête
        query_tf = {}
        for token in preprocessed_query:
            query_tf[token] = query_tf.get(token, 0) + 1
        
        # Normaliser par la longueur de la requête
        query_length = len(preprocessed_query)
        for token in query_tf:
            query_tf[token] = query_tf[token] / query_length if query_length > 0 else 0
        
        # Calculer TF-IDF pour la requête
        total_docs = len(self.documents)
        query_vector = {}
        for token, tf in query_tf.items():
            df = self.document_frequencies.get(token, 0)
            idf = math.log(total_docs / (df + 1)) + 1
            query_vector[token] = tf * idf
        
        # Calculer la similarité/distance avec chaque document
        scores = {}
        for doc_id, doc_vector in self.document_vectors.items():
            if similarity_method == "cosine":
                scores[doc_id] = self.cosine_similarity(query_vector, doc_vector)
            else:  # euclidean
                scores[doc_id] = self.euclidean_distance(query_vector, doc_vector)
        
        # Trier les résultats par score décroissant
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_scores

# Initialiser le moteur de recherche
search_engine = TFIDFSearchEngine()

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Point d'API pour uploader des fichiers"""
    if 'files' not in request.files:
        return jsonify({'error': 'Aucun fichier trouvé'}), 400
    
    files = request.files.getlist('files')
    
    # Vider les documents précédents
    search_engine.documents = {}
    
    for file in files:
        if file.filename.endswith('.txt'):
            content = file.read().decode('utf-8')
            search_engine.add_document(file.filename, content)
    
    return jsonify({
        'message': f'{len(search_engine.documents)} fichiers chargés',
        'documents': list(search_engine.documents.keys())
    })

@app.route('/api/index', methods=['POST'])
def index_documents():
    """Point d'API pour indexer les documents"""
    search_engine.compute_tfidf()
    
    # Format de retour pour l'affichage dans l'interface
    index_data = {}
    for term, docs in search_engine.index.items():
        index_data[term] = [{"document": doc_id, "tfidf": score} for doc_id, score in docs.items()]
    
    return jsonify({
        'message': 'Indexation terminée',
        'index': index_data,
        'terms_count': len(search_engine.index)
    })

@app.route('/api/search', methods=['POST'])
def search_documents():
    """Point d'API pour rechercher des documents"""
    data = request.json
    query = data.get('query', '')
    similarity_method = data.get('similarity_method', 'cosine')
    
    if not query:
        return jsonify({'error': 'Requête vide'}), 400
    
    search_results = search_engine.search(query, similarity_method)
    
    # Format de retour pour l'affichage
    formatted_results = []
    for doc_id, score in search_results:
        formatted_results.append({
            'document': doc_id,
            'score': score,
            'content': search_engine.documents[doc_id][:200] + "..." if len(search_engine.documents[doc_id]) > 200 else search_engine.documents[doc_id]
        })
    
    return jsonify({
        'results': formatted_results
    })

if __name__ == '__main__':
    app.run(debug=True)