import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useSchool } from "../contexts/SchoolContext";
import "./Quiz.css";
import CanvasDraw from "react-canvas-draw";

function Quiz() {
  const { chapterId } = useParams();
  const { selectedSchool } = useSchool();
  const [chapter, setChapter] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentName, setStudentName] = useState("");
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);

  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [matchingSelection, setMatchingSelection] = useState({ questionId: null, leftIdx: null });
  const [draggedItem, setDraggedItem] = useState(null);
  const [brushColor, setBrushColor] = useState("#2D6A76");

  const canvasRefs = useRef({});

  // Helper untuk mengacak array
  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  useEffect(() => {
    async function fetchQuizData() {
      try {
        const { data: chapterData } = await supabase.from("chapters").select("*").eq("id", chapterId).single();
        setChapter(chapterData);
        
        const { data: questionsData } = await supabase.from("questions")
          .select("*")
          .eq("chapter_id", chapterId)
          .order("id", { ascending: true });

        const processedQuestions = (questionsData || []).map(q => {
          // 1. Shuffling untuk Sequencing
          if (q.question_type === "Sequencing (Urutkan)" && Array.isArray(q.options)) {
            const mappedOptions = q.options.map((opt, originalIdx) => ({
              text: (typeof opt === 'object' && opt !== null) ? opt.text : opt,
              image: (typeof opt === 'object' && opt !== null) ? opt.image : null,
              originalIdx: originalIdx
            }));
            return { ...q, options: shuffleArray(mappedOptions) };
          }

          // 2. Shuffling untuk Matching
          if (["Matching", "Matching (Tarik Garis)"].includes(q.question_type) && Array.isArray(q.options)) {
            const leftSide = q.options.map((opt, idx) => ({ ...opt.left, originalIdx: idx }));
            const rightSide = q.options.map((opt, idx) => ({ ...opt.right, originalIdx: idx }));
            return { 
              ...q, 
              options: { 
                left: shuffleArray(leftSide), 
                right: shuffleArray(rightSide) 
              } 
            };
          }
          return q;
        });

        setQuestions(processedQuestions);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuizData();
  }, [chapterId]);

  // --- HANDLERS ---
  const handleAnswerSelect = (questionId, answerValue, isMultiOrSeq) => {
    if (isMultiOrSeq) {
      const currentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [];
      let newAnswers;
      if (currentAnswers.includes(answerValue)) {
        newAnswers = currentAnswers.filter((val) => val !== answerValue);
      } else {
        newAnswers = [...currentAnswers, answerValue];
      }
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: answerValue });
    }
  };

  const handleMatchingSelect = (questionId, originalIdx, side) => {
    const currentPairs = answers[questionId] || {};
    if (side === "left") {
      if (currentPairs[originalIdx] !== undefined) {
        const newPairs = { ...currentPairs };
        delete newPairs[originalIdx];
        setAnswers({ ...answers, [questionId]: newPairs });
        if (matchingSelection.leftIdx === originalIdx) setMatchingSelection({ questionId: null, leftIdx: null });
      } else {
        setMatchingSelection({ questionId, leftIdx: originalIdx });
      }
    } else if (side === "right") {
      let newPairs = { ...currentPairs };
      for (let leftKey in newPairs) {
        if (newPairs[leftKey] === originalIdx) delete newPairs[leftKey];
      }
      if (matchingSelection.questionId === questionId && matchingSelection.leftIdx !== null) {
        newPairs[matchingSelection.leftIdx] = originalIdx;
        setAnswers({ ...answers, [questionId]: newPairs });
        setMatchingSelection({ questionId: null, leftIdx: null });
      }
    }
  };

  const handleTapMark = (questionId, itemIdx, totalCategories) => {
    const currentAnswers = answers[questionId] || {};
    const currentMark = currentAnswers[itemIdx] !== undefined ? currentAnswers[itemIdx] : -1;
    const nextMark = (currentMark + 1) >= totalCategories ? -1 : currentMark + 1;
    setAnswers({ ...answers, [questionId]: { ...currentAnswers, [itemIdx]: nextMark } });
  };

  const handleHotspotClick = (questionId, hIdx) => {
    const current = answers[questionId] || [];
    if (current.includes(hIdx)) {
      setAnswers({ ...answers, [questionId]: current.filter(i => i !== hIdx) });
    } else {
      setAnswers({ ...answers, [questionId]: [...current, hIdx] });
    }
  };

  const handleCountingChange = (questionId, idx, val) => {
    const current = answers[questionId] || {};
    setAnswers({ ...answers, [questionId]: { ...current, [idx]: val } });
  };

  const handleDragStart = (itemIdx) => setDraggedItem(itemIdx);
  
  const handleDropToZone = (questionId, zoneIdx) => {
    if (draggedItem === null) return;
    const current = answers[questionId] || {};
    setAnswers({ ...answers, [questionId]: { ...current, [draggedItem]: zoneIdx } });
    setDraggedItem(null);
  };

  const resetItem = (questionId, itemIdx) => {
    const current = answers[questionId] || {};
    const newAnswers = { ...current };
    delete newAnswers[itemIdx];
    setAnswers({ ...answers, [questionId]: newAnswers });
  };

  // --- HITUNG SKOR ---
  const calculateAndSubmitScore = async () => {
    let correctCount = 0;
    questions.forEach((q) => {
      const ans = answers[q.id];
      if (['Mood/Emoji Picker', 'Coloring Canvas', 'Free Drawing Canvas'].includes(q.question_type)) {
        correctCount += 1;
      } else if (q.question_type === "Pilihan Ganda (MCQ)") {
        try {
          const correctArr = JSON.parse(q.correct_answer);
          if (correctArr.includes(parseInt(ans))) correctCount += 1;
        } catch(e) { if (q.correct_answer == ans) correctCount += 1; }
      } else if (q.question_type === "Multi-Select") {
        try {
          const correctArr = JSON.parse(q.correct_answer) || [];
          const userArr = ans || [];
          if (correctArr.length === userArr.length && correctArr.every(v => userArr.includes(v))) correctCount += 1;
        } catch(e) {}
      } else if (q.question_type === "Sequencing (Urutkan)") {
        const userSeqIndices = ans || [];
        if (userSeqIndices.length === q.options.length) {
          const isCorrect = userSeqIndices.every((optIdxInArray, order) => q.options[optIdxInArray].originalIdx === order);
          if (isCorrect) correctCount += 1;
        }
      } else if (["Matching", "Matching (Tarik Garis)"].includes(q.question_type)) {
        if (ans) {
          const pairs = Object.entries(ans);
          const isAllCorrect = pairs.length === q.options.left.length && pairs.every(([leftOrig, rightOrig]) => parseInt(leftOrig) === parseInt(rightOrig));
          if (isAllCorrect) correctCount += 1;
        }
      } else if (q.question_type === "Drag & Drop to Zone") {
        const items = q.options.items || [];
        const isAll = items.every((item, idx) => parseInt(ans?.[idx]) === item.zoneIndex);
        if (isAll && Object.keys(ans || {}).length === items.length) correctCount += 1;
      } else if (q.question_type === "Visual Classification (Tap-to-Mark)") {
        const items = q.options.items || [];
        if (items.every((item, idx) => ans?.[idx] === item.markIndex)) correctCount += 1;
      } else if (q.question_type === "Image Hotspot / Label") {
        if ((ans || []).length === (q.options || []).length) correctCount += 1;
      } else if (q.question_type === "Counting Input") {
        const items = q.options || [];
        if (items.every((item, idx) => parseInt(ans?.[idx]) === parseInt(item.correctCount))) correctCount += 1;
      } else if (q.question_type === "Reading + Question") {
        const rQs = q.options.questions || [];
        const isAll = rQs.every((rq, idx) => ans?.[idx] === rq.correctIndex);
        if (isAll) correctCount += 1;
      }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    setFinalScore(score);
    setIsFinished(true);
    await supabase.from("scores").insert([{ chapter_id: chapterId, student_name: studentName, score: score, school_id: selectedSchool?.id }]);
  };

  if (loading) return <div className="quiz-loading">Memuat...</div>;

  if (!isNameSubmitted) {
    return (
      <div className="quiz-intro-wrapper">
        <div className="quiz-intro-card">
          <h2>{chapter.title}</h2>
          <div className="name-input-group">
            <label>Siapa namamu?</label>
            <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ketik namamu..." />
            <button onClick={() => setIsNameSubmitted(true)}>Mulai!</button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="quiz-result-wrapper">
        <div className="result-card">
          <h1>Hore! {studentName} 🥳</h1>
          <div className="score-circle"><span className="score-number">{finalScore}</span></div>
          <Link to="/" className="btn-back-home">Selesai</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-play-wrapper">
      <header className="quiz-header">
        <h2>{chapter.title}</h2>
        <div className="student-badge">👤 {studentName}</div>
      </header>

      <div className="questions-container">
        {questions.map((q, index) => {
          const type = q.question_type;
          const isOptionBased = ["Pilihan Ganda (MCQ)", "Multi-Select", "Sequencing (Urutkan)", "Mood/Emoji Picker"].includes(type);
          const isMatching = ["Matching", "Matching (Tarik Garis)"].includes(type);
          const isDragDrop = type === "Drag & Drop to Zone";
          const isTapMark = type === "Visual Classification (Tap-to-Mark)";
          const isCanvas = ["Coloring Canvas", "Free Drawing Canvas"].includes(type);
          const isHotspot = type === "Image Hotspot / Label";
          const isCounting = type === "Counting Input";
          const isReading = type === "Reading + Question";

          return (
            <div className="quiz-q-card" key={q.id}>
              <div className="q-badge">Soal {index + 1}</div>
              <h3 className="q-text">{q.question_text}</h3>
              {q.content && !isCanvas && !isHotspot && <img src={q.content} alt="Soal" className="q-main-img" />}

              {/* 1. MCQ / MULTI / SEQ / MOOD */}
              {isOptionBased && q.options && (
                <div className={`options-grid ${type === "Mood/Emoji Picker" ? "mood-picker-layout" : ""}`}>
                  {q.options.map((opt, oIdx) => {
                    // DEFENSIVE: Pastikan tidak merender objek mentah
                    let displayText = "";
                    let displayImage = null;

                    if (typeof opt === 'string') {
                      displayText = opt;
                    } else if (opt && typeof opt === 'object') {
                      displayText = opt.text || "";
                      displayImage = opt.image || null;
                    }

                    const isSelected = (type === "Multi-Select" || type === "Sequencing (Urutkan)") 
                      ? (answers[q.id] || []).includes(oIdx) 
                      : answers[q.id] === oIdx;

                    return (
                      <div 
                        key={oIdx} 
                        className={`quiz-option ${isSelected ? "selected" : ""} ${type === "Mood/Emoji Picker" ? "mood-option" : ""}`} 
                        onClick={() => handleAnswerSelect(q.id, oIdx, (type === "Multi-Select" || type === "Sequencing (Urutkan)"))}
                      >
                        {type === "Sequencing (Urutkan)" && isSelected && (
                          <div className="seq-num">{(answers[q.id].indexOf(oIdx) + 1)}</div>
                        )}
                        {displayImage && <img src={displayImage} alt="" className="mood-img" />}
                        <span className="mood-text">{displayText}</span>
                        {type === "Multi-Select" && <div className={`multi-check ${isSelected ? "checked" : ""}`}></div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. MATCHING */}
              {isMatching && q.options?.left && (
                <div className="quiz-matching-container">
                  <div className="matching-column">
                    {q.options.left.map((item, lIdx) => (
                      <div key={lIdx} className={`match-item ${matchingSelection.leftIdx === item.originalIdx && matchingSelection.questionId === q.id ? "active-select" : ""} ${answers[q.id]?.[item.originalIdx] !== undefined ? "paired" : ""}`} onClick={() => handleMatchingSelect(q.id, item.originalIdx, "left")}>
                        {item.image && <img src={item.image} alt="" className="match-img-large" />}
                        <span>{item.text || ""}</span>
                      </div>
                    ))}
                  </div>
                  <div className="matching-column">
                    {q.options.right.map((item, rIdx) => (
                      <div key={rIdx} className={`match-item right ${Object.values(answers[q.id] || {}).includes(item.originalIdx) ? "paired" : ""}`} onClick={() => handleMatchingSelect(q.id, item.originalIdx, "right")}>
                        <span>{item.text || ""}</span>
                        {item.image && <img src={item.image} alt="" className="match-img-large" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. DRAG & DROP */}
              {isDragDrop && q.options?.zones && (
                <div className="quiz-dragdrop-container">
                  <div className="drag-items-pool">
                    {q.options.items.map((item, iIdx) => {
                      const isItemPlaced = answers[q.id] && answers[q.id][iIdx] !== undefined;
                      if (isItemPlaced) return null;
                      return (
                        <div key={iIdx} className="draggable-item" draggable onDragStart={() => handleDragStart(iIdx)} onClick={() => setDraggedItem(iIdx)}>
                          {item.image && <img src={item.image} alt="" />}
                          <span>{item.text || ""}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="drop-zones-grid">
                    {q.options.zones.map((z, zIdx) => (
                      <div key={zIdx} className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={()=>handleDropToZone(q.id, zIdx)} onClick={()=>handleDropToZone(q.id, zIdx)}>
                        <div className="zone-label">{z}</div>
                        <div className="zone-content">
                          {Object.entries(answers[q.id] || {}).map(([iI, zI]) => parseInt(zI) === zIdx && (
                            <div key={iI} className="placed-item" onClick={e=>{e.stopPropagation(); resetItem(q.id, iI)}}>
                              {q.options.items[iI].image && <img src={q.options.items[iI].image} alt="" />}
                              <span>{q.options.items[iI].text || ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. TAP TO MARK */}
              {isTapMark && q.options?.categories && (
                <div className="quiz-tapmark-container">
                  <div className="tapmark-legend-box">
                    {q.options.categories.map((c, i) => <span key={i} className="legend-badge"><b>{c.symbol}</b> = {c.name}</span>)}
                  </div>
                  <div className="tapmark-grid">
                    {q.options.items.map((item, i) => (
                      <div key={i} className="tapmark-item" onClick={() => handleTapMark(q.id, i, q.options.categories.length)}>
                        {answers[q.id]?.[i] >= 0 && <div className="floating-mark">{q.options.categories[answers[q.id][i]].symbol}</div>}
                        {item.image && <img src={item.image} alt="" className="tapmark-img" />}
                        <span>{item.text || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. HOTSPOT */}
              {isHotspot && q.options && (
                <div className="quiz-hotspot-container">
                  <div className="hotspot-image-wrapper">
                    <img src={q.content} alt="" className="hotspot-main-img" />
                    {q.options.map((h, hIdx) => (
                      <div key={hIdx} className={`hotspot-dot ${answers[q.id]?.includes(hIdx) ? 'active' : ''}`} style={{ left: `${h.x}%`, top: `${h.y}%` }} onClick={() => handleHotspotClick(q.id, hIdx)}>
                        {answers[q.id]?.includes(hIdx) ? (h.label || "") : '?'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. COUNTING */}
              {isCounting && q.options && (
                <div className="quiz-counting-grid">
                  {q.options.map((item, cIdx) => (
                    <div key={cIdx} className="counting-card">
                      {item.image && <img src={item.image} alt="" />}
                      <p>{item.name || ""}</p>
                      <input type="number" placeholder="0" value={answers[q.id]?.[cIdx] || ""} onChange={(e) => handleCountingChange(q.id, cIdx, e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              {/* 7. READING */}
              {isReading && q.options?.questions && (
                <div className="quiz-reading-container">
                  {q.options.passage && <div className="reading-text-box">{q.options.passage}</div>}
                  {q.options.questions.map((rq, rqIdx) => (
                    <div key={rqIdx} className="reading-q-block">
                      <p><b>{rqIdx+1}. {rq.question || ""}</b></p>
                      <div className="reading-choices-grid">
                        {rq.choices.map((c, cIdx) => (
                          <button key={cIdx} className={`choice-btn ${answers[q.id]?.[rqIdx] === cIdx ? 'active' : ''}`} onClick={() => {
                            const cur = answers[q.id] || {};
                            setAnswers({ ...answers, [q.id]: { ...cur, [rqIdx]: cIdx } });
                          }}>{c.text || ""}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 8. CANVAS */}
              {isCanvas && (
                <div className="quiz-canvas-container">
                   <div className="canvas-controls">
                    <div className="color-palette">
                      {["#2D6A76", "#FF5252", "#FFEB3B", "#4CAF50", "#2196F3", "#9C27B0", "#000000"].map(c => (
                        <button key={c} type="button" className={`color-circle ${brushColor === c ? "active" : ""}`} style={{ backgroundColor: c }} onClick={() => setBrushColor(c)} />
                      ))}
                      <button type="button" className="btn-clear-canvas" onClick={() => canvasRefs.current[q.id]?.clear()}>🗑️</button>
                    </div>
                  </div>
                  <div className="canvas-wrapper">
                    <CanvasDraw 
                      key={`canvas-${q.id}`} 
                      ref={el => canvasRefs.current[q.id] = el} 
                      brushColor={brushColor} 
                      brushRadius={4} 
                      lazyRadius={0}
                      canvasWidth={600} // Lebar default, nanti akan ditarik CSS
                      canvasHeight={400} 
                      imgSrc={type === "Coloring Canvas" ? q.content : ""} 
                    />
                  </div>
                </div>
              )}

              {type === "Mood/Emoji Picker" && <div className="subjective-notice">📝 Tugas refleksi: Sistem otomatis memberi nilai penuh!</div>}
            </div>
          );
        })}
      </div>
      <div className="quiz-footer">
        <button className="btn-submit-quiz" onClick={calculateAndSubmitScore}>Kumpulkan Jawaban</button>
      </div>
    </div>
  );
}

export default Quiz;