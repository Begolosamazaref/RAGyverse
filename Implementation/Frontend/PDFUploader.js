// src/components/PDFUploader.js
import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

const PDFUploader = () => {
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [recordingPrompt, setRecordingPrompt] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState(null); // Store recognition instance

  // Handle PDF upload and text extraction
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      try {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          const arrayBuffer = fileReader.result;
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(' ');
            fullText += pageText + '\n';
          }

          setExtractedText(fullText || 'No text could be extracted.');
          setIsLoading(false);
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error extracting text:', error);
        setExtractedText('Failed to extract text. Please try another PDF.');
        setIsLoading(false);
      }
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  // Handle Voice Question
  const handleVoiceQuestion = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setVoiceError('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);
    setVoiceError('');
    setRecordingPrompt('Recording… Speak clearly now and click Stop when done.');
    setRecognitionInstance(recognition);

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(`Voice Question: ${transcript}`);
      setIsRecording(false);
      setRecordingPrompt('');
      setRecognitionInstance(null);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Error during speech recognition. Please try again.';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Speak louder and closer to the microphone.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not detected. Ensure your microphone is connected.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Allow microphone permissions in your browser.';
          break;
        case 'network':
          errorMessage = 'Network issue. Check your internet connection.';
          break;
        default:
          errorMessage = `Speech recognition error (${event.error}). Please try again.`;
      }
      setVoiceError(errorMessage);
      setIsRecording(false);
      setRecordingPrompt('');
      setRecognitionInstance(null);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setRecordingPrompt('');
      setRecognitionInstance(null);
    };

    // Auto-stop after 10 seconds as fallback
    setTimeout(() => {
      if (isRecording) {
        recognition.stop();
        if (!question && !voiceError) {
          setVoiceError('No speech detected. Try speaking sooner and click Stop when done.');
        }
      }
    }, 10000);
  };

  // Handle Stop Recording
  const handleStopRecording = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      if (!question && !voiceError) {
        setVoiceError('No speech detected. Try speaking louder and sooner.');
      }
    }
  };

  // Handle Text Question
  const handleTextQuestionSubmit = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input').value.trim();
    if (input) {
      setQuestion(`Text Question: ${input}`);
      setShowTextInput(false);
    }
  };

  // Clear prompt when recording stops
  useEffect(() => {
    if (!isRecording) {
      setRecordingPrompt('');
    }
  }, [isRecording]);

  return (
    <div className="pdf-uploader">
      <h2>Extract Text with RAGyverse</h2>
      <div className="upload-container">
        <label className="upload-label">
          <svg
            width="32"
            height="32"
            fill="none"
            stroke="#4f46e5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16V12m0 0V8m0 4H3m4 0h14m-7 4v4m0 0H9m3 0h3"
            />
          </svg>
          <span>Upload a PDF</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {isLoading && <p className="loading">Extracting text, please wait...</p>}
      {extractedText && (
        <div className="text-output">
          <h3>Extracted Text:</h3>
          <pre>{extractedText}</pre>
          {/* Question Buttons */}
          <div className="question-buttons">
            <button
              onClick={handleVoiceQuestion}
              disabled={isRecording}
              className="question-button voice-button"
            >
              {isRecording ? 'Recording...' : 'Voice Question'}
            </button>
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="question-button text-button"
            >
              {showTextInput ? 'Cancel' : 'Text Question'}
            </button>
            {isRecording && (
              <button
                onClick={handleStopRecording}
                className="question-button stop-button"
              >
                Stop Recording
              </button>
            )}
          </div>
          {/* Voice Recording Prompt */}
          {recordingPrompt && <p className="recording-prompt">{recordingPrompt}</p>}
          {/* Voice Error Message */}
          {voiceError && <p className="voice-error">{voiceError}</p>}
          {/* Text Input for Questions */}
          {showTextInput && (
            <form onSubmit={handleTextQuestionSubmit} className="text-input-form">
              <input
                type="text"
                placeholder="Type your question here..."
                className="text-input"
                autoFocus
              />
              <button type="submit" className="submit-button">
                Submit
              </button>
            </form>
          )}
          {/* Display Question */}
          {question && (
            <div className="question-output">
              <h3>Your Question:</h3>
              <p>{question}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFUploader;