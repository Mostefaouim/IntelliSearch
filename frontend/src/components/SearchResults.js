function SearchResults({ results }) {
    if (!results || results.length === 0) {
      return (
        <div className="search-results">
          <p>Aucun résultat à afficher</p>
        </div>
      );
    }
    
    return (
      <div className="search-results">
        <h2>Résultats de Recherche</h2>
        
        <div className="results-list">
          {results.map((result, index) => (
            <div key={index} className="result-item">
              <h3>{result.document}</h3>
              <p className="score">Score: {result.score.toFixed(4)}</p>
              <p className="preview">{result.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default SearchResults;
  