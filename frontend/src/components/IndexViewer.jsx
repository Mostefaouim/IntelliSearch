import { useState } from "react";

function IndexViewer({ indexData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("alpha"); // 'alpha' or 'count'

  // Obtenir tous les termes et les trier
  const terms = Object.keys(indexData || {});

  const filteredTerms = terms.filter((term) =>
    term.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTerms = [...filteredTerms].sort((a, b) => {
    if (sortOrder === "alpha") {
      return a.localeCompare(b);
    } else {
      return indexData[b].length - indexData[a].length;
    }
  });

  return (
    <div className="index-viewer">
      <h2>Visualisation de l'Index</h2>

      <div className="controls">
        <input
          type="text"
          placeholder="Rechercher un terme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="sort-controls">
          <label>
            <input
              type="radio"
              name="sortOrder"
              value="alpha"
              checked={sortOrder === "alpha"}
              onChange={() => setSortOrder("alpha")}
            />
            Alphabetique
          </label>
          <label>
            <input
              type="radio"
              name="sortOrder"
              value="count"
              checked={sortOrder === "count"}
              onChange={() => setSortOrder("count")}
            />
            Frequence
          </label>
        </div>
      </div>

      <div className="index-data">
        <table>
          <thead>
            <tr>
              <th>Terme</th>
              <th>Documents</th>
              <th>TF-IDF</th>
            </tr>
          </thead>
          <tbody>
            {sortedTerms.map((term) => (
              <tr key={term}>
                <td>{term}</td>
                <td>{indexData[term].length}</td>
                <td>
                  <ul className="tfidf-list">
                    {indexData[term].map((doc, idx) => (
                      <li key={idx}>
                        {doc.document}: {doc.tfidf.toFixed(4)}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats">
        <p>Total de termes indexes: {terms.length}</p>
        <p>Termes affiches: {sortedTerms.length}</p>
      </div>
    </div>
  );
}

export default IndexViewer;
