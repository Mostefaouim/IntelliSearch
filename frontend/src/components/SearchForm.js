import { useState } from 'react';
import './SearchForm.css';
function SearchForm({ isIndexed, onSearchResults }) {
  const [query, setQuery] = useState('');
  const [similarityMethod, setSimilarityMethod] = useState('cosine');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setMessage('Veuillez saisir une requête');
      return;
    }
    
    setIsSearching(true);
    setMessage('Recherche en cours...');
    
    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          similarity_method: similarityMethod
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`${data.results.length} résultats trouvés`);
        onSearchResults(data.results);
      } else {
        setMessage(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Erreur de connexion au serveur: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="search-form">
      <h2>Recherche</h2>
      
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Entrez votre requête..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!isIndexed || isSearching}
            className="search-input"
          />
        </div>
        
        <div className="form-group">
          <label>Méthode de similarité:</label>
          <select
            value={similarityMethod}
            onChange={(e) => setSimilarityMethod(e.target.value)}
            disabled={!isIndexed || isSearching}
            className="similarity-select"
          >
            <option value="cosine">Similarité Cosinus</option>
            <option value="euclidean">Distance Euclidienne</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={!isIndexed || isSearching}
          className="button"
        >
          Rechercher
        </button>
      </form>
      
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default SearchForm;