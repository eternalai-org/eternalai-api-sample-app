import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [showCharacters, setShowCharacters] = useState(false);

  // ✅ Verify admin password
  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("password", password);
      const res = await axios.post("/api/verify-password", form);
      if (res.data.valid) {
        navigate("/upload");
      }
    } catch (err) {
      console.error("Error verifying password:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get character list
  const handleStartGame = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/characters");
      console.log("Characters:", res.data);

      if (Array.isArray(res.data) && res.data.length > 0) {
        setCharacters(res.data);
        setShowCharacters(true);
      }
    } catch (err) {
      console.error("Error fetching characters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (charId) => {
    // Save character ID for GamePage to use
    localStorage.setItem("selectedCharacterId", charId);
    navigate("/game");
  };

  // Load default background
  const [bg, setBg] = useState(null);
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

  // ✅ Main interface
  return (
    <div
      style={{
        background: "#0a0a1a",
        backgroundImage: bg ? `url(${bg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#F2F2F2",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <h1 style={{ fontSize: "2.8rem", marginTop: "0.7rem", color: "#C0C0C0" }}>
        🎮 Erotic Saga
      </h1>

      {/* --- Loading --- */}
      {loading && <p>⏳ Processing...</p>}

      {/* --- When no selection yet --- */}
      {!showPasswordBox && !showCharacters && !loading && (
        <div style={{ display: "flex", gap: "1.4rem" }}>
          <button
            onClick={() => setShowPasswordBox(true)}
            style={{
              padding: "0.7rem 1.4rem",
              background: "#FF0F87",
              border: "1px solid #FF0F87",
              borderRadius: "8px",
              fontSize: "1.68rem",
              cursor: "pointer",
              boxShadow: "0 0 10px #FF004C",
            }}
          >
            ➕ Add New Character
          </button>

          <button
            onClick={handleStartGame}
            style={{
              padding: "0.7rem 1.4rem",
              background: "#FF0F87",
              border: "1px solid #FF0F87",
              borderRadius: "8px",
              fontSize: "1.68rem",
              cursor: "pointer",
              boxShadow: "0 0 10px #FF004C",
            }}
          >
            🎯 Start Game
          </button>
        </div>
      )}

      {/* --- Password input box --- */}
      {showPasswordBox && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <input
            type="password"
            placeholder="Enter admin password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleVerifyPassword(); 
              }
            }}
            style={{
              padding: "7px",
              fontSize: "1.4rem",
              borderRadius: "6px",
              width: "280px",
              border: "1px solid #FF0F87",
              background: "rgba(20,20,20,0.8)",
              color: "#F2F2F2",
              outline: "none",
              boxShadow: "0 0 10px #FF004C",
            }}
          />
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleVerifyPassword}
              style={{
                padding: "0.42rem 1.05rem",
                background: "#FF0F87",
                border: "1px solid #FF0F87",
                borderRadius: "6px",
                color: "#F2F2F2",
                cursor: "pointer",
                fontSize: "1.4rem",
                boxShadow: "0 0 10px #FF004C",
              }}
            >
              ✅ Confirm
            </button>

            <button
              onClick={() => setShowPasswordBox(false)}
              style={{
                padding: "0.42rem 1.05rem",
                background: "transparent",
                border: "1px solid #F2F2F2",
                borderRadius: "6px",
                color: "#F2F2F2",
                cursor: "pointer",
                fontSize: "1.4rem",
              }}
            >
              🔙 Back
            </button>
          </div>
        </div>
      )}

      {/* --- Character list --- */}
      {showCharacters && (
        <div
          style={{
            marginTop: "2rem",
            display: "grid",
            overflowX: "auto",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.05rem",
            width: "90%",
            maxWidth: "100vw",
          }}
        >
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => handleSelectCharacter(char.id)}
              style={{
                background: "#1f1f2e",
                borderRadius: "10px",
                padding: "1rem",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <img
                src={char.image}
                alt={char.name}
                style={{
                  width: "100%",
                  height: "350px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <h3 style={{ marginTop: "0.56rem", color: "#fff", fontSize: "1.2rem" }}>{char.name}</h3>
            </div>
          ))}

          <button
            onClick={() => setShowCharacters(false)}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              background: "#555",
              border: "none",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.05rem",
            }}
          >
            🔙 Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
