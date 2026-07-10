import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, BookOpen, GitMerge, Play, Save, FolderOpen, Menu, X, Trash2, Plus, CheckCircle2, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useScheduleStore } from '../store';
import { generateScheduleAsync } from '../lib/gaEngine'; 

const GENERATIONS = 100;
const POPULATION_SIZE = 50;
const DRAFT_KEY = 'timetable_draft_v2';
const PROJECTS_KEY = 'timetable_projects_v2';



function loadSavedDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    params: { days: 5, periods: 7, breakPeriod: 4, maxRooms: 10 },
    teachers: [{ id: 'T1', name: '' }],
    batches: [{ name: '', subjects: [] }],
    combined: []
  };
}

export default function Config() {
  const navigate = useNavigate();
  const setScheduleConfig = useScheduleStore((state) => state.setScheduleConfig);
  const setScheduleResult = useScheduleStore((state) => state.setScheduleResult);

  const [initialData] = useState(loadSavedDraft);
  const [params, setParams] = useState(initialData.params);
  const [teachers, setTeachers] = useState(initialData.teachers);
  const [batches, setBatches] = useState(initialData.batches);
  const [combined, setCombined] = useState(initialData.combined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const [currentProjectName, setCurrentProjectName] = useState("Unsaved Draft");
const [activeSection, setActiveSection] = useState(null);
  // Sidebar starts closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [savedProjects, setSavedProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; } catch { return []; }
  });

    // ── AUTO-SAVE ENGINE ──
  useEffect(() => {
    // 1. Always keep the background draft updated
    const snapshot = JSON.parse(JSON.stringify({ params, teachers, batches, combined }));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));

    // 2. AUTO-SAVE: If you are inside a saved template, update it instantly on every change
    if (currentProjectName !== "Unsaved Draft") {
      setSavedProjects((prevProjects) => {
        const existingIndex = prevProjects.findIndex(p => p.name === currentProjectName);
        if (existingIndex >= 0) {
          const updatedProjects = [...prevProjects];
          updatedProjects[existingIndex] = {
            ...updatedProjects[existingIndex],
            date: new Date().toLocaleDateString(),
            data: snapshot
          };
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
          return updatedProjects;
        }
        return prevProjects;
      });
    }
  }, [params, teachers, batches, combined, currentProjectName]);


const handleSaveProject = () => {
    // Pre-fill the prompt with the current name if it's not a draft
    const defaultName = currentProjectName !== "Unsaved Draft" ? currentProjectName : "";
    const name = window.prompt("Enter a name for this Workspace Template:", defaultName);
    if (!name) return;
    
    // Deep copy snapshot to prevent memory bugs
    const snapshot = JSON.parse(JSON.stringify({ params, teachers, batches, combined }));
    
    // Check if a template with this name already exists
    const existingIndex = savedProjects.findIndex(p => p.name === name);
    let updatedProjects;

    if (existingIndex >= 0) {
      // OVERWRITE the existing template
      updatedProjects = [...savedProjects];
      updatedProjects[existingIndex] = {
        ...updatedProjects[existingIndex],
        date: new Date().toLocaleDateString(),
        data: snapshot
      };
    } else {
      // CREATE a brand new template
      const newProj = { id: Date.now(), name, date: new Date().toLocaleDateString(), data: snapshot };
      updatedProjects = [...savedProjects, newProj];
    }
    
    // Save to State and LocalStorage
    setSavedProjects(updatedProjects);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
    
    // Update the active indicator
    setCurrentProjectName(name); 
  };


const handleLoadProject = (proj) => {
    // Only warn if they are working on an Unsaved Draft. If they are in a saved template, it's already auto-saved!
    const shouldProceed = currentProjectName !== "Unsaved Draft" || window.confirm(`Load '${proj.name}'? Your current unsaved draft will be lost.`);
    
    if (shouldProceed) {
      try {
        const deepData = JSON.parse(JSON.stringify(proj.data));
        
        setParams(deepData.params || { days: 5, periods: 7, breakPeriod: 4, maxRooms: 10 });
        setTeachers(deepData.teachers?.length ? deepData.teachers : [{ id: 'T1', name: '' }]);
        setBatches(deepData.batches?.length ? deepData.batches : [{ name: '', subjects: [] }]);
        setCombined(deepData.combined || []);

        setCurrentProjectName(proj.name);
        setActiveSection(null);
        if(window.innerWidth < 1024) setIsSidebarOpen(false);
      } catch (err) {
        alert("Failed to load template. It may be corrupted from an older version.");
      }
    }
  };

  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  };


const handleNewProject = () => {
    // Only warn if they are in an Unsaved Draft
    const shouldProceed = currentProjectName !== "Unsaved Draft" || window.confirm("Start a new blank schedule? Unsaved changes to your current draft will be lost.");
    
    if (shouldProceed) {
      setParams({ days: 5, periods: 7, breakPeriod: 4, maxRooms: 10 });
      setTeachers([{ id: 'T1', name: '' }]);
      setBatches([{ name: '', subjects: [] }]);
      setCombined([]);
      
      setCurrentProjectName("Unsaved Draft");
      setActiveSection(null);
      if(window.innerWidth < 1024) setIsSidebarOpen(false);
    }
  };
  // ==========================================
  // ROBUST GENERATION FUNCTION
  // ==========================================
  const handleGenerate = async () => {
    setLoading(true); 
    setError(null);
    setActiveSection(null); 
    
    try {
      const validTeacherIds = teachers.map(t => t.id);
      const defaultTeacher = validTeacherIds[0] || 'T1';
      
      const cleanedBatches = batches.map(b => ({
        ...b,
        subjects: b.subjects.map(s => {
          let tId = s.teacher_id;
          if (!validTeacherIds.includes(tId)) tId = defaultTeacher;
          return { ...s, teacher_id: tId };
        })
      }));

      const cleanedCombined = combined.map(c => {
        let tId = c.teacher_id;
        if (!validTeacherIds.includes(tId)) tId = defaultTeacher;
        return { ...c, teacher_id: tId };
      });

      setBatches(cleanedBatches);
      setCombined(cleanedCombined);
      setScheduleConfig({ params, teachers, batches: cleanedBatches, combined: cleanedCombined });

      const payload = {
        days: params.days, 
        periods: params.periods, 
        lunch_period: params.breakPeriod, 
        max_rooms: params.maxRooms,
        generations: GENERATIONS, 
        population_size: POPULATION_SIZE,
        batches: cleanedBatches.map(b => ({
          name: b.name,
          subjects: b.subjects.map(s => ({ id: s.id, name: s.name, teacher_id: s.teacher_id })),
        })),
        combined_classes: cleanedCombined.map(c => ({
          name: c.name, teacher_id: c.teacher_id, batch_indices: c.batch_indices,
        })),
      };

      console.log("🚀 Payload built. Calling GA Engine:", payload);

      // 1. Run the engine
      const data = await generateScheduleAsync(payload);
      
      console.log("✅ GA Engine Success. Output:", data);

      if (!data || !data.schedule) throw new Error("Algorithm returned corrupted or empty schedule data.");

      // 2. Sync with store if needed, then Navigate
      setScheduleResult({
        penaltyScore: data.penalty,
        timetable: data.schedule,
        errors: data.penalty > 0 ? ["Conflicts detected. Review constraints."] : [],
        rawParams: params,
        rawBatches: cleanedBatches,
        rawCombined: cleanedCombined,
        rawTeachers: teachers
      });

      console.log("🔄 Navigating to /result...");
      
      navigate('/result', {
        state: { 
          schedule: data.schedule, 
          penalty: data.penalty, 
          breakdown: data.breakdown || [],
          params: params, 
          batches: cleanedBatches, 
          combined: cleanedCombined, 
          teachers: teachers 
        }
      });

    } catch (e) {
      console.error("🔥 CRITICAL ERROR IN GENERATION:", e);
      setError(e.message || "An internal algorithm error occurred. Check browser console (F12) for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="flex w-full h-[calc(100dvh-4rem)] bg-[#f4f7fb] text-slate-900 font-sans overflow-hidden">
      
      {/* Light Professional Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64 lg:w-72 border-r border-slate-200' : 'w-0 border-r-0'} flex-shrink-0 transition-all duration-300 ease-in-out bg-white flex flex-col fixed top-16 h-[calc(100dvh-4rem)] z-40 lg:static lg:top-0 lg:h-full overflow-hidden shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-100 min-w-[16rem]">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" /> Workspace
          </h3>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Middle section isolated scrolling */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-[16rem] custom-scrollbar">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 px-2">Saved Templates</div>
          {savedProjects.length === 0 ? (
            <div className="text-sm text-slate-400 text-center mt-6 p-4 border border-dashed border-slate-200 rounded-xl">No saved templates</div>
          ) : (
            savedProjects.map(proj => {
              const isActive = currentProjectName === proj.name; // Check if active
              return (
                <div 
                  key={proj.id} 
                  onClick={() => handleLoadProject(proj)} 
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition group shadow-sm ${
                    isActive 
                      ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500' // Highlight active
                      : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300' // Default inactive
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FolderOpen className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                    <span className={`text-sm font-semibold truncate transition ${isActive ? 'text-blue-800' : 'text-slate-700 group-hover:text-blue-700'}`}>
                      {proj.name}
                    </span>
                  </div>
                  <button onClick={(e) => handleDeleteProject(e, proj.id)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
        
        {/* Buttons permanently pinned to the bottom */}
        <div className="p-4 pb-6 border-t border-slate-100 bg-slate-50/50 min-w-[16rem] flex flex-col gap-3 shrink-0">
          <button onClick={handleNewProject} className="w-full flex items-center justify-center py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Blank Workspace
          </button>
          <button onClick={handleSaveProject} className="w-full flex items-center justify-center py-2.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-sm font-semibold transition shadow-sm">
            <Save className="w-4 h-4 mr-2" /> Save As Copy
          </button>
        </div>
      </aside>

      {/* Main Configuration Content */}
      <main className="flex-1 h-full overflow-y-auto w-full relative custom-scrollbar">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed top-16 inset-x-0 bottom-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-8 lg:px-12 pb-32">
          
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2 flex items-center flex-wrap gap-3">
                Automated Scheduling
                {/* Badge showing current project name */}
                <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 mt-1 md:mt-0">
                  {currentProjectName}
                </span>
              </h1>
              <p className="text-slate-500 font-medium">Define environment constraints and configure structural relationships seamlessly.</p>
            </div>
            {!isSidebarOpen && !activeSection && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm flex items-center hover:bg-slate-50 hover:text-blue-600 transition-all"
              >
                <Menu className="w-5 h-5 mr-2" /> Templates
              </button>
            )}
          </div>

          {error && !activeSection && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl font-semibold text-sm flex items-center shadow-sm animate-in fade-in">
              <span className="mr-3 text-lg">⚠</span> {error}
            </div>
          )}

          {/* MAIN DASHBOARD VIEW (Shown only when nothing is expanded) */}
          {!activeSection && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              
              {/* Global Environment */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Settings className="w-5 h-5" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Global Environment</h2>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white">
                  <InputBox label="Working Days / Week" value={params.days} onChange={(v) => setParams({...params, days: v})} />
                  <InputBox label="Periods per Day" value={params.periods} onChange={(v) => setParams({...params, periods: v})} />
                  <InputBox label="Break Period (Index)" value={params.breakPeriod} onChange={(v) => setParams({...params, breakPeriod: v})} />
                  <InputBox label="Max Active Rooms" value={params.maxRooms} onChange={(v) => setParams({...params, maxRooms: v})} />
                </div>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard 
                  icon={<Users className="w-6 h-6" />} title="Manage Faculty" 
                  subtitle={`${teachers.length} Teachers`} btnText="Manage Faculty" 
                  onClick={() => setActiveSection('teachers')} color="indigo"
                />
                <SummaryCard 
                  icon={<BookOpen className="w-6 h-6" />} title="Batches & Subjects" 
                  subtitle={`${batches.length} Batches`} btnText="Manage Batches" 
                  onClick={() => setActiveSection('batches')} color="amber"
                />
                <SummaryCard 
                  icon={<GitMerge className="w-6 h-6" />} title="Combined Classes" 
                  subtitle={`${combined.length} Links defined`} btnText="Manage Combined" 
                  onClick={() => setActiveSection('combined')} color="emerald"
                />
              </div>

              {/* Execution Footer */}
              <div className="mt-8 flex justify-end border-t border-slate-200 pt-8">
                <button 
                  onClick={handleGenerate} disabled={loading}
                  className="flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-base tracking-wide hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto hover:-translate-y-1 active:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                      Computing Constraints...
                    </span>
                  ) : (
                    <><Play className="w-5 h-5 mr-2 fill-current" /> Execute GA</>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ISOLATED EDITORS (Focus Mode) */}

          {/* 1. Faculty Roster Editor */}
          {activeSection === 'teachers' && (
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
              <div className="bg-indigo-50/50 px-6 py-4 md:px-8 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveSection(null)} className="p-2 mr-2 bg-white text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-xl shadow-sm transition-all"><ArrowLeft className="w-5 h-5" /></button>
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800 text-xl">Faculty Details</h3>
                </div>
                <button onClick={() => setActiveSection(null)} className="flex items-center justify-center text-sm font-bold text-white bg-indigo-600 px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Save & Close
                </button>
              </div>
              <div className="p-6 md:p-8 min-h-[50vh]">
                <div className="flex items-center justify-between mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-sm font-bold text-slate-600">Total Teachers:</span>
                  <input 
                    type="number" min="1" max="50" value={teachers.length}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!val || val < 1) return;
                      const next = Array.from({ length: Math.min(50, val) }, (_, i) => ({ id: `T${i + 1}`, name: teachers[i]?.name || '' }));
                      setTeachers(next);
                    }}
                    className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-center outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  {teachers.map((t, i) => (
                    <div key={t.id} className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all w-full sm:w-auto">
                      <span className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 border-r border-slate-200">{t.id}</span>
                      <input 
                        type="text" placeholder="Teacher Name" value={t.name}
                        onChange={e => { const next = [...teachers]; next[i] = { ...next[i], name: e.target.value }; setTeachers(next); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && i === teachers.length - 1) { e.preventDefault(); setTeachers([...teachers, { id: `T${teachers.length + 1}`, name: '' }]); } }}
                        className="w-full sm:w-56 px-4 py-3 bg-transparent text-sm font-medium outline-none text-slate-800 placeholder-slate-400"
                        autoFocus={i === teachers.length - 1}
                      />
                      <button onClick={() => setTeachers(teachers.filter((_, idx) => idx !== i))} className="px-4 text-slate-300 hover:text-rose-500 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setTeachers([...teachers, { id: `T${teachers.length + 1}`, name: '' }])} 
                    className="flex items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-xl px-6 py-3 text-indigo-600 font-bold text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-colors w-full sm:w-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add Teacher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Batches & Subjects Editor */}
          {activeSection === 'batches' && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
              <div className="bg-amber-50/50 px-6 py-4 md:px-8 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveSection(null)} className="p-2 mr-2 bg-white text-slate-400 hover:text-amber-600 border border-slate-200 rounded-xl shadow-sm transition-all"><ArrowLeft className="w-5 h-5" /></button>
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800 text-xl">Batches & Subjects Editor</h3>
                </div>
                <button onClick={() => setActiveSection(null)} className="flex items-center justify-center text-sm font-bold text-white bg-amber-600 px-6 py-2.5 rounded-xl hover:bg-amber-700 transition-colors shadow-md w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Save & Close
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-8 min-h-[50vh]">
                {batches.map((batch, bi) => (
                  <div key={bi} className="flex flex-col xl:flex-row gap-6 p-6 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm relative">
                    
                    {/* Left: Batch Info */}
                    <div className="w-full xl:w-1/3 shrink-0 border-b xl:border-b-0 xl:border-r border-slate-200 pb-6 xl:pb-0 xl:pr-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-md border border-amber-200">B{bi}</span>
                        <button onClick={() => setBatches(batches.filter((_, i) => i !== bi))} className="ml-auto text-slate-400 hover:text-rose-500 p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Batch Identifier</label>
                      <input 
                        type="text" placeholder="e.g. CS Year 1" value={batch.name} 
                        onChange={e => { const next = [...batches]; next[bi].name = e.target.value; setBatches(next); }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all shadow-sm"
                      />
                    </div>

                    {/* Right: Subjects */}
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Allocated Subjects</label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {batch.subjects.map((subj, si) => (
                          <div key={si} className="flex items-center bg-white border border-slate-200 rounded-xl p-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-50 transition-all shadow-sm">
                            <input 
                              type="text" placeholder="Subject Name" value={subj.name} 
                              onChange={e => { const next = [...batches]; next[bi].subjects[si].name = e.target.value; setBatches(next); }}
                              className="w-full bg-transparent px-3 text-sm font-medium outline-none text-slate-800"
                            />
                            <div className="w-px h-8 bg-slate-200 mx-2 shrink-0"></div>
                            <select 
                              value={subj.teacher_id} onChange={e => { const next = [...batches]; next[bi].subjects[si].teacher_id = e.target.value; setBatches(next); }}
                              className="bg-transparent text-sm font-bold text-slate-600 outline-none pr-1 cursor-pointer w-28 shrink-0 truncate"
                            >
                              {teachers.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                            </select>
                            <button onClick={() => { const next = [...batches]; next[bi].subjects = next[bi].subjects.filter((_, i) => i !== si); setBatches(next); }} className="p-2 ml-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => { const next = [...batches]; const nextId = Math.max(0, ...batches.flatMap(b => b.subjects.map(s => s.id))) + 1; next[bi].subjects.push({ id: nextId, name: '', teacher_id: teachers[0]?.id || 'T1' }); setBatches(next); }} 
                          className="flex items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm font-bold text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all"
                        >
                          <Plus className="w-5 h-5 mr-2" /> Add Subject
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
                <button 
                  onClick={() => setBatches([...batches, { name: '', subjects: [] }])} 
                  className="w-full py-5 border-2 border-dashed border-slate-300 bg-white text-slate-600 font-bold rounded-2xl hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-all flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-6 h-6 mr-2" /> Add New Batch
                </button>
              </div>
            </div>
          )}

          {/* 3. Combined Classes Editor */}
          {activeSection === 'combined' && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
              <div className="bg-emerald-50/50 px-6 py-4 md:px-8 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveSection(null)} className="p-2 mr-2 bg-white text-slate-400 hover:text-emerald-600 border border-slate-200 rounded-xl shadow-sm transition-all"><ArrowLeft className="w-5 h-5" /></button>
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><GitMerge className="w-5 h-5" /></div>
                  <h3 className="font-bold text-slate-800 text-xl">Combined Classes Editor</h3>
                </div>
                <button onClick={() => setActiveSection(null)} className="flex items-center justify-center text-sm font-bold text-white bg-emerald-600 px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Save & Close
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-6 min-h-[50vh]">
                {combined.map((item, ci) => (
                  <div key={ci} className="flex flex-col xl:flex-row gap-6 p-6 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm items-start xl:items-center">
                    
                    {/* Left: Info */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto shrink-0 xl:min-w-[450px]">
                      <input 
                        type="text" placeholder="Joint Class Name (e.g. AI Seminar)" value={item.name} 
                        onChange={e => { const next = [...combined]; next[ci].name = e.target.value; setCombined(next); }} 
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                      />
                      <select 
                        value={item.teacher_id} onChange={e => { const next = [...combined]; next[ci].teacher_id = e.target.value; setCombined(next); }}
                        className="w-full sm:w-40 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all shadow-sm cursor-pointer"
                      >
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                      </select>
                    </div>
                    
                    {/* Right: Batch Toggles */}
                    <div className="flex-1 flex flex-wrap gap-2.5 items-center xl:border-l border-slate-200 xl:pl-6 w-full">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-3">Link Batches:</span>
                      {batches.map((b, bi) => {
                        const isLinked = item.batch_indices.includes(bi);
                        return (
                          <button 
                            key={bi} 
                            onClick={() => { const next = [...combined]; next[ci].batch_indices = isLinked ? item.batch_indices.filter(x => x !== bi) : [...item.batch_indices, bi]; setCombined(next); }}
                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isLinked ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 shadow-sm'}`}
                          >
                            B{bi} {b.name && <span className="opacity-75 font-normal ml-1.5 border-l border-current pl-1.5">{b.name}</span>}
                          </button>
                        );
                      })}
                    </div>

                    <button onClick={() => setCombined(combined.filter((_, idx) => idx !== ci))} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all self-end xl:self-auto shrink-0 border border-slate-200 bg-white shadow-sm hover:border-rose-200">
                      <Trash2 className="w-5 h-5" />
                    </button>

                  </div>
                ))}
                
                <button onClick={() => setCombined([...combined, { name: '', teacher_id: teachers[0]?.id || 'T1', batch_indices: [] }])} className="w-full py-5 border-2 border-dashed border-slate-300 bg-white text-emerald-600 font-bold rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center justify-center shadow-sm">
                  <Plus className="w-6 h-6 mr-2" /> Define Linked Class
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Global Environment Minimal Input Box Component
function InputBox({ label, value, onChange, min = 1, max = 50 }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <input 
        type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-semibold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all shadow-sm"
      />
    </div>
  );
}

// Summary Card Component
function SummaryCard({ icon, title, subtitle, btnText, onClick, color }) {
  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  };

  const hoverMap = {
    indigo: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
    amber: 'hover:border-amber-400 hover:shadow-amber-500/10',
    emerald: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default group ${hoverMap[color]}`}>
      <div className="flex items-center space-x-4 mb-8">
        <div className={`p-4 border rounded-2xl transition-colors ${colorMap[color]} group-hover:bg-white`}>{icon}</div>
        <div className="text-left">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>
      <button 
        onClick={onClick} 
        className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-6 py-3 rounded-xl hover:bg-white hover:text-blue-600 transition-all shadow-sm w-full group-hover:border-slate-300"
      >
        {btnText}
      </button>
    </div>
  );
}