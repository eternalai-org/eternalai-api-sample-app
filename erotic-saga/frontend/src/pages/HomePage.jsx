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
  const [currentMode, setCurrentMode] = useState("startGame"); // "startGame" or "addCharacter"

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

  // Auto-load characters on mount
  React.useEffect(() => {
    handleStartGame();
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
        position: "relative",
      }}
    >
      <h1 style={{ fontSize: "2.8rem", marginTop: "0.7rem", color: "#C0C0C0" }}>
        🎮 Erotic Saga
      </h1>

      {/* --- Mode switch button (top right) --- */}
      {!showPasswordBox && (
        <button
          onClick={() => {
            if (currentMode === "startGame") {
              setShowCharacters(false);
              setShowPasswordBox(true);
              setCurrentMode("addCharacter");
            } else {
              setShowPasswordBox(false);
              setShowCharacters(false);
              setCurrentMode("startGame");
              handleStartGame();
            }
          }}
          style={{
            position: "absolute",
            color: "#ffffff",
            top: "20px",
            right: "20px",
            padding: "14px 48px",
            background: currentMode === "startGame" ? "#FF0F87" : "#4CAF50",
            border: `1px solid ${currentMode === "startGame" ? "#FF0F87" : "#4CAF50"}`,
            borderRadius: "999px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: currentMode === "startGame" ? "0 4px 16px rgba(255, 0, 76, 0.4)" : "0 4px 16px rgba(46, 125, 50, 0.4)",
            zIndex: 1000,
            transition: "all 0.2s",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            if (currentMode === "startGame") {
              e.target.style.background = "#ff2b9e";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(255, 0, 76, 0.6)";
            } else {
              e.target.style.background = "#66bb6a";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(46, 125, 50, 0.6)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode === "startGame") {
              e.target.style.background = "#FF0F87";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 16px rgba(255, 0, 76, 0.4)";
            } else {
              e.target.style.background = "#4CAF50";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 16px rgba(46, 125, 50, 0.4)";
            }
          }}
        >
          {currentMode === "startGame" ? "➕ Add New Character" : "🎯 Start Game"}
        </button>
      )}

      {/* --- Loading --- */}
      {loading && <p>⏳ Processing...</p>}

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
              padding: "12px 16px",
              fontSize: "15px",
              borderRadius: "10px",
              width: "280px",
              border: "1px solid rgba(255, 15, 135, 0.12)",
              background: "rgba(20, 20, 20, 0.8)",
              color: "#F2F2F2",
              outline: "none",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#FF0F87";
              e.target.style.background = "rgba(20, 20, 20, 0.95)";
              e.target.style.boxShadow = "0 0 0 3px rgba(255, 15, 135, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 15, 135, 0.12)";
              e.target.style.background = "rgba(20, 20, 20, 0.8)";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleVerifyPassword}
              style={{
                padding: "14px 48px",
                background: "#FF0F87",
                border: "1px solid #FF0F87",
                borderRadius: "999px",
                color: "#F2F2F2",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#ff2b9e";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(255, 0, 76, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#FF0F87";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(255, 0, 76, 0.4)";
              }}
            >
              ✅ Confirm
            </button>

            <button
              onClick={() => {
                setShowPasswordBox(false);
                setCurrentMode("startGame");
                handleStartGame();
              }}
              style={{
                padding: "14px 48px",
                background: "transparent",
                border: "1px solid rgba(242, 242, 242, 0.12)",
                borderRadius: "999px",
                color: "#F2F2F2",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#FF0F87";
                e.target.style.background = "rgba(255, 15, 135, 0.1)";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(242, 242, 242, 0.12)";
                e.target.style.background = "transparent";
                e.target.style.color = "#F2F2F2";
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
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 15, 135, 0.2)",
                borderRadius: "16px",
                padding: "1rem",
                textAlign: "center",
                cursor: "pointer",
                overflow: "hidden",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 40px rgba(255, 15, 135, 0.15)",
                transition: "all 0.3s ease",
                willChange: "transform",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#FF0F87";
                e.target.style.boxShadow = "0 0 60px rgba(255, 15, 135, 0.3)";
                e.target.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(255, 15, 135, 0.2)";
                e.target.style.boxShadow = "0 0 40px rgba(255, 15, 135, 0.15)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <img
                src={char.image}
                alt={char.name}
                style={{
                  width: "100%",
                  height: "350px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={{ padding: "1rem" }}>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.2rem", fontWeight: "600" }}>
                  {char.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
