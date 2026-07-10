import { Link } from 'react-router-dom';
import { Layers, Zap, ShieldCheck, ArrowRight, GitBranch, Cpu, GraduationCap, Building2, Terminal } from 'lucide-react';

const blockColors = [
    'bg-amber-400 border-amber-500',
    'bg-emerald-400 border-emerald-500',
    'bg-blue-400 border-blue-500',
    'bg-rose-400 border-rose-500',
    'bg-purple-400 border-purple-500',
    'bg-slate-200 border-slate-300',
];

const getGridPattern = () => {
    return Array.from({ length: 36 }).map((_, i) => {
        if (i % 7 === 0 || i === 12 || i === 28) return 5;
        return (i * 7) % 5;
    });
};

export default function Landing() {
    const gridPattern = getGridPattern();

    return (
        <div className="w-full">
            {/* ========================================= */}
            {/* HERO SECTION                              */}
            {/* ========================================= */}
            <div className="relative flex flex-col items-center justify-between w-full min-h-[90vh] pt-12 pb-16 overflow-hidden animate-in fade-in duration-700">

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.85)_0%,rgba(248,250,252,1)_70%)] z-0"></div>

                    <div className="w-[800px] h-[800px] [transform-style:preserve-3d] relative animate-float-tensor opacity-50 md:opacity-80 z-10 scale-75 md:scale-100 mt-12">
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-3 p-6 bg-slate-100/50 border-2 border-slate-200/60 shadow-2xl rounded-2xl backdrop-blur-sm">
                            {gridPattern.map((colorIdx, i) => (
                                <div key={`base-${i}`} className={`rounded-md border-b-4 ${blockColors[colorIdx]} opacity-80 shadow-sm`}></div>
                            ))}
                        </div>

                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-3 p-6 border-2 border-white/20 rounded-2xl [transform:translateZ(80px)] pointer-events-none">
                            {gridPattern.map((colorIdx, i) => {
                                const isClash = i === 14;
                                const isRepairTarget = i === 21;

                                if (isClash) {
                                    return (
                                        <div key={`upper-${i}`} className="rounded-md border-2 border-rose-500 bg-rose-500/20 animate-pulse-clash backdrop-blur-md flex items-center justify-center shadow-lg shadow-rose-500/30">
                                            <Zap className="w-6 h-6 text-rose-600 drop-shadow-md" />
                                        </div>
                                    );
                                }
                                if (isRepairTarget) {
                                    return (
                                        <div key={`upper-${i}`} className="rounded-md border-2 border-dashed border-emerald-500 bg-emerald-500/10 flex items-center justify-center">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-50" />
                                        </div>
                                    );
                                }
                                return <div key={`upper-${i}`} className={`rounded-md ${colorIdx !== 5 ? 'bg-white/10 border border-white/20' : ''}`}></div>;
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative z-20 flex flex-col items-center text-center max-w-3xl px-4 mt-8 mb-16 w-full">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                        Automated Scheduling <br />
                        {/* <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            Seamlessly
                        </span> */}
                    </h1>
                    {/* <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium max-w-2xl mx-auto drop-shadow-sm">
                        Powered by Lightweight Matrix Heuristics. Generate zero-penalty, conflict-free academic timetables locally in seconds using a 3D Spatial-Temporal tensor.
                    </p> */}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="flex items-center bg-white border border-slate-200 text-slate-700 text-sm font-bold uppercase tracking-widest shadow-sm rounded-xl px-6 py-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-3 animate-pulse"></span>
                            Hybrid GA
                        </div>
                        <Link
                            to="/config"
                            className="flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                        >
                            Initialize Workspace <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div className="relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl w-full px-4 mt-auto">
                    <FeatureCard
                        icon={<Layers className="w-8 h-8 text-indigo-600" />}
                        title="Schema Preservation"
                        desc="Uniform column masking ensures intact daily schedules are never fragmented during optimization."
                        accent="bg-indigo-100 text-indigo-600"
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-amber-600" />}
                        title="Targeted Mutation"
                        desc="Pinpoints exact coordinate conflicts and executes intelligent, safe swaps natively."
                        accent="bg-amber-100 text-amber-600"
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
                        title="Zero-Penalty Guarantee"
                        desc="Exponential fitness scoring enforces spatial constraints while balancing faculty workloads."
                        accent="bg-emerald-100 text-emerald-600"
                    />
                </div>
            </div>

      {/* ========================================= */}
      {/* 2. CSS MATRIX DIAGRAM SECTION             */}
      {/* ========================================= */}
      <div className="bg-slate-50 py-24 border-t border-slate-200 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text Context */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-sm">
                Matrix Access Topology
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Vectorized <span className="text-blue-600">Access</span>
              </h2>
              <p className="text-lg leading-relaxed text-slate-600">
                Traditional scheduling algorithms rely on slow, flattened list arrays. This engine models the entire academic week as two-dimensional integer matrix. 
              </p>
              <p className="text-lg leading-relaxed text-slate-600">
                By maintaining the true 35×12 dimensional shape, the evolutionary loop evaluates entire concurrent time slots instantaneously via parallel batch extraction.
              </p>
            </div>

            {/* Right Column: 3D CSS Schematic */}
            <div className="relative flex items-center justify-center h-[500px] perspective-[2000px] order-1 lg:order-2 ml-0 lg:ml-4">
              
              {/* Central 3D Block Container (Larger, Chunkier "Square" Build) */}
              <div className="relative w-56 md:w-64 h-82 [transform-style:preserve-3d] [transform:rotateX(-15deg)_rotateY(-35deg)] transition-transform duration-700 ease-out hover:[transform:rotateX(-5deg)_rotateY(-25deg)] cursor-pointer group mt-8">
                
                {/* FRONT FACE */}
                <div className="absolute inset-0 bg-slate-50 border-[1.5px] border-slate-400 overflow-visible [transform:translateZ(96px)] shadow-sm">
                   {/* Grid Pattern (6 cols, 10 rows) */}
                   <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)', backgroundSize: '16.66% 10%' }}></div>
                   
                   {/* Highlighted Row (Front Face) */}
                   <div className="absolute top-[40%] left-0 w-full h-[10%] bg-slate-400 border-y border-slate-500"></div>

                   {/* ========================================= */}
                   {/* PROFESSIONAL 3D AXIS ARROWS               */}
                   {/* ========================================= */}

                   {/* Y-Axis: Temporal (Time Slots) */}
                   <div className="absolute bottom-0 -left-6 md:-left-8 w-[1.5px] h-[105%] bg-slate-800 pointer-events-none">
                       <div className="absolute -top-1 -left-[4px] w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-slate-800 [transform:rotate(45deg)]"></div>
                       <div className="absolute top-1/2 right-full mr-4 -translate-y-1/2 w-40 text-right">
                           <p className="font-bold text-slate-900 text-lg leading-tight">35 Time Slots</p>
                           <p className="text-sm text-slate-600">(5 Days × 7 Periods)</p>
                       </div>
                   </div>

                   {/* X-Axis: Entities (Batches) */}
                   <div className="absolute -bottom-6 md:-bottom-8 left-0 h-[1.5px] w-[105%] bg-slate-800 pointer-events-none">
                       <div className="absolute -right-1 -top-[4px] w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-slate-800 [transform:rotate(45deg)]"></div>
                       <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-48 text-center">
                           <p className="font-bold text-slate-900 text-lg">12 Student Batches</p>
                       </div>
                   </div>

                   {/* Callout Arrow: Parallel Batch Evaluation */}
                   {/* Arrow length pushes past the deep 3D right face to make the label readable */}
                   <div className="absolute top-[45%] left-full w-20 md:w-32 h-[1.5px] bg-slate-800 pointer-events-none">
                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 border-l-[1.5px] border-b-[1.5px] border-slate-800 [transform:rotate(45deg)]"></div>
                       <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-48 md:w-64 text-left">
                           <p className="font-bold text-slate-900 leading-tight text-lg">Parallel Batch Evaluation</p>
                           <p className="text-xs text-slate-600 mt-1">Horizontal extraction enables <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono font-bold">O(1)</code> vectorized lookup across all batches.</p>
                       </div>
                   </div>
                </div>

                {/* TOP FACE (Deep h-48 block matching the Z-translation) */}
                <div className="absolute bottom-full left-0 w-full h-48 bg-slate-100 border-[1.5px] border-slate-400 origin-bottom [transform:translateZ(96px)_rotateX(90deg)] overflow-hidden">
                  {/* Grid perfectly aligns: 6 cols (16.66%) matching front, 4 rows (25%) mapping depth */}
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)', backgroundSize: '16.66% 25%' }}></div>
                </div>
                
                {/* RIGHT FACE (Deep w-48 block matching the Z-translation) */}
                <div className="absolute top-0 left-full w-48 h-full bg-slate-200 border-[1.5px] border-slate-400 origin-left [transform:translateZ(96px)_rotateY(90deg)] overflow-hidden">
                   {/* Grid perfectly aligns: 4 cols (25%) matching top depth, 10 rows (10%) matching front */}
                   <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)', backgroundSize: '25% 10%' }}></div>
                   
                   {/* Highlighted Row (Right Face - Wraps perfectly around the corner) */}
                   <div className="absolute top-[40%] left-0 w-full h-[10%] bg-slate-400 border-y border-slate-500"></div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
           {/* ========================================= */}
            {/* SECONDARY SECTION: Details & Origins        */}
            {/* ========================================= */}
            <div className="bg-slate-50 text-slate-900 pb-24 px-4 w-full">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center pt-12 border-t border-slate-200">

                    {/* Left Column: Work Principle */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">The Core Engine</h2>
                            <div className="w-20 h-1.5 bg-blue-600 rounded-full mb-6"></div>
                            <p className="text-lg leading-relaxed text-slate-600">
                                The University Course Timetabling Problem (UCTP) is an NP-hard optimization problem that involves generating conflict-free timetables while satisfying multiple scheduling constraints. The proposed system addresses this challenge using a three-phase matrix-based Genetic Algorithm.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <ProcessStep
                                number="01"
                                title="O(1) Data Structuring"
                                desc="Human-readable JSON constraints are flattened into a high-speed 35x12 two-dimensional integer matrix, bypassing heavy graph construction entirely."
                            />
                            <ProcessStep
                                number="02"
                                title="Stochastic Bootstrapping"
                                desc="A deterministic Generation 0 is built utilizing an Anchor Technique to lock combined classes, alongside a greedy sort to place the busiest faculty first."
                            />
                            <ProcessStep
                                number="03"
                                title="Evolutionary Resolution"
                                desc="The engine cycles through column-masked crossover and coordinate-specific mutation until the exponential penalty score collapses precisely to zero."
                            />
                        </div>
                    </div>
{/* Right Column: Project Origins & Links */}
          <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
             {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 text-slate-100 opacity-60 pointer-events-none">
              <Cpu className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
                  <Terminal className="w-6 h-6 mr-3 text-blue-600" /> Project Submission
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  "Automatic Class Scheduling Using Genetic Algorithm"
                </p>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Thesis submitted in partial fulfillment of the requirements for the 8th Semester B.Tech. degree. Built to transition abstract evolutionary mathematics into a fully deployable web application.
                </p>
              </div>

              <div className="space-y-4">
                <InfoRow icon={<GraduationCap />} label="Degree" value="B.Tech in Computer Science & Engineering" />
                <InfoRow icon={<Building2 />} label="Institution" value="University of Kalyani, India" />
                <InfoRow icon={<Terminal />} label="Submitted By" value="Somnath Pandit" />
                <InfoRow icon={<Terminal />} label="Under Guidance Of" value="Mr. Jaydeep Paul, Asst. Prof." />
              </div>

              <div className="pt-6 border-t border-slate-200">
                <a 
                  href="https://github.com/somnath503/ga-schedular" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  <GitBranch className="w-6 h-6 mr-3 text-slate-300" /> View Source Code
                </a>
                <p className="text-center text-xs text-slate-400 mt-4 font-mono">
                  June 2026 • v1.0.0-production
                </p>
              </div>
            </div>
          </div>

                </div>
            </div>

        </div>
    );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function FeatureCard({ icon, title, desc, accent }) {
    return (
        <div className="group bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-md border border-slate-200 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className={`w-14 h-14 ${accent} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
        </div>
    );
}

function ProcessStep({ number, title, desc }) {
    return (
        <div className="flex items-start">
            <div className="flex-shrink-0 text-3xl font-black text-blue-100 mr-6 font-mono leading-none mt-1">
                {number}
            </div>
            <div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">{title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-center text-sm">
            <div className="text-blue-500 mr-4 w-5 h-5 flex justify-center">
                {icon}
            </div>
            <div>
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bold mb-0.5">{label}</span>
                <span className="text-slate-700 font-bold">{value}</span>
            </div>
        </div>
    );
}