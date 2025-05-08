import { useState } from "react";

function FileUpload({ onFilesLoaded, onIndexed, loadedFiles }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [message, setMessage] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL ;

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setMessage("Uploading files...");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.documents.length} files uploaded successfully.`);
        onFilesLoaded(data.documents);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Server connection error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndexing = async () => {
    setIsIndexing(true);
    setMessage("Indexing documents...");

    try {
      const response = await fetch(`${backendUrl}/api/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Indexing completed: ${data.terms_count} terms indexed.`);
        onIndexed(data.index);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Server connection error: ${error.message}`);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="file-upload">
      <h2>Document Upload</h2>

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
          Select Files
        </label>

        <button
          onClick={handleIndexing}
          disabled={isIndexing || loadedFiles.length === 0}
          className="button"
        >
          Index
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {loadedFiles.length > 0 && (
        <div className="files-list">
          <h3>Uploaded Files:</h3>
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
