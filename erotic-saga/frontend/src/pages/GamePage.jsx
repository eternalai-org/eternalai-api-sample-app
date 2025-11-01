import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GamePage() {
  const [qid, setQid] = useState(1);
  const [question, setQuestion] = useState(null);
  const [image, setImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [isWin, setIsWin] = useState(false); // ✅ Add win state
  const [showGameOver, setShowGameOver] = useState(false);
  const characterId = Number(localStorage.getItem("selectedCharacterId")) || 1;
  const [bg, setBg] = useState(null);

  const fetchQuestion = async (id) => {
    const form = new FormData();
    form.append("character_id", characterId);

    const res = await axios.post(`/api/question/${id}`, form);
    setQuestion(res.data.question);
    setImage(res.data.image);
    setAnswer("");
    setIsWin(false);
  };

  useEffect(() => {
    fetchQuestion(1);
  }, []);

  // Load default background
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/default-background");
        setBg(res.data?.image || null);
      } catch (err) {
        console.warn("Failed to load default background", err);
      }
    })();
  }, []);

  useEffect(() => {
    setAnswer("");
  }, [qid]);

  const handleAnswer = async () => {
    const form = new FormData();
    form.append("question_id", qid);
    form.append("answer", answer);
    form.append("character_id", characterId);

    const res = await axios.post("/api/answer", form);

    if (res.data.correct) {
      // If there are still remaining questions
      if (res.data.next_question) {
        setQid(res.data.next_question.id);
        setQuestion(res.data.next_question);
        setImage(res.data.next_image);
      } else {
        // ✅ When the player wins
        setIsWin(true);
        setImage(res.data.next_image); // display final image
        setQuestion(null); // hide question + answer button
      }
    } else {
      setShowGameOver(true);
    }
  };

  // Loading state
  if (!question && !isWin) return <p>Loading...</p>;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#0a0a1a",
        backgroundImage: bg ? `url(${bg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
      }}
    >
      {showGameOver && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#141414",
              border: "1px solid #FF0F87",
              boxShadow: "0 0 20px #FF004C",
              borderRadius: "12px",
              width: "min(90vw, 520px)",
              padding: "24px",
              color: "#F2F2F2",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "12px" }}>
              Game Over
            </div>
            <div style={{ fontSize: "1.6rem", color: "#C0C0C0" }}>
            You selected the wrong answer. Try again later!
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                marginTop: "20px",
                padding: "14px 48px",
                borderRadius: "999px",
                border: "1px solid #FF0F87",
                backgroundColor: "#FF0F87",
                color: "#F2F2F2",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
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
              OK
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "transparent",
          border: "1px solid rgba(242, 242, 242, 0.12)",
          color: "#F2F2F2",
          padding: "10px 20px",
          borderRadius: "999px",
          cursor: "pointer",
          fontSize: "15px",
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
        ⬅️ Back to Home
      </button>

      <div
        style={{
          backgroundColor: "#222",
          backgroundImage: bg ? `url(${bg})` : undefined,
          backgroundSize: "full",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "12px",
          padding: "1.4rem",
          textAlign: "center",
          width: "1960px",
          height: "910px",
          color: "#F2F2F2",
        }}
      >
        {image && (
          <img
            src={image}
            alt="question"
            style={{
              maxWidth: "630px",
              height: "630px",
              objectFit: "contain",
              borderRadius: "12px",
              background: "#fff",
            }}
          />
        )}

        {/* If player has won */}
        {isWin ? (
          <div
            style={{
              marginTop: "2rem",
              color: "#C0C0C0",
              fontSize: "3rem",
              fontWeight: "700",
            }}
          >
            🎉 You’ve completed all the questions! 🎉
          </div>
        ) : (
          <>
            {/* Question */}
            <div
              style={{
                backgroundColor: "rgba(20,20,20,0.8)",
                color: "#F2F2F2",
                borderRadius: "6px",
                marginTop: "1.05rem",
                padding: "0.56rem",
                fontSize: "1.4rem",
                fontWeight: "600",
                border: "1px solid #FF0F87",
                boxShadow: "0 0 10px #FF004C",
              }}
            >
              {question.question}
            </div>

            {/* Options */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.7rem",
                marginTop: "0.84rem",
              }}
            >
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswer(opt)}
                  style={{
                    backgroundColor: answer === opt ? "#FF0F87" : "rgba(20,20,20,0.8)",
                    border: `1px solid ${answer === opt ? '#FF0F87' : '#F2F2F2'}`,
                    color: "#F2F2F2",
                    borderRadius: "4px",
                    padding: "0.56rem",
                    fontSize: "1.4rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: answer === opt ? "0 0 10px #FF004C" : undefined,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={handleAnswer}
              style={{
                marginTop: "16px",
                padding: "14px 48px",
                borderRadius: "999px",
                border: "1px solid #FF0F87",
                backgroundColor: "#FF0F87",
                color: "#F2F2F2",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
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
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
