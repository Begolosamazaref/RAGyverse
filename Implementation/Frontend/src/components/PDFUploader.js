import React, { useState, useEffect, useRef } from 'react';

const PDFUploader = ({ token }) => { // Add token as a prop
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [error, setError] = useState('');
  const [recordingPrompt, setRecordingPrompt] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Backend URL (for the original Flask backend)
  const BACKEND_URL = 'https://0071-34-82-240-112.ngrok-free.app'; // Replace with your actual ngrok URL

  // TTS Server URL (for the new tts_server.py)
  const TTS_SERVER_URL = 'http://localhost:5001'; // Adjust if running on a different host/port

  // Handle PDF upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setIsLoading(true);
    setError('');
    setExtractedText('');
    setAnswer('');
    setAudioUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload_pdf`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setExtractedText(data.text || 'No text extracted.');
      } else {
        setError(data.error || 'Failed to process PDF.');
      }
    } catch (err) {
      console.error('Error uploading PDF:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert answer to speech using the TTS server
  const convertAnswerToSpeech = async (answerText) => {
    console.log("[DEBUG] Attempting TTS conversion...");
    console.log("[DEBUG] Using token:", token); // Check if token exists
    
    if (!token) {
      setError("You need to be logged in to use TTS");
      return;
    }
  
    setIsLoading(true);
    setError("");

    try {
      console.log("[DEBUG] Sending to:", `${TTS_SERVER_URL}/convert_to_speech`);
      
      const response = await fetch(`${TTS_SERVER_URL}/convert_to_speech`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`  // Use the token prop
        },
        body: JSON.stringify({ 
          text: answerText,
          question: question // Include the question in the request
        }),
      });

      console.log("[DEBUG] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "TTS server error");
      }

      const data = await response.json();
      console.log("[DEBUG] TTS Response:", data);

      if (!data.audio_url) {
        throw new Error("Server didn't return an audio URL");
      }

      // Construct full URL
      const fullAudioUrl = `${TTS_SERVER_URL}${data.audio_url}`;
      console.log("[DEBUG] Audio URL:", fullAudioUrl);

      // Test if audio is playable
      const audio = new Audio(fullAudioUrl);
      audio.onerror = () => {
        throw new Error("Failed to load audio");
      };
      
      // Play the audio to verify
      await audio.play();
      audio.pause(); // Pause immediately after testing

      // Update state if successful
      setAudioUrl(fullAudioUrl);

    } catch (err) {
      console.error("[ERROR] TTS Failed:", err);
      setError("TTS Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Voice Question
  const handleVoiceQuestion = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError('Your browser does not support audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'question.webm');

        setIsRecording(false);
        setRecordingPrompt('');
        setError('');

        try {
          const response = await fetch(`${BACKEND_URL}/ask_audio1`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();

          if (response.ok) {
            setQuestion(data.question); // Use the question from the response
            setAnswer(data.answer);
            // Convert the answer to speech using the TTS server
            await convertAnswerToSpeech(data.answer);
          } else {
            setError(data.error || 'Failed to process audio question.');
          }
        } catch (err) {
          console.error('Error processing audio:', err);
          setError('Network error. Please try again.');
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      setIsRecording(true);
      setRecordingPrompt('Recording… Speak clearly and click Stop when done.');
      mediaRecorderRef.current.start();

      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          if (!answer) {
            setError('No speech detected. Try speaking louder.');
          }
        }
      }, 10000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or unavailable.');
      setIsRecording(false);
      setRecordingPrompt('');
    }
  };

  // Handle Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle Text Question
  const handleTextQuestionSubmit = async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input').value.trim();
    if (!input) {
      setError('Please enter a question.');
      return;
    }

    setShowTextInput(false);
    setError('');
    setAnswer('');
    setAudioUrl('');

    try {
      const response = await fetch(`${BACKEND_URL}/ask_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      const data = await response.json();

      if (response.ok) {
        setQuestion(data.question); // Use the question from the response
        setAnswer(data.answer);
        // Convert the answer to speech using the TTS server
        await convertAnswerToSpeech(data.answer);
      } else {
        setError(data.error || 'Failed to process question.');
      }
    } catch (err) {
      console.error('Error submitting text question:', err);
      setError('Network error. Please try again.');
    }
  };

  // Handle Session Reset
  const handleResetSession = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/reset_session`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setExtractedText('');
        setQuestion('');
        setAnswer('');
        setAudioUrl('');
        setError('');
        alert('Session reset successfully.');
      } else {
        setError(data.error || 'Failed to reset session.');
      }
    } catch (err) {
      console.error('Error resetting session:', err);
      setError('Network error. Please try again.');
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
      {isLoading && <p className="loading">Processing PDF, please wait...</p>}
      {error && <p className="error">{error}</p>}
      {extractedText && (
        <div className="text-output">
          <h3>Extracted Text:</h3>
          <pre>{extractedText}</pre>
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
            <button
              onClick={handleResetSession}
              className="question-button reset-button"
            >
              Reset Session
            </button>
          </div>
          {recordingPrompt && <p className="recording-prompt">{recordingPrompt}</p>}
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
          {question && (
            <div className="question-output">
              <h3>Your Question:</h3>
              <p>{question}</p>
            </div>
          )}
          {answer && (
            <div className="answer-output">
              <h3>Answer:</h3>
              <p>{answer}</p>
              {audioUrl && (
                <div className="audio-player">
                  <audio controls src={audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFUploader;