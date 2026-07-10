
// Math & Array Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSample = (arr, k) => [...arr].sort(() => 0.5 - Math.random()).slice(0, k);
const shuffle = (array) => array.sort(() => 0.5 - Math.random());
const unique = (array) => [...new Set(array)];
const deepCopy = (matrix) => matrix.map(row => [...row]);

//Payload Transformer 
function adaptPayload(req) {
  const days = parseInt(req.days);
  const periods = parseInt(req.periods);
  const lunchIdx = parseInt(req.lunch_period) - 1;
  const lunchRows = Array.from({ length: days }, (_, i) => lunchIdx + i * periods);

  const catalog = {};
  const combinedLookup = {};
  const batchReqs = [];

  req.batches.forEach(b => {
    b.subjects.forEach(s => { catalog[Number(s.id)] = { t: String(s.teacher_id), s: String(s.name) }; });
  });

  (req.combined_classes || []).forEach((c, ci) => {
    const combId = 1000 + ci;
    combinedLookup[combId] = { b: c.batch_indices, t: String(c.teacher_id), s: String(c.name) };
    catalog[combId] = { t: String(c.teacher_id), s: String(c.name) };
  });

  req.batches.forEach((b, bi) => {
    const reqs = b.subjects.map(s => Number(s.id));
    (req.combined_classes || []).forEach((c, ci) => {
      if (c.batch_indices.includes(bi)) reqs.push(1000 + ci);
    });
    batchReqs.push(reqs);
  });

  return { days, periods, lunch_rows: lunchRows, max_rooms: parseInt(req.max_rooms), catalog, combined_lookup: combinedLookup, batch_reqs: batchReqs, generations: parseInt(req.generations), population_size: parseInt(req.population_size) };
}

//The Genetic Algorithm
class GeneticSchedulerJS {
  constructor(payload) {
    this.DAYS = payload.days;
    this.PERIODS = payload.periods;
    this.TOTAL_SLOTS = this.DAYS * this.PERIODS;
    this.LUNCH_ROWS = payload.lunch_rows;
    this.BATCH_REQS = payload.batch_reqs;
    this.BATCHES = this.BATCH_REQS.length;
    this.MAX_ROOMS = payload.max_rooms;
    this.CATALOG = payload.catalog;
    this.COMBINED_LOOKUP = payload.combined_lookup;

    this.T_CODE_TO_INT = { "None": 0, "TBA": 0 };
    let tSet = new Set();
    Object.values(this.CATALOG).forEach(v => { if (v.t && v.t !== "None" && v.t !== "TBA") tSet.add(v.t); });
    Array.from(tSet).sort().forEach((t, i) => { this.T_CODE_TO_INT[t] = i + 1; });

    let maxId = Math.max(...Object.keys(this.CATALOG).map(Number), 0);
    this.SUBJ_TO_TEACHER = new Array(maxId + 1).fill(0);
    Object.entries(this.CATALOG).forEach(([k, v]) => {
      this.SUBJ_TO_TEACHER[Number(k)] = this.T_CODE_TO_INT[v.t] || 0;
    });
  }

  createIndividual() {
    let matrix = Array.from({ length: this.TOTAL_SLOTS }, () => new Array(this.BATCHES).fill(0));
    let validSlots = Array.from({ length: this.TOTAL_SLOTS }, (_, i) => i).filter(s => !this.LUNCH_ROWS.includes(s));
    
    // 1. PLACE COMBINED CLASSES (Anchors)
    Object.entries(this.COMBINED_LOOKUP).forEach(([subjId, info]) => {
      let placed = 0;
      let batches = info.b;
      shuffle(validSlots);
      for (let slot of validSlots) {
        if (placed >= 2) break; // Meets twice a week
        
        let day = Math.floor(slot / this.PERIODS);
        let daySlots = Array.from({ length: this.PERIODS }, (_, i) => day * this.PERIODS + i);
        let hasCombined = daySlots.some(ds => batches.some(b => this.COMBINED_LOOKUP[matrix[ds][b]]));
        let batchesFree = batches.every(b => matrix[slot][b] === 0);
        let activeRooms = unique(matrix[slot].filter(s => s > 0)).length;
        
        if (batchesFree && !hasCombined && activeRooms < this.MAX_ROOMS) {
          batches.forEach(b => matrix[slot][b] = Number(subjId));
          placed++;
        }
      }
    });

    let teacherMatrix = matrix.map(row => row.map(s => this.SUBJ_TO_TEACHER[s] || 0));
    let tasks = [];
    
    // 2. PREPARE SINGLE CLASSES
    for (let bIdx = 0; bIdx < this.BATCHES; bIdx++) {
      let pool = this.BATCH_REQS[bIdx].filter(s => !this.COMBINED_LOOKUP[s]);
      
      // Push each subject TWICE so they meet 2 times a week
      pool.forEach(s => { 
        tasks.push([bIdx, Number(s), this.SUBJ_TO_TEACHER[Number(s)]]);
        tasks.push([bIdx, Number(s), this.SUBJ_TO_TEACHER[Number(s)]]);
      });
    }

    let workloads = {};
    tasks.forEach(t => { workloads[t[2]] = (workloads[t[2]] || 0) + 1; });
    
    tasks.sort((a, b) => workloads[b[2]] - workloads[a[2]] || Math.random() - 0.5);

    // 3. PLACE SINGLE CLASSES
    for (let [bIdx, subjId, teacherId] of tasks) {
      let availableSlots = Array.from({ length: this.TOTAL_SLOTS }, (_, i) => i)
                           .filter(s => !this.LUNCH_ROWS.includes(s) && matrix[s][bIdx] === 0);
      shuffle(availableSlots);
      let placed = false;

      for (let slot of availableSlots) {
        let day = Math.floor(slot / this.PERIODS);
        let daySlots = Array.from({ length: this.PERIODS }, (_, i) => day * this.PERIODS + i);
        
        if (unique(matrix[slot].filter(s => s > 0)).length >= this.MAX_ROOMS) continue;
        
        if (!teacherMatrix[slot].includes(teacherId) && !daySlots.some(ds => matrix[ds][bIdx] === subjId)) {
          matrix[slot][bIdx] = subjId;
          teacherMatrix[slot][bIdx] = teacherId;
          placed = true;
          break;
        }
      }

      if (!placed) {
        for (let slot of availableSlots) {
          if (unique(matrix[slot].filter(s => s > 0)).length >= this.MAX_ROOMS) continue;
          if (!teacherMatrix[slot].includes(teacherId)) {
            matrix[slot][bIdx] = subjId;
            teacherMatrix[slot][bIdx] = teacherId;
            placed = true;
            break;
          }
        }
      }

      if (!placed && availableSlots.length > 0) {
        let fSlot = availableSlots[0];
        matrix[fSlot][bIdx] = subjId;
        teacherMatrix[fSlot][bIdx] = teacherId;
      }
    }
    return matrix;
  }

  calculateFitness(matrix) {
    let penalty = 0;
    
    // Diagnostic breakdown object
    let breakdown = {
      clashes: 0,
      syncErrors: 0,
      lunchViolations: 0,
      roomOverflows: 0,
      dailyDuplicates: 0,
      teacherOverload: 0,
      missingClasses: 0
    };

    let teacherMatrix = matrix.map(row => row.map(s => this.SUBJ_TO_TEACHER[s] || 0));

    // 1. Teacher Clashes
    for (let row = 0; row < this.TOTAL_SLOTS; row++) {
      if (this.LUNCH_ROWS.includes(row)) continue;
      let activeTeachers = unique(matrix[row].filter(s => s > 0)).map(s => this.SUBJ_TO_TEACHER[s]);
      let validTeachers = activeTeachers.filter(t => t > 0);
      if (validTeachers.length > unique(validTeachers).length) {
        let errs = (validTeachers.length - unique(validTeachers).length);
        // INCREASED from 1000 to 5000 to make clashes "very bad"
        penalty += errs * 5000; 
        breakdown.clashes += errs;
      }
    }

    // 2. Combined Sync
    Object.entries(this.COMBINED_LOOKUP).forEach(([subjId, info]) => {
      let batches = info.b;
      for (let row = 0; row < this.TOTAL_SLOTS; row++) {
        let presence = batches.map(b => matrix[row][b] === Number(subjId));
        if (presence.some(p => p) && !presence.every(p => p)) {
          penalty += 500;
          breakdown.syncErrors += 1;
        }
      }
    });

    // 3. Lunch Violations
    this.LUNCH_ROWS.forEach(r => { 
      let errs = matrix[r].filter(s => s > 0).length;
      penalty += errs * 50; 
      breakdown.lunchViolations += errs;
    });
    
    // Room Capacity
    for (let row = 0; row < this.TOTAL_SLOTS; row++) {
      if (this.LUNCH_ROWS.includes(row)) continue;
      let activeSubjs = unique(matrix[row].filter(s => s > 0));
      if (activeSubjs.length > this.MAX_ROOMS) {
        let errs = (activeSubjs.length - this.MAX_ROOMS);
        penalty += errs * 500;
        breakdown.roomOverflows += errs;
      }
    }

    // 4. Daily Overload & Duplicates
    for (let d = 0; d < this.DAYS; d++) {
      let dayStart = d * this.PERIODS;
      let dayEnd = dayStart + this.PERIODS;
      
      // Duplicates
      for (let b = 0; b < this.BATCHES; b++) {
        let dClasses = [];
        for (let r = dayStart; r < dayEnd; r++) { if (matrix[r][b] > 0) dClasses.push(matrix[r][b]); }
        let errs = (dClasses.length - unique(dClasses).length);
        if (errs > 0) {
          penalty += errs * 500;
          breakdown.dailyDuplicates += errs;
        }
      }

      // Teacher Load
      Object.values(this.T_CODE_TO_INT).forEach(tId => {
        if (tId === 0) return;
        let weekly = 0;
        teacherMatrix.forEach(row => { if(row.includes(tId)) weekly++; });
        let limit = Math.max(2, Math.ceil(weekly / this.DAYS));
        
        let daily = 0;
        for (let r = dayStart; r < dayEnd; r++) { if (teacherMatrix[r].includes(tId)) daily++; }
        if (daily > limit) {
          let errs = (daily - limit);
          penalty += errs * 10;
          breakdown.teacherOverload += errs;
        }
      });
    }

    // 5. MISSING CLASSES (Strict Number Typing applied!)
    for (let b = 0; b < this.BATCHES; b++) {
      let reqs = this.BATCH_REQS[b];
      let col = matrix.map(row => row[b]); 
      
      reqs.forEach(subjId => {
        let count = col.filter(id => Number(id) === Number(subjId)).length;
        if (count < 2) {
          let missingCount = (2 - count);
          // This forces the GA to place the class even if it creates a clash
          penalty += missingCount * 10000; 
          breakdown.missingClasses += missingCount;
        }
      });
    }

    return { fitness: Math.exp(-0.02 * penalty), penalty, breakdown };
  }
  
  tournamentSelection(population, k = 3) {
    let selected = randomSample(population, k);
    selected.sort((a, b) => b.fitness - a.fitness);
    return deepCopy(selected[0].matrix);
  }

  smartMutation(matrix, mutationRate = 0.2) {
    if (Math.random() > mutationRate) return matrix;
    let r1 = randomInt(0, this.TOTAL_SLOTS - 1);
    let r2 = randomInt(0, this.TOTAL_SLOTS - 1);
    let c = randomInt(0, this.BATCHES - 1);
    if (!this.LUNCH_ROWS.includes(r1) && !this.LUNCH_ROWS.includes(r2)) {
      if (!this.COMBINED_LOOKUP[matrix[r1][c]] && !this.COMBINED_LOOKUP[matrix[r2][c]]) {
        let temp = matrix[r1][c];
        matrix[r1][c] = matrix[r2][c];
        matrix[r2][c] = temp;
      }
    }
    return matrix;
  }

  runEvolution(popSize, generations) {
    let population = Array.from({ length: popSize }, () => {
      let mat = this.createIndividual();
      return { matrix: mat, ...this.calculateFitness(mat) };
    });

    for (let gen = 0; gen < generations; gen++) {
      population.sort((a, b) => b.fitness - a.fitness);
      if (population[0].penalty === 0) break;

      let nextPop = [population[0], population[1]]; // Elitism
      while (nextPop.length < popSize) {
        let p1 = this.tournamentSelection(population);
        let childMatrix = this.smartMutation(deepCopy(p1), 0.3);
        nextPop.push({ matrix: childMatrix, ...this.calculateFitness(childMatrix) });
      }
      population = nextPop;
    }
    population.sort((a, b) => b.fitness - a.fitness);
    
    // ── MASSIVE DIAGNOSTIC LOG ──
    console.log(" GA EVOLUTION COMPLETE");
    console.log("Final Penalty:", population[0].penalty);
    console.table(population[0].breakdown);
    
    
    return { schedule: population[0].matrix, 
        penalty: population[0].penalty,
    breakdown: population[0].breakdown
 };
  }
}

// Wrap in async function to prevent UI freeze
export const generateScheduleAsync = async (reqPayload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const payload = adaptPayload(reqPayload);
      const scheduler = new GeneticSchedulerJS(payload);
      const result = scheduler.runEvolution(payload.population_size, payload.generations);
      resolve(result);
    }, 50);
  });
};