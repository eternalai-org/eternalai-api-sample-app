import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const [apiKey, setApiKey] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [promptCount, setPromptCount] = useState(4);
  const [prompts, setPrompts] = useState(Array(4).fill(""));
  const [loading, setLoading] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(Array(4).fill(false));
  
  // New states for questions mode
  const [mode, setMode] = useState("prompts"); // "prompts" or "questions"
  const [topic, setTopic] = useState("");
  const [difficulties, setDifficulties] = useState(Array(4).fill(1));
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questionsText, setQuestionsText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [bg, setBg] = useState(null);
  
  const navigate = useNavigate();

  // Load prompt suggestions on mount
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get("/api/prompts");
        if (res.data.prompts) {
          setPromptSuggestions(res.data.prompts);
        }
      } catch (err) {
        console.error("Failed to load prompt suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  // Load default background
  React.useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/default-background");
        setBg(res.data?.image || null);
      } catch (e) {
        console.warn("Failed to load default background", e);
      }
    })();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handlePromptCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setPromptCount(count);
    setPrompts(Array(count).fill(""));
    setDifficulties(Array(count).fill(1));
  };

  const handleDifficultyChange = (index, value) => {
    let num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 10) {
      num = 1;
    }
    const newDifficulties = [...difficulties];
    newDifficulties[index] = num;
    setDifficulties(newDifficulties);
  };

  const handleQuestionsTextChange = (e) => {
    const text = e.target.value;
    setQuestionsText(text);
    
    // Validate JSON in real-time
    try {
      const parsed = JSON.parse(text);
      
      // Check if it's an array
      if (!Array.isArray(parsed)) {
        setJsonError("❌ JSON must be an array");
        return;
      }
      
      // Validate structure of each question
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];
        if (!q.id || !q.question || !q.options || !q.answer) {
          setJsonError(`❌ Question ${i + 1} missing required fields (id, question, options, answer)`);
          return;
        }
        if (!Array.isArray(q.options)) {
          setJsonError(`❌ Question ${i + 1}: options must be an array`);
          return;
        }
        if (q.options.length !== 4) {
          setJsonError(`❌ Question ${i + 1}: must have exactly 4 options`);
          return;
        }
      }
      
      // JSON is valid, update the questions
      setGeneratedQuestions(parsed);
      setJsonError("");
    } catch (err) {
      setJsonError(`❌ Invalid JSON: ${err.message}`);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!topic || !apiKey) {
      return;
    }

    try {
      setGeneratingQuestions(true);
      const form = new FormData();
      form.append("api_key", apiKey);
      form.append("topic", topic);
      form.append("num_questions", promptCount);
      difficulties.forEach((d) => form.append("difficulties", d));

      const res = await axios.post("/api/generate-questions", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setGeneratedQuestions(res.data.questions);
        setQuestionsText(JSON.stringify(res.data.questions, null, 2));
        setJsonError("");
      }
    } catch (err) {
      console.error("❌ Generate questions error:", err);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!characterName || !apiKey || !image) {
      return;
    }

    if (mode === "prompts") {
      if (prompts.some((p) => p.trim() === "")) {
        return;
      }
    } else {
      if (!generatedQuestions || generatedQuestions.length === 0) {
        return;
      }
    }

    const form = new FormData();
    form.append("name", characterName);
    form.append("api_key", apiKey);
    prompts.forEach((p) => form.append("prompts", p));
    form.append("image", image);
    
    // Add questions JSON if in questions mode
    if (mode === "questions" && generatedQuestions) {
      form.append("questions_json", JSON.stringify(generatedQuestions));
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Upload success:", res.data);
      navigate("/");
    } catch (err) {
      console.error("❌ Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        color: "#F2F2F2",
        background: "#0a0a1a",
        backgroundImage: bg ? `url(${bg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      {/* Left column: character info */}
      <div
        style={{
          width: "48%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "#555",
            border: "none",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1.5rem",
          }}
        >
          ⬅️ Back to Home
        </button>

        <h1 style={{ marginBottom: "1.4rem", fontSize: "49px", color: "#FFFFFF" }}>Erotic Saga</h1>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          {/* Enter API Key */}
          <h3 style={{ marginBottom: "6px", fontSize: "16.8px" }}>
            API Key
          </h3>
          <input
            type="password"
            placeholder="Enter API Key..."
            onChange={(e) => setApiKey(e.target.value)}
            value={apiKey}
            required
            style={{
              marginBottom: "10.5px",
              padding: "5.6px",
              width: "100%",
              fontSize: "16.8px",
              borderRadius: "6px",
              border: "1px solid #FF0F87",
              background: "rgba(20,20,20,0.8)",
              color: "#F2F2F2",
              boxShadow: "0 0 10px #FF004C",
            }}
          />

          {/* Enter character name */}
          <h3 style={{ marginBottom: "6px", fontSize: "16.8px" }}>
            Character Name
          </h3>
          <input
            type="text"
            placeholder="Enter character name..."
            onChange={(e) => setCharacterName(e.target.value)}
            value={characterName}
            required
            style={{
              marginBottom: "10.5px",
              padding: "5.6px",
              width: "100%",
              fontSize: "16.8px",
              borderRadius: "6px",
              border: "1px solid #FF0F87",
              background: "rgba(20,20,20,0.8)",
              color: "#F2F2F2",
              boxShadow: "0 0 10px #FF004C",
            }}
          />

          {/* Choose character image */}
          <h3 style={{ marginBottom: "6px", fontSize: "16.8px" }}>
            Character Image
          </h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
            style={{
              marginBottom: "10.5px",
              padding: "5.6px",
              fontSize: "16.8px",
              background: "rgba(20,20,20,0.8)",
              borderRadius: "6px",
              border: "1px solid #FF0F87",
              color: "#F2F2F2",
              boxShadow: "0 0 10px #FF004C",
            }}
          />

          {imagePreview && (
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: "80%",
                  maxHeight: "700px",
                  objectFit: "contain",
                  borderRadius: "8px",
                border: "1px solid #e50914",
                }}
              />
            </div>
          )}
        </form>
      </div>

      {/* Right column: prompts/questions and submit button */}
      <div
        style={{
          width: "48%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2 style={{ width: "100%", marginTop: "14px", fontSize: "16.8px" }}>
          Enter the number of prompts (equal to number of questions)
        </h2>
        
        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "14px",
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("prompts")}
            style={{
              flex: 1,
              padding: "7px",
              background: mode === "prompts" ? "#FF0F87" : "transparent",
              border: mode === "prompts" ? "1px solid #FF0F87" : "1px solid #F2F2F2",
              borderRadius: "6px",
              color: "#F2F2F2",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: mode === "prompts" ? "0 0 10px #FF004C" : undefined,
            }}
          >
            Prompts
          </button>
          <button
            type="button"
            onClick={() => setMode("questions")}
            style={{
              flex: 1,
              padding: "7px",
              background: mode === "questions" ? "#FF0F87" : "transparent",
              border: mode === "questions" ? "1px solid #FF0F87" : "1px solid #F2F2F2",
              borderRadius: "6px",
              color: "#F2F2F2",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: mode === "questions" ? "0 0 10px #FF004C" : undefined,
            }}
          >
            Questions
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          {/* Number of prompts/questions */}
          <input
            type="number"
            min="1"
            placeholder="Number of prompts"
            onChange={handlePromptCountChange}
            value={promptCount}
            style={{
              marginBottom: "7px",
              padding: "5.6px",
              width: "100%",
              fontSize: "16.8px",
              borderRadius: "6px",
              border: "1px solid #FF0F87",
              background: "rgba(20,20,20,0.8)",
              color: "#F2F2F2",
              boxShadow: "0 0 10px #FF004C",
            }}
          />

          {/* Prompts Mode */}
          {mode === "prompts" && (
            <>
              {prompts.map((p, i) => (
                <div key={i} style={{ marginBottom: "5.6px", position: "relative" }}>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
                    <input
                      type="text"
                      placeholder={`Prompt ${i + 1}`}
                      value={p}
                      onChange={(e) => {
                        const copy = [...prompts];
                        copy[i] = e.target.value;
                        setPrompts(copy);
                      }}
                      required
                      style={{
                        flex: 1,
                        padding: "5.6px",
                        fontSize: "16.8px",
                        borderRadius: "6px",
                        border: "1px solid #FF0F87",
                        background: "rgba(20,20,20,0.8)",
                        color: "#F2F2F2",
                        boxShadow: "0 0 10px #FF004C",
                      }}
                    />
                    {promptSuggestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          // Close all other suggestions first
                          const newShow = Array(prompts.length).fill(false);
                          // Toggle the clicked button's suggestion
                          newShow[i] = !showSuggestions[i];
                          setShowSuggestions(newShow);
                        }}
                        style={{
                          padding: "5.6px 10.5px",
                          background: showSuggestions[i] ? "#FF0F87" : "transparent",
                          border: showSuggestions[i] ? "1px solid #FF0F87" : "1px solid #F2F2F2",
                          borderRadius: "6px",
                          color: "#F2F2F2",
                          cursor: "pointer",
                          fontSize: "12.6px",
                          whiteSpace: "nowrap",
                          boxShadow: showSuggestions[i] ? "0 0 10px #FF004C" : undefined,
                        }}
                      >
                        💡 Suggestions
                      </button>
                    )}
                  </div>
                  {showSuggestions[i] && promptSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: "#1f1f2e",
                        border: "2px solid #FF0F87",
                        borderRadius: "6px",
                        maxHeight: "140px",
                        overflowY: "auto",
                        marginTop: "5px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      {promptSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const copy = [...prompts];
                            copy[i] = suggestion;
                            setPrompts(copy);
                            const newShow = [...showSuggestions];
                            newShow[i] = false;
                            setShowSuggestions(newShow);
                          }}
                          style={{
                            padding: "7px",
                            cursor: "pointer",
                            fontSize: "12.6px",
                            borderBottom: idx < promptSuggestions.length - 1 ? "1px solid #444" : "none",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#FF0F87";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "transparent";
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Questions Mode */}
          {mode === "questions" && (
            <>
              {/* Topic input */}
              <h3 style={{ marginTop: "7px", marginBottom: "5.6px", fontSize: "14px" }}>
                Topic for Questions
              </h3>
              <input
                type="text"
                placeholder="e.g., Science, History, General Knowledge"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                style={{
                  marginBottom: "10.5px",
                  padding: "5.6px",
                  width: "100%",
                  fontSize: "14px",
                  borderRadius: "6px",
                  border: "1px solid #FF0F87",
                  background: "rgba(20,20,20,0.8)",
                  color: "#F2F2F2",
                  boxShadow: "0 0 10px #FF004C",
                }}
              />

              {/* Difficulty levels */}
              <h3 style={{ marginTop: "7px", marginBottom: "5.6px", fontSize: "14px" }}>
                Difficulty Levels (1-10)
              </h3>
              {difficulties.map((difficulty, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px", width: "84px" }}>
                    Question {i + 1}:
                  </span>
                  <input
                    type="number"
                    value={difficulty}
                    onChange={(e) => handleDifficultyChange(i, e.target.value)}
                    onBlur={(e) => handleDifficultyChange(i, e.target.value)}
                    placeholder="Enter 1-10"
                    style={{
                      width: "56px",
                      padding: "5.6px",
                      fontSize: "12.6px",
                      borderRadius: "6px",
                      border: "1px solid #FF0F87",
                      background: "rgba(20,20,20,0.8)",
                      color: "#F2F2F2",
                      boxShadow: "0 0 10px #FF004C",
                    }}
                  />
                  <select
                    value={difficulty}
                    onChange={(e) => handleDifficultyChange(i, e.target.value)}
                    style={{
                      flex: 1,
                      padding: "5.6px",
                      fontSize: "12.6px",
                      borderRadius: "6px",
                      border: "1px solid #FF0F87",
                      background: "#1f1f2e",
                      color: "#F2F2F2",
                      cursor: "pointer",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <option key={level} value={level}>
                        Level {level} {level <= 3 ? "(Easy)" : level <= 6 ? "(Medium)" : "(Hard)"}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Generate Questions button */}
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={generatingQuestions}
                style={{
                  marginTop: "10.5px",
                  padding: "7px",
                  background: "#FF0F87",
                  border: "1px solid #FF0F87",
                  borderRadius: "6px",
                  color: "#F2F2F2",
                  cursor: generatingQuestions ? "not-allowed" : "pointer",
                  fontSize: "16.8px",
                  fontWeight: "bold",
                  boxShadow: "0 0 10px #FF004C",
                }}
              >
                {generatingQuestions ? "⏳ Generating..." : "🤖 Generate Questions"}
              </button>

              {/* Questions JSON Preview */}
              {generatedQuestions && questionsText && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ marginBottom: "7px", fontSize: "14px" }}>
                    📋 Edit Questions (JSON format):
                  </h3>
                  {jsonError && (
                    <div
                      style={{
                        padding: "7px",
                        marginBottom: "7px",
                        background: "#ff4444",
                        color: "#fff",
                        borderRadius: "6px",
                        fontSize: "12.6px",
                      }}
                    >
                      {jsonError}
                    </div>
                  )}
                  {!jsonError && generatedQuestions && (
                    <div
                      style={{
                        padding: "7px",
                        marginBottom: "7px",
                        background: "#FF0F87",
                        color: "#F2F2F2",
                        borderRadius: "6px",
                        fontSize: "12.6px",
                        boxShadow: "0 0 10px #FF004C",
                      }}
                    >
                      ✅ Valid JSON ({generatedQuestions.length} questions)
                    </div>
                  )}
                  <textarea
                    value={questionsText}
                    onChange={handleQuestionsTextChange}
                    style={{
                      width: "100%",
                      minHeight: "280px",
                      padding: "7px",
                      fontSize: "14px",
                      background: jsonError ? "#2d1f1f" : "#1a1a2e",
                      color: "#fff",
                      border: jsonError ? "2px solid #ff4444" : "1px solid #FF0F87",
                      borderRadius: "6px",
                      fontFamily: "monospace",
                      overflow: "auto",
                      resize: "vertical",
                    }}
                  />
                  <p style={{ marginTop: "5px", fontSize: "18px", color: "#888" }}>
                    💡 Edit the JSON above. Each question needs: id, question, options (4 items), answer
                  </p>
                </div>
              )}
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || generatingQuestions}
            style={{
              marginTop: "7px",
              padding: "5.6px",
              background: "#FF0F87",
              border: "1px solid #FF0F87",
              borderRadius: "6px",
              color: "#F2F2F2",
              cursor: loading || generatingQuestions ? "not-allowed" : "pointer",
              fontSize: "40px",
              width: "100%",
              boxShadow: "0 0 10px #FF004C",
            }}
          >
            {loading ? "⏳ Uploading..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
