import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ChapterDetail.css';

// Fungsi helper untuk membaca data kunci jawaban
const getCorrectIndexes = (correctAnswerStr, optionsList) => {
  if (!correctAnswerStr) return [];
  if (correctAnswerStr === "matching" || correctAnswerStr === "sequence") return [];
  
  try {
    const parsed = JSON.parse(correctAnswerStr);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch(e) {}
  
  const asNum = parseInt(correctAnswerStr);
  if (!isNaN(asNum) && asNum.toString() === correctAnswerStr) return [asNum];
  
  const idx = optionsList.findIndex(opt => {
    const txt = typeof opt === 'object' && opt !== null ? opt.text : opt;
    return txt === correctAnswerStr;
  });
  return idx !== -1 ? [idx] : [];
};

function ChapterDetail() {
    // Tambahkan di deretan state paling atas
const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Form Utama
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'Pilihan Ganda (MCQ)',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [existingMainImage, setExistingMainImage] = useState('');
  const fileInputRef = useRef(null);

  // State Pilihan Ganda, Multi-Select, & Sequencing
  const [options, setOptions] = useState([
    { text: '', imageFile: null, previewUrl: '' },
    { text: '', imageFile: null, previewUrl: '' }
  ]);
  const [correctAnswers, setCorrectAnswers] = useState([0]);

  // State Khusus Matching
  const createEmptyPair = () => ({
    left: { text: '', imageFile: null, previewUrl: '' },
    right: { text: '', imageFile: null, previewUrl: '' }
  });
  const [matchingPairs, setMatchingPairs] = useState([createEmptyPair(), createEmptyPair()]);

  // State Khusus Drag & Drop to Zone
  const [zones, setZones] = useState(['Kategori 1', 'Kategori 2']);
  const [dragItems, setDragItems] = useState([
    { text: '', imageFile: null, previewUrl: '', zoneIndex: 0 }
  ]);

  // State Khusus Visual Classification (Tap-to-Mark)
  const [markCategories, setMarkCategories] = useState([{ name: 'Sayuran', symbol: '❌' }, { name: 'Buah', symbol: '⭕' }]);
  const [markItems, setMarkItems] = useState([{ text: '', imageFile: null, previewUrl: '', markIndex: 0 }]);

  // State Khusus Image Hotspot / Label
  const [hotspots, setHotspots] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState(''); // Untuk preview gambar lokal saat diklik

  // State Khusus Counting Input (Berhitung)
  const [countingItems, setCountingItems] = useState([{ name: '', imageFile: null, previewUrl: '', correctCount: '' }]);

  // State Khusus Reading + Question (Soal Cerita)
  const [readingPassage, setReadingPassage] = useState('');
  const [readingQs, setReadingQs] = useState([{ question: '', choices: [{text: ''}, {text: ''}], correctIndex: 0 }]);



  useEffect(() => {
    fetchChapterAndQuestions();
  }, [chapterId]);

  async function fetchChapterAndQuestions() {
    try {
      setLoading(true);
      const { data: chapterData, error: chapterError } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
      if (chapterError) throw chapterError;
      setChapter(chapterData);

      const { data: questionsData, error: questionsError } = await supabase.from('questions').select('*').eq('chapter_id', chapterId).order('id', { ascending: true });
      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setNewQuestion({...newQuestion, question_type: type});
    if (type === 'Pilihan Ganda (MCQ)' && correctAnswers.length > 1) {
      setCorrectAnswers([correctAnswers[0]]);
    }
  };

  // Handler Umum (MCQ, Multi-Select, Sequence)
  const handleOptionTextChange = (val, index) => {
    const newOpts = [...options];
    newOpts[index].text = val;
    setOptions(newOpts);
  };
  const handleOptionFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newOpts = [...options];
      newOpts[index].imageFile = file;
      newOpts[index].previewUrl = URL.createObjectURL(file);
      setOptions(newOpts);
    }
  };
  const addOption = () => setOptions([...options, { text: '', imageFile: null, previewUrl: '' }]);
  const removeOption = (indexToRemove) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, idx) => idx !== indexToRemove);
    setOptions(newOpts);
    let newCorrect = correctAnswers.filter(i => i !== indexToRemove).map(i => i > indexToRemove ? i - 1 : i);
    if (newCorrect.length === 0 && newQuestion.question_type === 'Pilihan Ganda (MCQ)') newCorrect = [0];
    setCorrectAnswers(newCorrect);
  };
  const handleCorrectAnswerToggle = (index) => {
    if (newQuestion.question_type === 'Multi-Select') {
      setCorrectAnswers(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    } else {
      setCorrectAnswers([index]);
    }
  };

  // Handler Matching
  const handleMatchingTextChange = (val, index, side) => {
    const newPairs = [...matchingPairs];
    newPairs[index] = { ...newPairs[index], [side]: { ...newPairs[index][side], text: val } };
    setMatchingPairs(newPairs);
  };
  const handleMatchingFileChange = (e, index, side) => {
    const file = e.target.files[0];
    if (file) {
      const newPairs = [...matchingPairs];
      newPairs[index] = { ...newPairs[index], [side]: { ...newPairs[index][side], imageFile: file, previewUrl: URL.createObjectURL(file) } };
      setMatchingPairs(newPairs);
    }
  };
  const addMatchingPair = () => setMatchingPairs([...matchingPairs, createEmptyPair()]);
  const removeMatchingPair = (indexToRemove) => {
    if (matchingPairs.length <= 2) return;
    setMatchingPairs(matchingPairs.filter((_, idx) => idx !== indexToRemove));
  };

  // Handler Drag & Drop to Zone
  const handleZoneChange = (val, idx) => {
    const newZones = [...zones]; newZones[idx] = val; setZones(newZones);
  };
  const addZone = () => setZones([...zones, `Kategori ${zones.length + 1}`]);
  const removeZone = (idxToRemove) => {
    if (zones.length <= 2) return;
    setZones(zones.filter((_, idx) => idx !== idxToRemove));
    setDragItems(dragItems.map(item => ({...item, zoneIndex: 0}))); // Reset ke kategori pertama
  };

  const handleDragItemTextChange = (val, idx) => {
    const newItems = [...dragItems]; newItems[idx].text = val; setDragItems(newItems);
  };
  const handleDragItemFileChange = (e, idx) => {
    const file = e.target.files[0];
    if (file) {
      const newItems = [...dragItems];
      newItems[idx].imageFile = file; newItems[idx].previewUrl = URL.createObjectURL(file);
      setDragItems(newItems);
    }
  };
  const handleDragItemZoneChange = (val, idx) => {
    const newItems = [...dragItems]; newItems[idx].zoneIndex = parseInt(val); setDragItems(newItems);
  };
  const addDragItem = () => setDragItems([...dragItems, { text: '', imageFile: null, previewUrl: '', zoneIndex: 0 }]);
  const removeDragItem = (idxToRemove) => {
    if (dragItems.length <= 1) return;
    setDragItems(dragItems.filter((_, idx) => idx !== idxToRemove));
  };

  // Handler Visual Classification (Tap-to-Mark)
  const handleMarkCategoryChange = (val, field, idx) => {
    const newMarks = [...markCategories]; newMarks[idx][field] = val; setMarkCategories(newMarks);
  };
  const addMarkCategory = () => setMarkCategories([...markCategories, { name: `Kategori ${markCategories.length + 1}`, symbol: '⭐' }]);
  const removeMarkCategory = (idxToRemove) => {
    if (markCategories.length <= 1) return;
    setMarkCategories(markCategories.filter((_, idx) => idx !== idxToRemove));
    setMarkItems(markItems.map(item => ({...item, markIndex: 0})));
  };

  const handleMarkItemTextChange = (val, idx) => {
    const newItems = [...markItems]; newItems[idx].text = val; setMarkItems(newItems);
  };
  const handleMarkItemFileChange = (e, idx) => {
    const file = e.target.files[0];
    if (file) {
      const newItems = [...markItems];
      newItems[idx].imageFile = file; newItems[idx].previewUrl = URL.createObjectURL(file);
      setMarkItems(newItems);
    }
  };
  const handleMarkItemMarkChange = (val, idx) => {
    const newItems = [...markItems]; newItems[idx].markIndex = parseInt(val); setMarkItems(newItems);
  };
  const addMarkItem = () => setMarkItems([...markItems, { text: '', imageFile: null, previewUrl: '', markIndex: 0 }]);
  const removeMarkItem = (idxToRemove) => {
    if (markItems.length <= 1) return;
    setMarkItems(markItems.filter((_, idx) => idx !== idxToRemove));
  };

  // Handler Image Hotspot
  const handleImageClickForHotspot = (e) => {
    if (newQuestion.question_type !== 'Image Hotspot / Label') return;
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHotspots([...hotspots, { x, y, label: '' }]); // Simpan koordinat persentase
  };
  const handleHotspotLabelChange = (val, idx) => {
    const newHs = [...hotspots]; newHs[idx].label = val; setHotspots(newHs);
  };
  const removeHotspot = (idxToRemove) => {
    setHotspots(hotspots.filter((_, idx) => idx !== idxToRemove));
  };

  // Handler Counting Input
  const handleCountingItemChange = (val, field, idx) => {
    const newItems = [...countingItems]; newItems[idx][field] = val; setCountingItems(newItems);
  };
  const handleCountingFileChange = (e, idx) => {
    const file = e.target.files[0];
    if (file) {
      const newItems = [...countingItems];
      newItems[idx].imageFile = file; newItems[idx].previewUrl = URL.createObjectURL(file);
      setCountingItems(newItems);
    }
  };
  const addCountingItem = () => setCountingItems([...countingItems, { name: '', imageFile: null, previewUrl: '', correctCount: '' }]);
  const removeCountingItem = (idxToRemove) => {
    if (countingItems.length <= 1) return;
    setCountingItems(countingItems.filter((_, idx) => idx !== idxToRemove));
  };

  // Handler Reading + Question
  const addReadingQ = () => setReadingQs([...readingQs, { question: '', choices: [{text: ''}, {text: ''}], correctIndex: 0 }]);
  const removeReadingQ = (idx) => setReadingQs(readingQs.filter((_, i) => i !== idx));
  const handleReadingQChange = (val, qIdx) => {
    const newQs = [...readingQs]; newQs[qIdx].question = val; setReadingQs(newQs);
  };
  const handleReadingChoiceChange = (val, qIdx, cIdx) => {
    const newQs = [...readingQs]; newQs[qIdx].choices[cIdx].text = val; setReadingQs(newQs);
  };
  const addReadingChoice = (qIdx) => {
    const newQs = [...readingQs]; newQs[qIdx].choices.push({text: ''}); setReadingQs(newQs);
  };
  const removeReadingChoice = (qIdx, cIdx) => {
    const newQs = [...readingQs];
    if(newQs[qIdx].choices.length <= 2) return;
    newQs[qIdx].choices = newQs[qIdx].choices.filter((_, i) => i !== cIdx);
    if(newQs[qIdx].correctIndex >= newQs[qIdx].choices.length) newQs[qIdx].correctIndex = 0;
    setReadingQs(newQs);
  };
  const setReadingCorrect = (qIdx, cIdx) => {
    const newQs = [...readingQs]; newQs[qIdx].correctIndex = cIdx; setReadingQs(newQs);
  };

  // Upload Gambar & CRUD
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setMainImagePreview(URL.createObjectURL(file)); // Buat URL preview sementara
    }
  };
//   const handleFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
//   };
  const uploadImageToSupabase = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `chapter_${chapterId}/${fileName}`;
    const { error } = await supabase.storage.from('quiz-images').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('quiz-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      alert("Gagal menghapus soal.");
    }
  };

  const handleEditClick = (q) => {
    setEditingId(q.id);
    setNewQuestion({ question_text: q.question_text, question_type: q.question_type });
    setExistingMainImage(q.content || '');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const isMCQorMulti = ['Pilihan Ganda (MCQ)', 'Multi-Select'].includes(q.question_type);
    const isSequence = q.question_type === 'Sequencing (Urutkan)';
    const isMoodPicker = q.question_type === 'Mood/Emoji Picker';

   if ((isMCQorMulti || isSequence || isMoodPicker) && q.options) {
      const mappedOptions = q.options.map(opt => {
        const isObj = typeof opt === 'object' && opt !== null;
        return { text: isObj ? (opt.text || '') : opt, imageFile: null, previewUrl: isObj ? (opt.image || '') : '' };
      });
      setOptions(mappedOptions.length > 0 ? mappedOptions : [{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
      
      if (isMCQorMulti) {
        const correctArr = getCorrectIndexes(q.correct_answer, mappedOptions);
        setCorrectAnswers(correctArr.length ? correctArr : [0]);
      } else {
        setCorrectAnswers([0]);
      }
      setMatchingPairs([createEmptyPair(), createEmptyPair()]);
      
    } else if (q.question_type === 'Matching' || q.question_type === 'Matching (Tarik Garis)') {
      if (q.options) {
        const mappedPairs = q.options.map(opt => ({
          left: { text: opt.left?.text || '', imageFile: null, previewUrl: opt.left?.image || '' },
          right: { text: opt.right?.text || '', imageFile: null, previewUrl: opt.right?.image || '' }
        }));
        setMatchingPairs(mappedPairs.length > 0 ? mappedPairs : [createEmptyPair(), createEmptyPair()]);
      }
      } else if (q.question_type === 'Drag & Drop to Zone') {
      if (q.options && q.options.zones && q.options.items) {
        setZones(q.options.zones);
        setDragItems(q.options.items.map(item => ({ text: item.text || '', imageFile: null, previewUrl: item.image || '', zoneIndex: item.zoneIndex })));
      } else {
        setZones(['Kategori 1', 'Kategori 2']);
        setDragItems([{ text: '', imageFile: null, previewUrl: '', zoneIndex: 0 }]);
      }
      setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
      setMatchingPairs([createEmptyPair(), createEmptyPair()]);
      setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
    } else if (q.question_type === 'Visual Classification (Tap-to-Mark)') {
      if (q.options && q.options.categories && q.options.items) {
        setMarkCategories(q.options.categories);
        setMarkItems(q.options.items.map(item => ({ text: item.text || '', imageFile: null, previewUrl: item.image || '', markIndex: item.markIndex })));
      } else {
        setMarkCategories([{ name: 'Kategori 1', symbol: '❌' }]);
        setMarkItems([{ text: '', imageFile: null, previewUrl: '', markIndex: 0 }]);
      }
      setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
      setMatchingPairs([createEmptyPair(), createEmptyPair()]);
      setZones(['Kategori 1', 'Kategori 2']);
    } else if (q.question_type === 'Image Hotspot / Label') {
      if (q.options) setHotspots(q.options);
      else setHotspots([]);
      setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
      setMatchingPairs([createEmptyPair(), createEmptyPair()]);
      setZones(['Kategori 1', 'Kategori 2']);
      setMarkCategories([{ name: 'Kategori 1', symbol: '❌' }]);
    } else if (q.question_type === 'Counting Input') {
      if (q.options) {
        setCountingItems(q.options.map(item => ({ name: item.name || '', imageFile: null, previewUrl: item.image || '', correctCount: item.correctCount || '' })));
      } else {
        setCountingItems([{ name: '', imageFile: null, previewUrl: '', correctCount: '' }]);
      }
      setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
      setMatchingPairs([createEmptyPair(), createEmptyPair()]);
      setZones(['Kategori 1', 'Kategori 2']);
      setMarkCategories([{ name: 'Kategori 1', symbol: '❌' }]);
      setHotspots([]);
    } else if (q.question_type === 'Reading + Question') {
      if (q.options && q.options.passage !== undefined) {
        setReadingPassage(q.options.passage);
        setReadingQs(q.options.questions || [{ question: '', choices: [{text: ''}, {text: ''}], correctIndex: 0 }]);
      } else {
        setReadingPassage('');
        setReadingQs([{ question: '', choices: [{text: ''}, {text: ''}], correctIndex: 0 }]);
      }
      // Reset sisa form lainnya
      setCountingItems([{ name: '', imageFile: null, previewUrl: '', correctCount: '' }]);
      setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
      setMatchingPairs([createEmptyPair(), createEmptyPair()]);
      setZones(['Kategori 1', 'Kategori 2']);
      setMarkCategories([{ name: 'Kategori 1', symbol: '❌' }]);
      setHotspots([]);
    }
    else {
      resetFormInputsOnly();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormInputsOnly = () => {
    setOptions([{ text: '', imageFile: null, previewUrl: '' }, { text: '', imageFile: null, previewUrl: '' }]);
    setMatchingPairs([createEmptyPair(), createEmptyPair()]);
    setCorrectAnswers([0]);
    setZones(['Kategori 1', 'Kategori 2']);
    setDragItems([{ text: '', imageFile: null, previewUrl: '', zoneIndex: 0 }]);
    setMarkCategories([{ name: 'Kategori 1', symbol: '❌' }, { name: 'Kategori 2', symbol: '⭕' }]);
    setMarkItems([{ text: '', imageFile: null, previewUrl: '', markIndex: 0 }]);
    setHotspots([]);
    setMainImagePreview('');
    setCountingItems([{ name: '', imageFile: null, previewUrl: '', correctCount: '' }]);
    setReadingPassage('');
    setReadingQs([{ question: '', choices: [{text: ''}, {text: ''}], correctIndex: 0 }]);

  };

  const resetForm = () => {
    setEditingId(null);
    setNewQuestion({ question_text: '', question_type: 'Pilihan Ganda (MCQ)' });
    setExistingMainImage('');
    setImageFile(null);
    resetFormInputsOnly();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let mainImageUrl = existingMainImage; 
      if (imageFile) mainImageUrl = await uploadImageToSupabase(imageFile);

      let finalOptions = null;
      let finalCorrectAnswer = null;

      // 1. Jika tipe Pilihan Ganda / Multi-Select
      if (['Pilihan Ganda (MCQ)', 'Multi-Select'].includes(newQuestion.question_type)) {
        if (options.some(opt => opt.text.trim() === '' && !opt.previewUrl && !opt.imageFile)) {
          alert("Setiap pilihan jawaban harus memiliki Teks ATAU Gambar!");
          setIsSubmitting(false); return;
        }
        if (correctAnswers.length === 0) {
          alert("Silakan centang setidaknya satu jawaban yang benar!");
          setIsSubmitting(false); return;
        }

        finalOptions = await Promise.all(options.map(async (opt) => {
          let optImageUrl = opt.previewUrl;
          if (opt.imageFile) optImageUrl = await uploadImageToSupabase(opt.imageFile);
          return { text: opt.text, image: optImageUrl };
        }));
        finalCorrectAnswer = JSON.stringify(correctAnswers);
      } 
      
      // 2. Jika tipe Matching (Tarik Garis)
      else if (['Matching', 'Matching (Tarik Garis)'].includes(newQuestion.question_type)) {
        for (let i=0; i<matchingPairs.length; i++) {
          const p = matchingPairs[i];
          if ((p.left.text.trim() === '' && !p.left.previewUrl && !p.left.imageFile) || 
              (p.right.text.trim() === '' && !p.right.previewUrl && !p.right.imageFile)) {
            alert(`Pasangan ke-${i+1} belum lengkap! Harap isi sisi Kiri dan Kanan.`);
            setIsSubmitting(false); return;
          }
        }

        finalOptions = await Promise.all(matchingPairs.map(async (pair) => {
          let leftImg = pair.left.previewUrl;
          if (pair.left.imageFile) leftImg = await uploadImageToSupabase(pair.left.imageFile);
          let rightImg = pair.right.previewUrl;
          if (pair.right.imageFile) rightImg = await uploadImageToSupabase(pair.right.imageFile);
          return {
            left: { text: pair.left.text, image: leftImg },
            right: { text: pair.right.text, image: rightImg }
          };
        }));
        finalCorrectAnswer = "matching"; 
      }

      // 3. Jika tipe Sequencing (Urutkan)
      else if (newQuestion.question_type === 'Sequencing (Urutkan)') {
        if (options.some(opt => opt.text.trim() === '' && !opt.previewUrl && !opt.imageFile)) {
          alert("Setiap urutan harus memiliki Teks ATAU Gambar!");
          setIsSubmitting(false); return;
        }
        finalOptions = await Promise.all(options.map(async (opt) => {
          let optImageUrl = opt.previewUrl;
          if (opt.imageFile) optImageUrl = await uploadImageToSupabase(opt.imageFile);
          return { text: opt.text, image: optImageUrl };
        }));
        finalCorrectAnswer = "sequence"; 
      }

      // 4. Jika tipe Drag & Drop to Zone
      else if (newQuestion.question_type === 'Drag & Drop to Zone') {
        if (dragItems.some(item => item.text.trim() === '' && !item.previewUrl && !item.imageFile)) {
          alert("Setiap item Drag & Drop harus memiliki Teks ATAU Gambar!");
          setIsSubmitting(false); return;
        }
        const uploadedItems = await Promise.all(dragItems.map(async (item) => {
          let imgUrl = item.previewUrl;
          if (item.imageFile) imgUrl = await uploadImageToSupabase(item.imageFile);
          return { text: item.text, image: imgUrl, zoneIndex: item.zoneIndex };
        }));
        finalOptions = { zones: zones, items: uploadedItems };
        finalCorrectAnswer = "dragdrop"; 
      }

      // 5. Jika tipe Coloring Canvas (Mewarnai)
      else if (newQuestion.question_type === 'Coloring Canvas') {
        if (!imageFile && !existingMainImage) {
          alert("Untuk tugas mewarnai, Anda WAJIB mengupload Gambar Instruksi (hitam putih) di atas!");
          setIsSubmitting(false); return;
        }
        finalOptions = null; // Tidak butuh opsi pilihan
        finalCorrectAnswer = "canvas_manual"; // Penanda untuk penilaian guru nanti
      }

      // 6. Jika tipe Free Drawing Canvas (Menggambar Bebas)
      else if (newQuestion.question_type === 'Free Drawing Canvas') {
        finalOptions = null; // Tidak butuh opsi pilihan
        finalCorrectAnswer = "canvas_manual_free"; // Penanda untuk sistem
      }

      // 5. Jika tipe Visual Classification (Tap-to-Mark)
      else if (newQuestion.question_type === 'Visual Classification (Tap-to-Mark)') {
        if (markItems.some(item => item.text.trim() === '' && !item.previewUrl && !item.imageFile)) {
          alert("Setiap item Tap-to-Mark harus memiliki Teks ATAU Gambar!");
          setIsSubmitting(false); return;
        }
        const uploadedItems = await Promise.all(markItems.map(async (item) => {
          let imgUrl = item.previewUrl;
          if (item.imageFile) imgUrl = await uploadImageToSupabase(item.imageFile);
          return { text: item.text, image: imgUrl, markIndex: item.markIndex };
        }));
        finalOptions = { categories: markCategories, items: uploadedItems };
        finalCorrectAnswer = "tap_mark";
      }

      // 6. Jika tipe Image Hotspot / Label
      else if (newQuestion.question_type === 'Image Hotspot / Label') {
        if (!imageFile && !existingMainImage) {
          alert("Gambar Utama WAJIB diupload untuk fitur Hotspot!");
          setIsSubmitting(false); return;
        }
        if (hotspots.length === 0 || hotspots.some(h => h.label.trim() === '')) {
          alert("Tambahkan minimal 1 Titik Penanda dan isi semua labelnya!");
          setIsSubmitting(false); return;
        }
        finalOptions = hotspots;
        finalCorrectAnswer = "hotspot";
      }

      // 7. Jika tipe Counting Input (Berhitung)
      else if (newQuestion.question_type === 'Counting Input') {
        if (!imageFile && !existingMainImage) {
          alert("Gambar Utama WAJIB diupload agar siswa memiliki objek untuk dihitung!");
          setIsSubmitting(false); return;
        }
        if (countingItems.some(item => item.correctCount === '')) {
          alert("Harap masukkan Jumlah Jawaban Benar (Angka) untuk setiap objek!");
          setIsSubmitting(false); return;
        }
        finalOptions = await Promise.all(countingItems.map(async (item) => {
          let imgUrl = item.previewUrl;
          if (item.imageFile) imgUrl = await uploadImageToSupabase(item.imageFile);
          return { name: item.name, image: imgUrl, correctCount: item.correctCount };
        }));
        finalCorrectAnswer = "counting";
      }

      // 8. Jika tipe Reading + Question
      else if (newQuestion.question_type === 'Reading + Question') {
        if (readingPassage.trim() === '' && !imageFile && !existingMainImage) {
          alert("Harap isi Teks Bacaan atau Upload Gambar Cerita!");
          setIsSubmitting(false); return;
        }
        if (readingQs.some(q => q.question.trim() === '' || q.choices.some(c => c.text.trim() === ''))) {
          alert("Harap isi semua Pertanyaan dan Pilihan Jawaban!");
          setIsSubmitting(false); return;
        }
        finalOptions = { passage: readingPassage, questions: readingQs };
        finalCorrectAnswer = "reading";
      }

      // 9. Jika tipe Mood/Emoji Picker (DIPERBAIKI)
      else if (newQuestion.question_type === 'Mood/Emoji Picker') {
        if (options.some(opt => opt.text.trim() === '' && !opt.previewUrl && !opt.imageFile)) { 
          alert("Isi opsi perasaan/emoji!"); 
          setIsSubmitting(false); 
          return; 
        }
        finalOptions = await Promise.all(options.map(async (opt) => {
          let optImageUrl = opt.previewUrl;
          if (opt.imageFile) optImageUrl = await uploadImageToSupabase(opt.imageFile);
          return { text: opt.text, image: optImageUrl };
        }));
        finalCorrectAnswer = "reflection";
      }

      const payload = {
        chapter_id: chapterId,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        content: mainImageUrl,
        options: finalOptions, 
        correct_answer: finalCorrectAnswer 
      };

      if (editingId) {
        const { error } = await supabase.from('questions').update(payload).eq('id', editingId);
        if (error) throw error;
        setQuestions(questions.map(q => q.id === editingId ? { ...q, ...payload } : q));
        alert("Soal berhasil diperbarui!");
      } else {
        const { data, error } = await supabase.from('questions').insert([payload]).select();
        if (error) throw error;
        setQuestions([...questions, data[0]]);
        alert("Soal berhasil ditambahkan!");
      }

      resetForm();
    } catch (error) {
      console.error(error.message);
      alert("Gagal menyimpan soal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen">Memuat data bab...</div>;
  if (!chapter) return <div className="loading-screen">Bab tidak ditemukan!</div>;

  const isOptionBasedForm = ['Pilihan Ganda (MCQ)', 'Multi-Select'].includes(newQuestion.question_type);
  const isMatchingForm = ['Matching', 'Matching (Tarik Garis)'].includes(newQuestion.question_type);
  const isSequencingForm = newQuestion.question_type === 'Sequencing (Urutkan)';
  const isDragDropForm = newQuestion.question_type === 'Drag & Drop to Zone';
  const isColoringForm = newQuestion.question_type === 'Coloring Canvas';
  const isFreeDrawingForm = newQuestion.question_type === 'Free Drawing Canvas';
  const isTapToMarkForm = newQuestion.question_type === 'Visual Classification (Tap-to-Mark)';
  const isHotspotForm = newQuestion.question_type === 'Image Hotspot / Label';
  const isCountingForm = newQuestion.question_type === 'Counting Input';
  const isReadingForm = newQuestion.question_type === 'Reading + Question';
  const isMoodPicker = newQuestion.question_type === 'Mood/Emoji Picker';

  return (
    <div className="chapter-detail-wrapper">
      <header className="detail-header">
        <Link to="/lessons" className="btn-back"><span>⬅</span> Kembali</Link>
        <div className="header-title">
          <span className="category-tag">{chapter.Category || 'Umum'}</span>
          <h2>{chapter.title}</h2>
        </div>
      </header>

      <div className="detail-layout">
        <section className="form-section">
          <div className="card-form">
            <h3>{editingId ? '✏️ Edit Soal' : 'Buat Soal Baru'}</h3>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label>Tipe Aktivitas / Kuis</label>
                <select value={newQuestion.question_type} onChange={handleTypeChange}>
                  <optgroup label="Tier 1 — Core">
                    <option value="Pilihan Ganda (MCQ)">Pilihan Ganda (MCQ)</option>
                    <option value="Multi-Select">Multi-Select</option>
                    <option value="Matching (Tarik Garis)">Matching (Tarik Garis)</option>
                    <option value="Sequencing (Urutkan)">Sequencing (Urutkan)</option>
                    <option value="Drag & Drop to Zone">Drag & Drop to Zone</option>
                  </optgroup>
                  <optgroup label="Lainnya">
                    <option value="Free Drawing Canvas">Free Drawing Canvas</option>
                    <option value="Coloring Canvas">Coloring Canvas (Mewarnai)</option>
                    <option value="Visual Classification (Tap-to-Mark)">Visual Classification (Tap-to-Mark)</option>
                    <option value="Image Hotspot / Label">Image Hotspot / Label</option>
                    <option value="Counting Input">Counting Input</option>
                    <option value="Reading + Question">Reading + Question</option>
                    <option value="Mood/Emoji Picker">Mood/Emoji Picker</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label>Pertanyaan / Instruksi</label>
                <textarea 
                  rows="3" required
                  placeholder={
                    isMatchingForm ? "Contoh: Pasangkan hewan dengan habitatnya!" : 
                    isSequencingForm ? "Contoh: Urutkan proses daur hidup kupu-kupu!" :
                    "Contoh: Manakah hewan pemakan daging?"
                  }
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Upload Gambar Instruksi (Opsional)</label>
                {existingMainImage && !imageFile && (
                  <div className="existing-image-preview">
                    <img src={existingMainImage} alt="Main" />
                    <small>Gambar saat ini</small>
                  </div>
                )}
                <div className="file-upload-wrapper">
                  <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="file-input" />
                </div>
              </div>

              {/* FORM KHUSUS: Pilihan Ganda & Multi-Select */}
              {isOptionBasedForm && (
                <div className="mcq-builder-section">
                  <label className="section-label">
                    Pilihan Jawaban {newQuestion.question_type === 'Multi-Select' ? ' (Centang jawaban yang benar)' : ''}
                  </label>
                  {options.map((option, index) => (
                    <div className="option-row" key={index}>
                      <input 
                        type={newQuestion.question_type === 'Multi-Select' ? 'checkbox' : 'radio'} 
                        name="correctAnswer" 
                        className="correct-indicator"
                        checked={correctAnswers.includes(index)}
                        onChange={() => handleCorrectAnswerToggle(index)}
                      />
                      <div className="option-inputs-group">
                        <input type="text" className="option-input" placeholder={`Teks Pilihan ${String.fromCharCode(65 + index)}`} value={option.text} onChange={(e) => handleOptionTextChange(e.target.value, index)} />
                        <div className="option-image-upload">
                          <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleOptionFileChange(e, index)} />
                          {option.previewUrl && <img src={option.previewUrl} alt="Preview" className="mini-preview" />}
                        </div>
                      </div>
                      {options.length > 2 && <button type="button" className="btn-remove-opt" onClick={() => removeOption(index)}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addOption}>+ Tambah Pilihan</button>
                </div>
              )}

              {/* FORM KHUSUS: Matching (Tarik Garis) */}
              {isMatchingForm && (
                <div className="matching-builder-section">
                  <label className="section-label">Pasangan Benar (Kiri & Kanan)</label>
                  <p className="helper-text">Masukkan pasangan yang benar. Sistem otomatis mengacak posisinya untuk siswa.</p>
                  
                  {matchingPairs.map((pair, index) => (
                    <div className="matching-pair-row" key={index}>
                      <div className="matching-pair-header">
                        <strong>Pasangan {index + 1}</strong>
                        {matchingPairs.length > 2 && <button type="button" className="btn-remove-opt mini" onClick={() => removeMatchingPair(index)}>Hapus</button>}
                      </div>
                      <div className="matching-sides">
                        <div className="matching-side">
                          <span className="side-label">Sisi Kiri</span>
                          <input type="text" className="option-input" placeholder="Teks Kiri" value={pair.left.text} onChange={(e) => handleMatchingTextChange(e.target.value, index, 'left')} />
                          <div className="option-image-upload">
                            <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleMatchingFileChange(e, index, 'left')} />
                            {pair.left.previewUrl && <img src={pair.left.previewUrl} alt="Kiri" className="mini-preview" />}
                          </div>
                        </div>
                        <div className="matching-divider">➡️</div>
                        <div className="matching-side">
                          <span className="side-label">Sisi Kanan</span>
                          <input type="text" className="option-input" placeholder="Teks Kanan" value={pair.right.text} onChange={(e) => handleMatchingTextChange(e.target.value, index, 'right')} />
                          <div className="option-image-upload">
                            <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleMatchingFileChange(e, index, 'right')} />
                            {pair.right.previewUrl && <img src={pair.right.previewUrl} alt="Kanan" className="mini-preview" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addMatchingPair}>+ Tambah Pasangan</button>
                </div>
              )}

              {/* FORM KHUSUS: Sequencing (Urutkan) */}
              {isSequencingForm && (
                <div className="sequence-builder-section">
                  <label className="section-label">Langkah / Urutan Benar</label>
                  <p className="helper-text">Masukkan dari urutan PERTAMA hingga TERAKHIR. Sistem akan mengacaknya untuk siswa nanti.</p>
                  
                  {options.map((option, index) => (
                    <div className="option-row" key={index}>
                      <div className="sequence-number">{index + 1}</div>
                      
                      <div className="option-inputs-group">
                        <input type="text" className="option-input" placeholder={`Teks Urutan ke-${index + 1}`} value={option.text} onChange={(e) => handleOptionTextChange(e.target.value, index)} />
                        <div className="option-image-upload">
                          <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleOptionFileChange(e, index)} />
                          {option.previewUrl && <img src={option.previewUrl} alt="Preview" className="mini-preview" />}
                        </div>
                      </div>

                      {options.length > 2 && (
                        <button type="button" className="btn-remove-opt" onClick={() => removeOption(index)}>✖</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt sequence-btn" onClick={addOption}>+ Tambah Urutan</button>
                </div>
              )}

                {/* FORM KHUSUS: Drag & Drop to Zone */}
              {isDragDropForm && (
                <div className="dragdrop-builder-section">
                  <label className="section-label">1. Buat Area Kategori (Zone)</label>
                  {zones.map((zone, idx) => (
                    <div className="option-row" key={`zone-${idx}`}>
                      <input type="text" className="option-input" placeholder={`Nama Kategori ${idx + 1}`} value={zone} onChange={(e) => handleZoneChange(e.target.value, idx)} />
                      {zones.length > 2 && <button type="button" className="btn-remove-opt" onClick={() => removeZone(idx)}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addZone}>+ Tambah Kategori</button>

                  <label className="section-label" style={{marginTop: '20px'}}>2. Buat Item & Pilih Kategorinya</label>
                  {dragItems.map((item, idx) => (
                    <div className="drag-item-row" key={`item-${idx}`}>
                      <div className="option-inputs-group">
                        <select value={item.zoneIndex} onChange={(e) => handleDragItemZoneChange(e.target.value, idx)} className="zone-select">
                          {zones.map((z, zIdx) => <option key={zIdx} value={zIdx}>Masuk ke: {z || `Kategori ${zIdx+1}`}</option>)}
                        </select>
                        <input type="text" className="option-input" placeholder={`Teks Item ${idx + 1}`} value={item.text} onChange={(e) => handleDragItemTextChange(e.target.value, idx)} />
                        <div className="option-image-upload">
                          <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleDragItemFileChange(e, idx)} />
                          {item.previewUrl && <img src={item.previewUrl} alt="Preview" className="mini-preview" />}
                        </div>
                      </div>
                      {dragItems.length > 1 && <button type="button" className="btn-remove-opt" onClick={() => removeDragItem(idx)}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addDragItem}>+ Tambah Item</button>
                </div>
              )}

              {/* FORM KHUSUS: Coloring Canvas */}
              {isColoringForm && (
                <div className="coloring-builder-section">
                  <label className="section-label">🎨 Area Canvas Mewarnai</label>
                  <p className="helper-text" style={{marginTop: '5px'}}>
                    Anda tidak perlu membuat pilihan jawaban untuk tipe ini. Cukup <b>Upload Gambar</b> pada kolom di atas (sangat disarankan gambar garis tepi / hitam putih). <br/><br/>
                    Siswa otomatis akan mendapatkan kuas dan palet warna saat mengerjakan soal ini.
                  </p>
                </div>
              )}

                {/* FORM KHUSUS: Visual Classification (Tap-to-Mark) */}
              {isTapToMarkForm && (
                <div className="tapmark-builder-section">
                  <label className="section-label">1. Buat Kategori & Tanda (Simbol/Emoji)</label>
                  {markCategories.map((cat, idx) => (
                    <div className="option-row" key={`cat-${idx}`}>
                      <input type="text" className="option-input" placeholder={`Nama Kategori ${idx + 1}`} value={cat.name} onChange={(e) => handleMarkCategoryChange(e.target.value, 'name', idx)} style={{flex: 2}} />
                      <input type="text" className="option-input" placeholder="Tanda (❌, ⭕, dll)" value={cat.symbol} onChange={(e) => handleMarkCategoryChange(e.target.value, 'symbol', idx)} style={{flex: 1, textAlign: 'center'}} maxLength={3} />
                      {markCategories.length > 1 && <button type="button" className="btn-remove-opt" onClick={() => removeMarkCategory(idx)}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addMarkCategory}>+ Tambah Tanda</button>

                  <label className="section-label" style={{marginTop: '20px'}}>2. Buat Item & Pilih Tanda Benarnya</label>
                  {markItems.map((item, idx) => (
                    <div className="drag-item-row" key={`item-${idx}`}>
                      <div className="option-inputs-group">
                        <select value={item.markIndex} onChange={(e) => handleMarkItemMarkChange(e.target.value, idx)} className="zone-select" style={{color: '#6A1B9A'}}>
                          {markCategories.map((c, cIdx) => <option key={cIdx} value={cIdx}>Tanda Benar: {c.symbol} ({c.name})</option>)}
                        </select>
                        <input type="text" className="option-input" placeholder={`Teks Item ${idx + 1}`} value={item.text} onChange={(e) => handleMarkItemTextChange(e.target.value, idx)} />
                        <div className="option-image-upload">
                          <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleMarkItemFileChange(e, idx)} />
                          {item.previewUrl && <img src={item.previewUrl} alt="Preview" className="mini-preview" />}
                        </div>
                      </div>
                      {markItems.length > 1 && <button type="button" className="btn-remove-opt" onClick={() => removeMarkItem(idx)}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addMarkItem}>+ Tambah Item</button>
                </div>
              )}

              {/* FORM KHUSUS: Image Hotspot / Label */}
              {isHotspotForm && (
                <div className="hotspot-builder-section">
                  <label className="section-label">📍 Buat Titik Penanda (Hotspot)</label>
                  <p className="helper-text">1. Upload <b>Gambar Instruksi</b> di atas terlebih dahulu.<br/>2. <b>Klik tepat pada gambar di bawah ini</b> untuk meletakkan titik penanda.</p>
                  
                  {(mainImagePreview || existingMainImage) ? (
                    <div className="hotspot-image-container" onClick={handleImageClickForHotspot}>
                      <img src={mainImagePreview || existingMainImage} alt="Map" className="hotspot-main-img" />
                      {hotspots.map((h, idx) => (
                        <div key={idx} className="hotspot-pin" style={{ left: `${h.x}%`, top: `${h.y}%` }}>{idx + 1}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="hotspot-placeholder">Silakan upload Gambar Instruksi terlebih dahulu.</div>
                  )}

                  <label className="section-label" style={{marginTop: '20px'}}>Nama Label untuk Setiap Titik</label>
                  {hotspots.length === 0 && <p style={{fontSize: '0.85rem', color: '#888'}}>Belum ada titik. Klik pada gambar di atas.</p>}
                  {hotspots.map((h, idx) => (
                    <div className="option-row" key={`hs-${idx}`}>
                      <div className="sequence-number" style={{marginTop: 0, backgroundColor: '#D32F2F'}}>{idx + 1}</div>
                      <input type="text" className="option-input" placeholder={`Nama Bagian ${idx + 1} (Misal: Daun)`} value={h.label} onChange={(e) => handleHotspotLabelChange(e.target.value, idx)} />
                      <button type="button" className="btn-remove-opt" style={{marginTop: 0}} onClick={() => removeHotspot(idx)}>✖</button>
                    </div>
                  ))}
                </div>
              )}

              {/* FORM KHUSUS: Counting Input */}
              {isCountingForm && (
                <div className="counting-builder-section">
                  <label className="section-label">🔢 Tentukan Objek yang Dihitung & Jumlahnya</label>
                  <p className="helper-text">Siswa akan melihat <b>Gambar Utama</b> di atas, lalu mereka harus menghitung objek-objek di bawah ini.</p>
                  
                  {countingItems.map((item, idx) => (
                    <div className="drag-item-row" key={`count-${idx}`}>
                      <div className="option-inputs-group">
                        <div style={{display: 'flex', gap: '10px'}}>
                          <input type="text" className="option-input" placeholder={`Nama Objek ${idx + 1} (Misal: Susu)`} value={item.name} onChange={(e) => handleCountingItemChange(e.target.value, 'name', idx)} style={{flex: 1}} />
                          <input type="number" className="option-input" placeholder="Jml Benar" value={item.correctCount} onChange={(e) => handleCountingItemChange(e.target.value, 'correctCount', idx)} style={{width: '90px', fontWeight: 'bold', color: '#E65100', background: '#FFF3E0'}} />
                        </div>
                        <div className="option-image-upload">
                          <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleCountingFileChange(e, idx)} />
                          {item.previewUrl && <img src={item.previewUrl} alt="Preview" className="mini-preview" /> }
                        </div>
                      </div>
                      {countingItems.length > 1 && <button type="button" className="btn-remove-opt" onClick={() => removeCountingItem(idx)}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addCountingItem} style={{borderColor: '#FFB74D', color: '#F57C00'}}>+ Tambah Objek Hitung</button>
                </div>
              )}

              {/* FORM KHUSUS: Reading + Question */}
              {isReadingForm && (
                <div className="reading-builder-section">
                  <label className="section-label">📖 Teks Bacaan / Cerita (Opsional jika sudah ada gambar)</label>
                  <textarea className="option-input" rows="4" placeholder="Tuliskan cerita atau teks bacaan di sini..." value={readingPassage} onChange={(e) => setReadingPassage(e.target.value)} style={{marginBottom: '20px'}}></textarea>

                  <label className="section-label">Daftar Pertanyaan (Berdasarkan Bacaan)</label>
                  {readingQs.map((qItem, qIdx) => (
                    <div className="reading-q-card" key={`rq-${qIdx}`}>
                      <div className="reading-q-header">
                        <strong>Pertanyaan {qIdx + 1}</strong>
                        {readingQs.length > 1 && <button type="button" className="btn-remove-opt mini" onClick={() => removeReadingQ(qIdx)}>Hapus Soal</button>}
                      </div>
                      <input type="text" className="option-input" placeholder={`Tulis pertanyaan ke-${qIdx + 1}...`} value={qItem.question} onChange={(e) => handleReadingQChange(e.target.value, qIdx)} style={{marginBottom: '10px'}} />

                      <div className="reading-choices">
                        <span style={{fontSize:'0.8rem', color:'#888'}}>Pilihan Jawaban (Pilih radio untuk jawaban benar):</span>
                        {qItem.choices.map((choice, cIdx) => (
                          <div className="option-row" key={`rc-${qIdx}-${cIdx}`} style={{marginBottom: '5px'}}>
                            <input type="radio" className="correct-indicator" checked={qItem.correctIndex === cIdx} onChange={() => setReadingCorrect(qIdx, cIdx)} style={{marginTop: '10px'}} />
                            <input type="text" className="option-input" placeholder={`Pilihan ${String.fromCharCode(65 + cIdx)}`} value={choice.text} onChange={(e) => handleReadingChoiceChange(e.target.value, qIdx, cIdx)} />
                            {qItem.choices.length > 2 && <button type="button" className="btn-remove-opt" onClick={() => removeReadingChoice(qIdx, cIdx)} style={{marginTop: 0, width:'30px', height:'30px'}}>✖</button>}
                          </div>
                        ))}
                        <button type="button" className="btn-add-opt" onClick={() => addReadingChoice(qIdx)} style={{marginTop: '5px', padding: '6px', fontSize: '0.8rem'}}>+ Tambah Pilihan A/B/C</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addReadingQ} style={{borderColor: '#8D6E63', color: '#5D4037'}}>+ Tambah Pertanyaan Baru</button>
                </div>
              )}

              {/* FORM KHUSUS: Free Drawing Canvas */}
              {isFreeDrawingForm && (
                <div className="freedraw-builder-section">
                  <label className="section-label">🖌️ Area Menggambar Bebas</label>
                  <p className="helper-text" style={{marginTop: '5px'}}>
                    Anda tidak perlu membuat pilihan jawaban. Cukup tuliskan <b>Instruksi</b> di kolom atas (contoh: "Gambarlah hewan kesukaanmu!"). <br/><br/>
                    Siswa otomatis akan mendapatkan kanvas putih kosong untuk menggambar secara bebas. Anda juga bisa mengupload gambar contoh/referensi jika diperlukan.
                  </p>
                </div>
              )}

              {/* FORM KHUSUS: Mood/Emoji Picker */}
              {isMoodPicker && (
                <div className="mood-builder-section">
                  <label className="section-label">😊 Pilihan Perasaan / Refleksi</label>
                  <p className="helper-text">Masukkan teks/emoji (atau upload gambar ilustrasi). Tidak ada jawaban benar/salah untuk tipe ini.</p>
                  
                  {options.map((opt, idx) => (
                    <div className="option-row" key={idx}>
                      <div className="option-inputs-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <input type="text" className="option-input" placeholder="Teks/Emoji (Misal: 😃 Senang)" value={opt.text} onChange={(e) => handleOptionTextChange(e.target.value, idx)} style={{ flex: 1 }} />
                        <div className="option-image-upload" style={{ width: 'auto' }}>
                          <input type="file" accept="image/*" className="option-file-mini" onChange={(e) => handleOptionFileChange(e, idx)} />
                          {opt.previewUrl && <img src={opt.previewUrl} className="mini-preview" alt="v" />}
                        </div>
                      </div>
                      {options.length > 2 && <button type="button" className="btn-remove-opt" onClick={() => removeOption(idx)} style={{marginTop:0}}>✖</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-opt" onClick={addOption} style={{borderColor: '#BA68C8', color: '#8E24AA'}}>+ Tambah Pilihan</button>
                </div>
              )}

              <div className="form-actions">
                {editingId && <button type="button" className="btn-cancel-edit" onClick={resetForm} disabled={isSubmitting}>Batal</button>}
                <button type="submit" className="btn-submit-question" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : '+ Tambahkan Soal')}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="list-section">
          <div className="list-header">
            <h3>Daftar Soal ({questions.length})</h3>
          </div>
          <div className="questions-list">
            {questions.map((q, index) => {
              const isOptionBasedData = ['Pilihan Ganda (MCQ)', 'Multi-Select'].includes(q.question_type);
              const isMatchingData = ['Matching', 'Matching (Tarik Garis)'].includes(q.question_type);
              const isSequenceData = q.question_type === 'Sequencing (Urutkan)';
              const correctArr = isOptionBasedData ? getCorrectIndexes(q.correct_answer, q.options || []) : [];

              return (
                <div className={`question-card ${editingId === q.id ? 'editing-active' : ''}`} key={q.id}>
                  <div className="q-number">{index + 1}</div>
                  <div className="q-details">
                    <div className="q-top-bar">
                      <span className="q-type">{q.question_type}</span>
                      <div className="q-actions">
                        <button className="btn-edit-q" onClick={() => handleEditClick(q)} title="Edit Soal">✏️</button>
                        <button className="btn-delete-q" onClick={() => handleDeleteQuestion(q.id)} title="Hapus Soal">🗑️</button>
                      </div>
                    </div>
                    
                    <h4>{q.question_text}</h4>
                    {q.content && <div className="q-image-preview"><img src={q.content} alt="Soal" loading="lazy" /></div>}

                    {/* Render Jawaban Pilihan Ganda/Multi-Select */}
                    {isOptionBasedData && q.options && (
                      <div className="q-options-display">
                        <ul>
                          {q.options.map((opt, i) => {
                            const isObj = typeof opt === 'object' && opt !== null;
                            const isCorrect = correctArr.includes(i);
                            return (
                              <li key={i} className={isCorrect ? 'correct-ans' : ''}>
                                <div className="opt-display-item">
                                  <span className="opt-letter">{String.fromCharCode(65 + i)}.</span>
                                  {isObj && opt.image && <img src={opt.image} alt="opsi" className="opt-list-img" />}
                                  <span className="opt-text">{isObj ? opt.text : opt}</span>
                                  {isCorrect && <span className="correct-icon">✅</span>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Render Jawaban Matching (Tarik Garis) */}
                    {isMatchingData && q.options && (
                      <div className="q-matching-display">
                        {q.options.map((pair, i) => (
                          <div className="matching-display-row" key={i}>
                            <div className="matching-display-side left">
                              {pair.left?.image && <img src={pair.left.image} alt="Kiri" className="opt-list-img" />}
                              <span>{pair.left?.text}</span>
                            </div>
                            <div className="matching-display-divider">↔️</div>
                            <div className="matching-display-side right">
                              {pair.right?.image && <img src={pair.right.image} alt="Kanan" className="opt-list-img" />}
                              <span>{pair.right?.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Jawaban Sequencing (Urutkan) */}
                    {isSequenceData && q.options && (
                      <div className="q-sequence-display">
                        <p style={{fontSize: '0.8rem', color: '#888', marginBottom: '8px', fontWeight: 'bold'}}>Urutan yang Benar:</p>
                        <ol style={{ paddingLeft: '20px', margin: 0, color: '#444' }}>
                          {q.options.map((opt, i) => (
                            <li key={i} style={{ marginBottom: '8px', fontWeight: '800' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {opt.image && <img src={opt.image} alt="urutan" className="opt-list-img" />}
                                <span>{opt.text}</span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Render Jawaban Reading + Question */}
                    {q.question_type === 'Reading + Question' && q.options && (
                      <div className="q-reading-display">
                         {q.options.passage && <div className="reading-passage-preview">{q.options.passage}</div>}
                         <div className="reading-qs-preview">
                           {q.options.questions?.map((rq, rqIdx) => (
                             <div key={rqIdx} className="rq-preview-item">
                               <strong>{rqIdx + 1}. {rq.question}</strong>
                               <ul className="rq-choices-list">
                                 {rq.choices.map((c, cIdx) => (
                                   <li key={cIdx} className={rq.correctIndex === cIdx ? 'correct-ans' : ''}>
                                     {String.fromCharCode(65 + cIdx)}. {c.text} {rq.correctIndex === cIdx && '✅'}
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* Render Jawaban Mood/Emoji Picker */}
                    {q.question_type === 'Mood/Emoji Picker' && Array.isArray(q.options) && (
                       <div className="q-mood-display">
                         {q.options.map((opt, i) => (
                           <div key={i} className="mood-item-card">
                             {opt.image && <img src={opt.image} alt="mood"/>}
                             <span className={opt.image ? 'mood-label' : 'mood-large-text'}>{opt.text}</span>
                           </div>
                         ))}
                       </div>
                    )}

                    {/* Render Jawaban Drag & Drop */}
                    {q.question_type === 'Drag & Drop to Zone' && q.options?.zones && (
                      <div className="q-dragdrop-display">
                        <p style={{fontSize: '0.8rem', color: '#888', marginBottom: '-5px', fontWeight: 'bold'}}>Isi Kategori:</p>
                        {q.options.zones.map((zone, zIdx) => (
                          <div key={zIdx} className="zone-display-box">
                            <div className="zone-title">{zone}</div>
                            <div className="zone-items-grid">
                              {q.options.items.filter(item => item.zoneIndex === zIdx).map((item, iIdx) => (
                                <div key={iIdx} className="zone-item-card">
                                  {item.image && <img src={item.image} alt="item" />}
                                  {item.text && <span>{item.text}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Jawaban Counting Input */}
                    {q.question_type === 'Counting Input' && q.options && (
                      <div className="q-counting-display">
                         <div style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#E65100', marginBottom: '8px'}}>Objek yang dihitung:</div>
                         <div className="counting-items-grid">
                           {q.options.map((item, idx) => (
                             <div key={idx} className="counting-item-card">
                               {item.image && <img src={item.image} alt="obj" />}
                               <div className="counting-details">
                                 <span className="counting-name">{item.name || 'Objek'}</span>
                                 <span className="counting-answer">{item.correctCount}</span>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* Render Jawaban Visual Classification */}
                    {q.question_type === 'Visual Classification (Tap-to-Mark)' && q.options?.categories && (
                      <div className="q-tapmark-display">
                        <div className="tapmark-legend">
                          {q.options.categories.map((cat, idx) => (
                            <span key={idx} className="legend-badge">{cat.symbol} = {cat.name}</span>
                          ))}
                        </div>
                        <div className="zone-items-grid">
                          {q.options.items.map((item, idx) => {
                            const correctCat = q.options.categories[item.markIndex];
                            return (
                              <div key={idx} className="tapmark-item-card">
                                <div className="mark-badge">{correctCat?.symbol}</div>
                                {item.image && <img src={item.image} alt="item" />}
                                {item.text && <span>{item.text}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Render Jawaban Image Hotspot */}
                    {q.question_type === 'Image Hotspot / Label' && q.options && (
                      <div className="q-hotspot-display">
                         <div className="hotspot-image-container static">
                           <img src={q.content} alt="Map" className="hotspot-main-img" />
                           {q.options.map((h, idx) => (
                             <div key={idx} className="hotspot-pin" style={{ left: `${h.x}%`, top: `${h.y}%` }}>{idx + 1}</div>
                           ))}
                         </div>
                         <div className="hotspot-legend">
                           {q.options.map((h, idx) => (
                             <span key={idx} className="legend-badge hotspot">{idx + 1}. {h.label}</span>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* Render Jawaban Coloring Canvas */}
                    {q.question_type === 'Coloring Canvas' && (
                      <div className="q-coloring-display">
                        <span style={{fontWeight: '800', color: '#E91E63'}}>🎨 Tugas Mewarnai (Sistem akan otomatis menyediakan Palet Warna untuk siswa)</span>
                      </div>
                    )}

                    {/* Render Jawaban Free Drawing Canvas */}
                    {q.question_type === 'Free Drawing Canvas' && (
                      <div className="q-freedraw-display">
                        <span style={{fontWeight: '800', color: '#1976D2'}}>🖌️ Tugas Menggambar Bebas (Sistem akan menyediakan Kanvas Kosong untuk siswa)</span>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ChapterDetail;