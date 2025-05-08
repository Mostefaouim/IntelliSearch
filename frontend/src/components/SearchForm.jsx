import { useState } from "react";
import "./SearchForm.css";

function SearchForm({ isIndexed, onSearchResults }) {
  const [query, setQuery] = useState("");
  const [similarityMethod, setSimilarityMethod] = useState("cosine");
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");

  const backendUrl = "https://backend-c5q8.onrender.com" || "http://localhost:5000";
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setMessage("Please enter a query");
      return;
    }

    setIsSearching(true);
    setMessage("Searching...");

    try {
      const response = await fetch(`${backendUrl}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          similarity_method: similarityMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.results.length} results found`);
        onSearchResults(data.results);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Server connection error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-form">
      <h2>Search</h2>

      <form onSubmit={handleSearch}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter your query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!isIndexed || isSearching}
            className="search-input"
          />
        </div>

        <div className="form-group">
          <label>Similarity Method:</label>
          <select
            value={similarityMethod}
            onChange={(e) => setSimilarityMethod(e.target.value)}
            disabled={!isIndexed || isSearching}
            className="similarity-select"
          >
            <option value="cosine">Cosine Similarity</option>
            <option value="euclidean">Euclidean Distance</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isIndexed || isSearching}
          className="button"
        >
          Search
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default SearchForm;
