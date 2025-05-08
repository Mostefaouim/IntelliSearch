# IntelliSearch: A TF IDF Information Retrieval Engine

This application allows you to load textual documents, index them using the TF-IDF (Term Frequency-Inverse Document Frequency) method, and perform searches within these documents.

## Features

- Load text files (.txt) via a graphical interface
- Text preprocessing:
   - Normalization (lowercase, removal of special characters)
   - Stopword removal
   - Stemming (reducing words to their root form)
- TF-IDF index calculation
- Index visualization
- Text query search
- Choice between two similarity methods:
   - Cosine similarity
   - Euclidean distance
- Display of results sorted by relevance

## Project Structure

```
TP_RI/
├── backend/
│   ├── app.js               # Express.js API and business logic
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js    # File upload component
│   │   │   ├── IndexViewer.js   # Index visualization component
│   │   │   ├── SearchForm.js    # Search form
│   │   │   └── SearchResults.js # Search results display
│   │   ├── App.js           # Main component
│   │   ├── App.css          # CSS styles
│   │   └── index.js         # React entry point
│   ├── package.json         # Dependencies
└── README.md                # This file
```

## Installation and Execution

### Prerequisites

- Node.js 14+
- npm or yarn

### Backend Installation

1. Navigate to the backend folder:

    ```
    cd backend
    ```

2. Install dependencies:

    ```
    npm init -y

    npm install express cors multer natural stopword nodemon
    ```

3. Create an uploads folder at the project root:
    ```
    mkdir uploads
    ```

4. Start the server:
    ```
    nodemon app.js
    ```
    The server will start at http://localhost:5000

### Frontend Installation

1. Navigate to the frontend folder:

    ```
    cd frontend
    ```

2. Install dependencies:

    ```
    npm install
    ```

    or

    ```
    yarn install
    ```

3. Start the application:
    ```
    npm start
    ```
    or
    ```
    yarn start
    ```
    The application will be accessible at http://localhost:3000

## User Guide

1. **Document Upload**

    - Click "Select Files" to upload one or more text files (.txt)
    - Once the files are uploaded, you will see the list of imported files
    - Click "Index" to start the TF-IDF indexing process

2. **Index Visualization**

    - After indexing, the application will redirect you to the "Index Visualization" tab
    - You can search for specific terms in the search bar
    - You can sort terms alphabetically or by frequency
    - The table displays each term with its TF-IDF scores for each document

3. **Search**
    - Go to the "Search" tab
    - Enter your query in the provided field
    - Choose the similarity method (Cosine or Euclidean)
    - Click "Search" to perform the search
    - The results will be displayed below, sorted in descending order of relevance

## Technical Explanations

### TF-IDF

TF-IDF (Term Frequency-Inverse Document Frequency) is a statistical method used in information retrieval to evaluate the importance of a term in a document relative to a collection of documents.

- **TF (Term Frequency)**: Measures the frequency of a term in a document.

   ```
   TF(t, d) = (Number of occurrences of t in d) / (Total number of terms in d)
   ```

- **IDF (Inverse Document Frequency)**: Measures the importance of the term in the entire collection.

   ```
   IDF(t) = log(Total number of documents / Number of documents containing t)
   ```

- **TF-IDF**: Combination of the two measures.
   ```
   TF-IDF(t, d) = TF(t, d) × IDF(t)
   ```

### Similarity Methods

- **Cosine Similarity**: Measures the angle between two vectors in a multidimensional space. The smaller the angle, the more similar the documents.

   ```
   cos(θ) = (q · d) / (||q|| × ||d||)
   ```

   where q is the query vector and d is the document vector.

- **Euclidean Distance**: Measures the "straight-line" distance between two vectors. The smaller the distance, the more similar the documents.
   ```
   d(q, d) = √(Σ(qi - di)²)
   ```
   where q is the query vector and d is the document vector.

### Text Preprocessing

1. **Normalization**:

    - Convert to lowercase to eliminate case differences
    - Remove non-alphanumeric characters (punctuation, symbols...)

2. **Stopword Removal**:

    - Eliminate stopwords or filler words (articles, prepositions, etc.)
    - These frequently occurring words provide little semantic value

3. **Stemming**:
    - Reduce words to their root form (e.g., "walking", "walked", "walks" → "walk")
    - Groups morphological variants of the same word

## Technical Architecture

### Backend (NodeJS / ExpressJS)

- Uses **ExpressJS** as a lightweight web framework
- **natural** library for natural language processing (stopwords, stemming)
- RESTful API with 3 main endpoints:
   - `/api/upload`: Handles text file uploads
   - `/api/index`: Performs TF-IDF indexing of documents
   - `/api/search`: Searches within indexed documents

### Frontend (React)

- User interface built with **React**
- Component-based architecture for better maintainability
- 4 main components:
   - `FileUpload`: Handles file uploads
   - `IndexViewer`: Displays the TF-IDF index
   - `SearchForm`: Allows query input and similarity method selection
   - `SearchResults`: Displays search results

## Detailed Code Functionality

### Backend (app.js)

The backend is built around the `TFIDFSearchEngine` class, which implements all indexing and search functionalities:

1. **Preprocessing**: The text undergoes several steps (normalization, tokenization, stopword removal, stemming).
2. **Indexing**: Calculates TF scores for each document, then IDF scores, and finally TF-IDF scores.
3. **Search**: The query undergoes the same preprocessing, and similarity scores are calculated between the query vector and each document.

The REST APIs expose these functionalities to the frontend:

- `/api/upload`: For uploading text files
- `/api/index`: For starting the indexing process
- `/api/search`: For performing searches

### Frontend (React)

The user interface is divided into React components:

1. `App.js`: Manages global state and navigation between tabs.
2. `FileUpload.js`: Handles file uploads and triggers indexing.
3. `IndexViewer.js`: Displays the TF-IDF index in a table with sorting and filtering features.
4. `SearchForm.js`: Allows users to input a query and select the similarity method.
5. `SearchResults.js`: Displays search results sorted by relevance.
