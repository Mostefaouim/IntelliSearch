import { useState } from "react";

function FileUpload({ onFilesLoaded, onIndexed, loadedFiles }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setMessage("Chargement des fichiers...");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.documents.length} fichiers charges avec succès.`);
        onFilesLoaded(data.documents);
      } else {
        setMessage(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Erreur de connexion au serveur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndexing = async () => {
    setIsIndexing(true);
    setMessage("Indexation des documents...");

    try {
      const response = await fetch("http://localhost:5000/api/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Indexation terminee: ${data.terms_count} termes indexes.`);
        onIndexed(data.index);
      } else {
        setMessage(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Erreur de connexion au serveur: ${error.message}`);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="file-upload">
      <h2>Chargement des Documents</h2>

      <div className="upload-controls">
        <input
          type="file"
          id="fileInput"
          multiple
          accept=".txt"
          onChange={handleFileChange}
          disabled={isLoading}
          style={{ display: "none" }}
        />
        <label htmlFor="fileInput" className="button">
          Selectionner des fichiers
        </label>

        <button
          onClick={handleIndexing}
          disabled={isIndexing || loadedFiles.length === 0}
          className="button"
        >
          Indexer
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {loadedFiles.length > 0 && (
        <div className="files-list">
          <h3>Fichiers charges:</h3>
          <ul>
            {loadedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
