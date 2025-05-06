import { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import IndexViewer from './components/IndexViewer';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';

function App() {
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [indexData, setIndexData] = useState(null);
  const [isIndexed, setIsIndexed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFilesLoaded = (files) => {
    setLoadedFiles(files);
    setIsIndexed(false);
    setIndexData(null);
    setSearchResults([]);
  };

  const handleIndexed = (data) => {
    setIndexData(data);
    setIsIndexed(true);
    setActiveTab('index');
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
    setActiveTab('search');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Moteur de Recherche TF-IDF</h1>
      </header>
      
      <nav className="App-nav">
        <button 
          className={activeTab === 'upload' ? 'active' : ''} 
          onClick={() => setActiveTab('upload')}
        >
          Chargement des Documents
        </button>
        <button 
          className={activeTab === 'index' ? 'active' : ''} 
          onClick={() => setActiveTab('index')}
          disabled={!isIndexed}
        >
          Visualisation de l'Index
        </button>
        <button 
          className={activeTab === 'search' ? 'active' : ''} 
          onClick={() => setActiveTab('search')}
          disabled={!isIndexed}
        >
          Recherche
        </button>
      </nav>
      
      <main className="App-main">
        {activeTab === 'upload' && (
          <FileUpload 
            onFilesLoaded={handleFilesLoaded} 
            onIndexed={handleIndexed}
            loadedFiles={loadedFiles}
          />
        )}
        
        {activeTab === 'index' && indexData && (
          <IndexViewer indexData={indexData} />
        )}
        
        {activeTab === 'search' && (
          <div className="search-container">
            <SearchForm 
              isIndexed={isIndexed} 
              onSearchResults={handleSearchResults} 
            />
            <SearchResults results={searchResults} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;