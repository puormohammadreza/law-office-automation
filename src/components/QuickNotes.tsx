import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect, useRef } from "react";
import { Save, FileText, CheckCircle2, Plus, Trash2, Edit, ChevronRight, Eye, Calendar, Clock, Mic, Square, Loader2 } from "lucide-react";
import { toPersianDigits } from "../utils/shamsi";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeView, setActiveView] = useState<"list" | "editor" | "view">("list");
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    try {
      const saved = safeStorage.getItem("r_quick_notes_v2");
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        // Migration from old single note version
        const oldNote = safeStorage.getItem("r_quick_notes");
        if (oldNote && oldNote.trim() !== "") {
          const newNote: Note = {
            id: Date.now().toString(),
            title: oldNote.split("\n")[0].substring(0, 50) || "یادداشت بدون عنوان",
            content: oldNote,
            updatedAt: Date.now()
          };
          setNotes([newNote]);
          safeStorage.setItem("r_quick_notes_v2", JSON.stringify([newNote]));
          safeStorage.removeItem("r_quick_notes");
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    safeStorage.setItem("r_quick_notes_v2", JSON.stringify(updatedNotes));
  };

  const createNote = () => {
    setCurrentNote({ id: Date.now().toString(), title: "", content: "", updatedAt: Date.now() });
    setActiveView("editor");
  };

  const openNoteEditor = (note: Note) => {
    setCurrentNote({ ...note });
    setActiveView("editor");
  };

  const openNoteView = (note: Note) => {
    setCurrentNote(note);
    setActiveView("view");
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleSaveNotes(notes.filter((n) => n.id !== id));
    if (currentNote?.id === id) {
      setActiveView("list");
      setCurrentNote(null);
    }
  };

  const saveCurrentNote = () => {
    if (!currentNote) return;
    
    // Auto generate title from content if empty
    const lines = currentNote.content.split("\n").filter(l => l.trim().length > 0);
    const generatedTitle = currentNote.title.trim() === "" 
        ? (lines.length > 0 ? lines[0].substring(0, 50) : "یادداشت جدید")
        : currentNote.title;

    const newNote = {
      ...currentNote,
      title: generatedTitle,
      updatedAt: Date.now()
    };

    const existingIndex = notes.findIndex(n => n.id === currentNote.id);
    let updatedNotes;
    if (existingIndex >= 0) {
      updatedNotes = [...notes];
      updatedNotes[existingIndex] = newNote;
    } else {
      updatedNotes = [newNote, ...notes];
    }

    handleSaveNotes(updatedNotes);
    setCurrentNote(newNote);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("دسترسی به میکروفون امکان‌پذیر نیست.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) throw new Error("خطا در پردازش فایل صوتی");

        const res = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioData: base64data, mimeType: blob.type })
        });

        const data = await res.json();
        if (res.ok && data.text) {
          setCurrentNote(prev => prev ? { ...prev, content: prev.content + (prev.content ? "\n" : "") + data.text } : prev);
        } else {
          alert(data.error || "خطا در تبدیل صوت به متن.");
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error(err);
      alert("خطا در تبدیل صوت به متن.");
      setIsTranscribing(false);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return new Intl.DateTimeFormat('fa-IR', { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-300" dir="rtl">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 min-h-[60px] gap-4">
        <div className="flex items-center gap-4">
          {activeView !== "list" && (
            <button 
              onClick={() => setActiveView("list")}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-full transition-all border border-slate-200/50 cursor-pointer"
              title="بازگشت به لیست یادداشت‌ها"
            >
               <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {activeView === "list" && (
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-800">یادداشت‌های عمومی و روزانه دفتر</h1>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">ثبت، ویرایش و دسترسی سریع به ایده‌ها و نکات روزانه</p>
              </div>
            </div>
          )}
        </div>
        
        {activeView === "list" && (
          <button
            onClick={createNote}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            ثبت یادداشت جدید
          </button>
        )}

        {activeView === "editor" && (
          <div className="flex items-center gap-2">
            {!isRecording && !isTranscribing && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-600 rounded-2xl text-xs md:text-sm font-black transition-all border border-indigo-100"
              >
                <Mic className="w-4 h-4" />
                تبدیل صوت به متن
              </button>
            )}
            
            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-2xl text-xs md:text-sm font-black transition-all animate-pulse shadow-md shadow-red-500/20"
              >
                <Square className="w-4 h-4" />
                توقف ضبط
              </button>
            )}

            {isTranscribing && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 text-indigo-500 rounded-2xl text-xs md:text-sm font-black"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال متن‌نویسی...
              </button>
            )}

            <button
              onClick={saveCurrentNote}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-xs md:text-sm font-black transition-all shadow-md shadow-emerald-500/20"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaved ? "ذخیره شد" : "ذخیره یادداشت"}
            </button>
          </div>
        )}

        {activeView === "view" && currentNote && (
          <div className="flex items-center gap-2">
             <button
              onClick={() => deleteNote(currentNote.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-xl text-xs font-black transition-all border border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        )}
      </div>

      {/* LIST VIEW */}
      {activeView === "list" && (
         <div className="flex-1 overflow-y-auto pb-6 pr-2 custom-scrollbar">
            {notes.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400">
                  <FileText className="w-16 h-16 text-slate-200" />
                  <p className="font-bold text-sm">هیچ یادداشتی ثبت نشده است.</p>
                  <button onClick={createNote} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl font-black text-xs cursor-pointer shadow-md shadow-amber-500/15">
                     ثبت اولین یادداشت
                  </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notes.map(note => (
                     <div 
                        key={note.id}
                        onClick={() => openNoteView(note)}
                        className="py-3 px-4 min-h-[48px] border border-slate-200 bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 rounded-[1.2rem] cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-sm"
                     >
                        <div className="flex flex-col overflow-hidden pr-2">
                           <h3 className="font-black text-slate-800 text-sm truncate group-hover:text-amber-700 transition-colors">{note.title || "بدون عنوان"}</h3>
                           <p className="text-[10px] text-slate-450 mt-1 line-clamp-1 font-semibold">{note.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                           <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id, e); }} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="حذف">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      )}

      {/* EDITOR VIEW */}
      {activeView === "editor" && currentNote && (
        <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-200">
           <input 
              type="text" 
              value={currentNote.title}
              onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
              placeholder="عنوان یادداشت (اختیاری)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 font-black text-slate-800 transition-all text-sm"
           />
           <div className="flex-1 relative">
             <textarea
               value={currentNote.content}
               onChange={(e) => {
                 setCurrentNote({...currentNote, content: e.target.value});
                 if (isSaved) setIsSaved(false);
               }}
               placeholder="یادداشت خود را اینجا بنویسید..."
               className="w-full h-full p-5 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all font-sans leading-loose resize-none text-sm font-medium"
             />
           </div>
        </div>
      )}

      {/* READ ONLY VIEW */}
      {activeView === "view" && currentNote && (
         <div 
            onClick={() => openNoteEditor(currentNote)}
            className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-6 border border-slate-100 animate-in fade-in duration-200 transition-colors"
         >
            <h1 className="text-xl font-black text-slate-900 mb-4">{currentNote.title || "بدون عنوان"}</h1>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold font-mono mb-8 pb-4 border-b border-slate-200/50">
               <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {toPersianDigits(formatDate(currentNote.updatedAt))}
               </span>
            </div>
            <div className="text-slate-700 leading-loose text-sm whitespace-pre-wrap font-medium">
               {currentNote.content}
            </div>
         </div>
      )}

    </div>
  );
}

