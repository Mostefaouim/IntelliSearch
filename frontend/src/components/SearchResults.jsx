function SearchResults({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="search-results">
        <p>No results to display</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <h2>Search Results</h2>

      <div className="results-list">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            <h3>{result.document}</h3>
            <p className="score">Score: {result.score > 0 ? parseFloat(result.score).toFixed(4) : 0}</p>
            <p className="preview">{result.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
