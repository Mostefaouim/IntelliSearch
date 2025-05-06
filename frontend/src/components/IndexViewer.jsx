import { useState } from "react";

function IndexViewer({ indexData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("alpha");

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

  const allDocuments = Array.from(
    new Set(
      Object.values(indexData || {}).flat().map((doc) => doc.document)
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));  
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
              <th>Term</th>
              {allDocuments.map((docId) => (
                <th key={docId}>{docId}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTerms.map((term) => (
              <tr key={term}>
                <td>{term}</td>
                {allDocuments.map((docId) => {
                  const docEntry = indexData[term]?.find(
                    (d) => d.document === docId
                  );
                  const value = docEntry && docEntry.tfidf > 0 ? docEntry.tfidf.toFixed(2) : "0";
                    return (
                    <td key={docId} className={value !== "0" ? "highlight" : ""}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      <div className="stats">
        <p>Total de termes indexés : {terms.length}</p>
        <p>Termes affichés : {sortedTerms.length}</p>
      </div>
    </div>
  );
}  
export default IndexViewer;
