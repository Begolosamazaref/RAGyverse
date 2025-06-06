# RAGyverse

RAGyverse is an immersive Retrieval Augmented Generation (RAG) system that combines virtual reality with AI-powered document interaction. The project enables users to interact with documents through natural voice conversations in a VR environment.

## Project Overview

RAGyverse creates a seamless bridge between virtual reality and document analysis by allowing users to:
- Upload and process documents (PDFs)
- Ask questions about the documents using natural voice
- Receive AI-generated responses with voice synthesis
- Experience an immersive 3D avatar that responds with synchronized lip movements

## Repository Structure

The repository is organized into three main components:

```
RAGyverse/
├── Implementation/
│   ├── Backend/
│   │   └── RAGYVERSE.ipynb (Core RAG implementation)
│   ├── Frontend/
│   │   ├── tts_server.py (Text-to-Speech API)
│   │   ├── static/ (Audio files)
│   │   ├── src/ (React components)
│   │   ├── public/ (Static assets)
│   │   └── PDFUploader.js (Document upload component)
│   └── Unity/
│       ├── VoiceRecorder.cs.txt (Voice recording in Unity)
│       ├── AudioFetcher.cs.txt (Audio streaming in Unity)
│       ├── SavWav.cs.txt (WAV file handling)
│       └── 1toonteen.rar (3D avatar assets)
└── Paper/
    └── Paper.pdf 
```

## Components

### Backend (RAG System)

The backend is built using a Jupyter notebook (`RAGYVERSE.ipynb`) that implements:

1. **Document Processing**:
   - PDF parsing and text extraction
   - Text chunking and embedding generation
   - Vector database storage for efficient retrieval

2. **Question Answering**:
   - Speech-to-text conversion using Vosk
   - Vector similarity search for relevant document chunks
   - LLM-based answer generation using context from retrieved chunks
   - Text-to-speech conversion using gTTS

### Frontend (Web Interface)

The frontend provides a web interface for document upload and management:

1. **Document Upload**:
   - PDF file upload component
   - Document processing status tracking
   - Document management interface

2. **Text-to-Speech Server**:
   - Flask-based API for text-to-speech conversion
   - User authentication and history tracking
   - Audio file management

### Unity (VR Interface)

The Unity component creates an immersive VR experience:

1. **Voice Interaction**:
   - Microphone input capture
   - Audio recording and WAV file generation
   - API communication with backend

2. **Avatar Animation**:
   - 3D character rendering
   - Lip synchronization with audio responses
   - Immersive VR environment

## Setup and Installation

### Backend Setup

1. Open `RAGYVERSE.ipynb` in Google Colab or Jupyter
2. Install required dependencies:
   ```
   pip install flask pyngrok flask-cors vosk gTTS langchain-groq pymupdf python-docx gradio sounddevice numpy scipy ffmpeg-python transformers pydub langchain pdf2image pytesseract langchain-huggingface faiss-cpu groq langchain-community
   ```
3. Run all cells to start the backend server

### Frontend Setup

1. Navigate to the Frontend directory
2. Install dependencies:
   ```
   npm install
   ```
3. Start the TTS server:
   ```
   python tts_server.py
   ```
4. Start the React development server:
   ```
   npm start
   ```

### Unity Setup

1. Import the Unity project
2. Add the provided C# scripts to appropriate GameObjects
3. Configure the API endpoints in `VoiceRecorder.cs` to match your backend server
4. Import the avatar assets from `1toonteen.rar`

## Usage

1. Upload documents through the web interface
2. Put on your VR headset and launch the Unity application
3. Ask questions about your documents using your voice
4. Receive answers through the 3D avatar with synchronized lip movements

## Technologies Used

- **Backend**: Python, LangChain, Groq, PyMuPDF, Vosk, gTTS
- **Frontend**: React, Flask, MongoDB
- **VR**: Unity, uLipSync
