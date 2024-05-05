import { v4 as uuid } from "uuid";
import dash, { List } from "lodash";
// import { UUID } from "crypto";
import { Params, flip } from "./utils";

export class Swarm<T> extends Set<T> {
  constructor(instance?: Swarm<T> | Array<T> | T) {
    super(); // Initialize an empty Set first
    if (instance !== undefined) {
      if (Symbol.iterator in Object(instance)) {
        for (const item of instance as Iterable<T>) {
          this.add(item);
        }
      } else {
        this.add(instance as T);
      }
    }
  }

  join(instance?: Swarm<T> | T): Swarm<T> {
    if (instance === undefined) {
      return this;
    } else if (instance instanceof Swarm) {
      for (const t of instance) this.add(t);
    } else {
      this.add(instance);
    }
    return this;
  }

  choice(): T {
    const _set = [...this];
    const _index = Math.floor(Math.random() * this.size);
    return _set[_index];
  }

  choices(i: number = 1): Swarm<T> {
    let _swarm = new Swarm<T>();
    while (i-- > 0) _swarm.add(this.choice());
    return _swarm;
  }

  filter(func: (value: T) => boolean): Swarm<T> {
    let _swarm = new Swarm<T>();
    for (const _value of this) {
      if (func(_value)) _swarm.add(_value);
    }
    return _swarm;
  }

  map(func: (value: T) => any): Swarm<any> {
    let _swarm = new Swarm<any>();
    for (const value of this) {
      _swarm.add(func(value));
    }
    return _swarm;
  }

  reduce(func: (before: T, after: T) => T): T {
    let result = this.select;
    for (const value of this) {
      result = func(result, value);
    }
    return result;
  }

  clone(): Swarm<T> {
    let _swarm = new Swarm<T>();
    for (const _value of this) _swarm.add(_value);
    return _swarm;
  }

  difference(other: Swarm<T>): Swarm<T> {
    return this.filter((x) => !other.has(x));
  }

  get select(): T {
    return [...this][0];
  }
}

export class Qualia {
  /**
   * 性質：
   *  時間経過とともに抽象化・簡素化されていく
   *  想起回数に応じて固着していく
   * ・宣言的記憶（事象・情報）→ str
   * ・非宣言的記憶（スキル・習慣）→ int, List[int]
   */
  public fragment: Team | any;
  private static _phrases: Swarm<Qualia> = new Swarm<Qualia>();

  constructor(_instance: Qualia | Team | any | undefined) {
    if (_instance instanceof Qualia) {
      this.fragment = _instance.fragment;
    } else if (_instance instanceof Team) {
      this.fragment = _instance;
    } else if (_instance) {
      this.fragment = _instance;
      Qualia._phrases.add(this);
    } else {
      this.fragment = Qualia._phrases.choice();
    }
  }

  public isAtomic() {
    if (this.fragment instanceof Team) {
      return false;
    } else {
      return true;
    }
  }

  public add(_fragment: Team | any) {
    this.fragment = _fragment;
  }

  public compose(state: any, visited: Swarm<string>, args: any): any {
    if (this.fragment instanceof Team) {
      return this.fragment.compose(state, visited, args);
    } else {
      return this.fragment;
    }
  }

  public mutate(mutateParams: Params, learner: Learner, teams?: Swarm<Team>) {
    if (flip(mutateParams["pMemAtom"])) {
      if (!this.isAtomic()) this.fragment.inLearners.remove(learner);
      this.fragment = Qualia.phrases.filter((x) => x !== this).choice();
    } else if (teams instanceof Swarm) {
      const selectionPool = teams.filter((t) => t !== this.fragment);
      if (selectionPool.size > 0) {
        if (!this.isAtomic()) this.fragment.inLearners.remove(learner);
        this.fragment = selectionPool.choice();
        this.fragment.inLearners.add(learner);
      }
    }
    return;
  }

  public static setPhrases(_phrases: Swarm<Qualia>) {
    Qualia._phrases = _phrases;
  }

  public static get phrases(): Swarm<Qualia> {
    return Qualia._phrases;
  }

  *[Symbol.iterator]() {
    for (let f of this.fragment) {
      yield f;
    }
  }
}

/**
 * calculation state bit
 * @param instructions [:][0]: operations
 * @param instructions [:][1]: destinations
 * @param instructions [:][2]: leftOperands
 * @param instructions [:][3]: rightOperands
 */
export class Program {
  public instructions: Array<any>;
  public id: string;
  private static programs: Swarm<Program> = new Swarm<Program>();

  constructor(_instance?: Program | number, _id?: string, maxVal: number = 40) {
    this.id = _id ? _id : uuid();
    if (_instance instanceof Program) {
      this.instructions = dash.cloneDeep(_instance.instructions);
    } else if (typeof _instance === "number") {
      this.instructions = Array.from({ length: maxVal }, () =>
        Array.from({ length: 4 }, () => Math.floor(Math.random() * _instance))
      );
    } else {
      this.instructions = Array.from({ length: maxVal }, () =>
        Array.from({ length: 4 }, () => Math.floor(Math.random() * 4))
      );
    }
    Program.programs.add(this);
  }

  public execute(
    state: any,
    registers: Array<number>,
    args: any
  ): Array<number> {
    let target = [...registers, ...state];
    let memory = registers;
    for (let i = 0; i < this.instructions.length; i++) {
      const o = this.instructions[i][0];
      const d = this.instructions[i][1] % memory.length;
      const l = this.instructions[i][2] % target.length;
      const r = this.instructions[i][3] % target.length;
      memory[d] = this.operation(o, target[l], target[r]);
    }
    return memory;
  }

  public mutate(mutateParams: Params) {
    this.id = uuid();
    const original = dash.cloneDeep(this.instructions);

    while (dash.isEqual(this.instructions, original)) {
      if (this.instructions.length > 1 && flip(mutateParams["pInstDel"])) {
        // delete
        this.instructions.splice(
          Math.floor(Math.random() * (this.instructions.length - 1)),
          1
        );
      } else if (
        this.instructions.length > 1 &&
        flip(mutateParams["pInstSwp"])
      ) {
        // swap
        const idx1 = Math.floor(Math.random() * this.instructions.length);
        const idx2 = Math.floor(Math.random() * this.instructions.length);
        const tmp = [...this.instructions[idx1]];
        this.instructions[idx1] = this.instructions[idx2];
        this.instructions[idx2] = tmp;
      } else if (flip(mutateParams["pInstMut"])) {
        // mutate
        const idx1 = Math.floor(Math.random() * this.instructions.length);
        const idx2 = Math.floor(Math.random() * 4);
        let _maxVal: number = 0;
        switch (idx2) {
          case 0:
            _maxVal = mutateParams["nOperations"];
            break;
          case 1:
            _maxVal = mutateParams["nDestinations"];
            break;
          case 2:
            _maxVal = mutateParams["inputSize"];
            break;
          case 3:
            _maxVal = mutateParams["inputSize"];
            break;
        }
        this.instructions[idx1][idx2] = Math.floor(Math.random() * _maxVal);
      } else if (flip(mutateParams["pInstAdd"])) {
        // add
        const idx1 = Math.floor(Math.random() * this.instructions.length);
        this.instructions.splice(idx1, 0, [
          Math.floor(Math.random() * mutateParams["nOperations"]),
          Math.floor(Math.random() * mutateParams["nDestinations"]),
          Math.floor(Math.random() * mutateParams["inputSize"]),
          Math.floor(Math.random() * mutateParams["inputSize"]),
        ]);
      }
    }
  }

  private operation(i: number, l: number, r: number): number {
    try {
      switch (i) {
        case 0:
          return l + r;
        case 1:
          return l - r;
        case 2:
          return -l;
        case 3:
          return -r;
        case 4:
          return l ** r;
        case 5:
          return Math.log(l);
        case 6:
          return Math.log(r);
        default:
          return l;
      }
    } catch {
      return l;
    }
  }
}

export class Learner {
  public phrase: Qualia;
  public program: Program;
  public registers: Array<any>;
  public inTeam: Swarm<Team>;
  public bit: number;
  public id: string;
  private static _learners: Swarm<Learner> = new Swarm<Learner>();

  constructor(
    _phrase?: Qualia,
    _program?: Program,
    _inTeam?: Swarm<Team> | Team,
    _id?: string
  ) {
    this.phrase = new Qualia(_phrase);
    this.program = new Program(_program);
    this.registers = Array.from({ length: 8 }, () => 0);
    this.inTeam = new Swarm<Team>();
    this.inTeam.join(_inTeam);
    this.id = _id ? _id : uuid();
    this.bit = Infinity;
    Learner._learners.add(this);
  }

  public isAtomic(): boolean {
    return this.phrase.isAtomic();
  }

  public mutate(mutateParams: Params, teams: Swarm<Team>) {
    let changed = false;
    while (!changed) {
      // mutate the program
      if (flip(mutateParams["pProgMut"])) {
        changed = true;
        this.program.mutate(mutateParams);
      }
      // mutate the phrase
      if (flip(mutateParams["pPhrMut"])) {
        changed = true;
        this.phrase.mutate(mutateParams, this, teams);
      }
    }
  }

  public add(_team: Team) {
    _team.inLearners.add(this);
    this.phrase.add(this);
  }

  public bid(state: any, args: any): number {
    this.program.execute(state, this.registers, args);
    return this.registers[0];
  }

  public compose(state: any, visited: Swarm<string>, args: any): Qualia {
    return this.phrase.compose(state, visited, args);
  }

  public join(_inTeam: Swarm<Team> | Team) {
    this.inTeam.join(_inTeam);
  }

  public clone(): Learner {
    return new Learner(this.phrase, this.program, this.inTeam);
  }
}

export class Team {
  public learners: Swarm<Learner>;
  public inLearners: Swarm<Learner>;
  public outcomes: Map<string, number>;
  public fitness: number;
  public id: string;
  private extinction: number;
  public static _teams: Swarm<Team> = new Swarm<Team>();

  constructor(
    _learners?: Swarm<Learner> | Learner,
    _inLearners?: Swarm<Learner> | Learner,
    _outcomes?: Map<string, number>,
    _fitness?: number,
    _id?: string
  ) {
    this.learners = new Swarm<Learner>();
    this.inLearners = new Swarm<Learner>();
    this.outcomes = new Map(_outcomes);
    this.fitness = _fitness ? _fitness : 0;
    this.learners.join(_learners);
    this.inLearners.join(_inLearners);
    this.id = _id ? _id : uuid();
    this.extinction = 1.0;
    Team._teams.add(this);
  }

  get isRoot() {
    return this.inLearners.size === 0 ? true : false;
  }

  public static get teams(): Swarm<Team> {
    return Team._teams;
  }

  public numAtomic(): number {
    let num = 0;
    for (let lrn of this.learners) if (lrn.isAtomic()) num++;
    return num;
  }

  public compose(state: any, visited: Swarm<string>, args: any) {
    visited.add(this.id);
    // this.extinction*=0.9;
    if (this.learners.size < 1) {
      console.log("0 valid");
      this.add(new Learner());
    }

    const nonVisited = this.learners.filter(
      (lrn) => lrn.isAtomic() || !visited.has(lrn.id)
    );
    if (nonVisited.size < 1) {
      const clone = this.learners.choice().clone();
      clone.phrase.mutate(args, clone);
      this.add(clone);
      nonVisited.add(clone);
    }

    // bid calculate
    const topLearner: Learner = nonVisited
      .map((x) => {
        x.bid(state, args);
        return x;
      })
      .reduce(
        (before: Learner, after: Learner): Learner =>
          before.registers[0] < after.registers[0] ? before : after
      );

    return topLearner.compose(state, visited, args);
  }

  public remove(learner: Learner): boolean {
    return learner.inTeam.delete(this) && this.learners.delete(learner);
  }

  public add(learner: Learner): void {
    learner.inTeam.add(this);
    this.learners.add(learner);
  }

  public join(_inLearner: Swarm<Learner>): void {
    for (const learner of _inLearner) learner.add(this);
  }

  public clear(): void {
    for (const learner of this.learners) learner.inTeam.delete(this);
    this.learners.clear();
  }

  public mutate(
    mutateParams: Params,
    learners: Swarm<Learner>,
    teams: Swarm<Team>
  ): [number, Swarm<Learner>] {
    let rampantReps: number;
    let newLearner = new Swarm<Learner>();

    if (
      mutateParams["rampantGen"] !== 0 &&
      mutateParams["rampantMin"] > mutateParams["rampantMax"]
    ) {
      throw Error(
        "Min rampant iterations is greater than max rampant iterations!"
      );
    }
    if (
      mutateParams["rampantGen"] > 0 &&
      mutateParams["generation"] % mutateParams["rampantGen"] === 0 &&
      mutateParams["generation"] > mutateParams["rampantGen"]
    ) {
      rampantReps = mutateParams["rampantMax"]
        ? Math.floor(
            Math.random() *
              (mutateParams["rampantMax"] - mutateParams["rampantMin"] + 1) +
              mutateParams["rampantMin"]
          )
        : mutateParams["rampantMin"];
    } else {
      rampantReps = 1;
    }

    for (let i = 0; i < rampantReps; i++) {
      let deleted = this.mutationDelete(mutateParams["pLrnDel"]);
      let selectionPool = learners
        .filter((lrn) => !this.learners.has(lrn))
        .filter((lrn) => !this.inLearners.has(lrn))
        .filter((lrn) => !deleted.has(lrn));
      let added = this.mutationAdd(
        mutateParams["pLrnAdd"],
        mutateParams["maxTeamSize"],
        selectionPool
      );
      let [mutated, _new] = this.mutationMutate(
        mutateParams["pLrnMut"],
        mutateParams,
        teams
      );
      newLearner.join(_new);
    }
    return [rampantReps, newLearner];
  }

  public clone(): Team {
    return new Team(
      this.learners,
      this.inLearners,
      this.outcomes,
      this.fitness
    );
  }

  private mutationDelete(prob: number): Swarm<Learner> {
    let preProb = prob;
    let delLearner = new Swarm<Learner>();

    if (prob == 0.0) return delLearner;
    else if (prob >= 1.0)
      throw Error("pLrnDel is greater than or equal to 1.0!");
    else if (this.numAtomic() < 1)
      throw Error("Less than one atomic in team! This shouldn't happen");

    while (flip(prob) && this.learners.size > 2) {
      prob *= preProb;
      let select: Learner;
      if (this.numAtomic() > 1) {
        select = this.learners.choice();
      } else {
        select = this.learners.filter((lrn) => !lrn.isAtomic()).choice();
      }
      delLearner.add(select);
      this.remove(select);
    }

    return delLearner;
  }

  private mutationAdd(
    prob: number,
    maxTeamSize: number,
    selectionPool: Swarm<Learner>
  ): Swarm<Learner> {
    let preProb = prob;
    let addLearner = new Swarm<Learner>();

    if (
      prob == 0.0 ||
      selectionPool.size === 0 ||
      (maxTeamSize > 0 && this.learners.size >= maxTeamSize)
    )
      return addLearner;
    else if (prob >= 1.0)
      throw Error("pLrnAdd is greater than or equal to 1.0!");

    while (
      flip(prob) &&
      (maxTeamSize <= 0 || this.learners.size < maxTeamSize)
    ) {
      if (this.learners.size === 0) break;
      prob *= preProb;
      let learner = selectionPool.choice();
      selectionPool.delete(learner);

      this.add(learner);
    }

    return addLearner;
  }

  private mutationMutate(
    prob: number,
    mutateParams: Params,
    teams: Swarm<Team>
  ): [Swarm<Learner>, Swarm<Learner>] {
    let mutLearner = new Swarm<Learner>();
    let mtdLearner = new Swarm<Learner>();
    let origin = new Swarm<Learner>(this.learners);

    for (const learner of origin) {
      if (flip(prob)) {
        let pAtom: number | undefined;
        if (this.numAtomic() === 1 && learner.isAtomic()) pAtom = 1.1;
        else pAtom = mutateParams["pAtom"];

        const newLearner = learner.clone();
        this.add(newLearner);
        newLearner.mutate(mutateParams, teams);
        mutLearner.add(learner);
        mtdLearner.add(newLearner);
      }
    }
    return [mutLearner, mtdLearner];
  }
}

export class Agent {
  public score: number;
  private args: any[];
  private visited: Swarm<string>;
  private static _agents: Swarm<Agent> = new Swarm<Agent>();

  constructor(private readonly team: Team, ...args: any[]) {
    this.team = team;
    this.score = 0.0;
    this.args = args;
    this.visited = new Swarm<string>();
    Agent._agents.add(this);
  }

  public describe() {
    console.log(`${this.constructor.name}: {${this.team.id}, ${this.score}}`);
  }

  public compose(state: any) {
    this.visited = new Swarm<string>();
    return this.team.compose(state, this.visited, this.args);
  }

  public reward(task: string = "task") {
    this.team.outcomes.set(task, this.score);
  }

  get id() {
    return this.team.id;
  }
}

export class Tpg {
  private teamPopSize: number;
  public teams: Swarm<Team>;
  public learners: Swarm<Learner>;
  public phrases: Swarm<Qualia>;
  public generations: number;
  public mutateParams: Params;
  public id: string;

  constructor(
    _phrases: Swarm<Qualia> | Qualia,
    _teams?: Swarm<Team> | Team,
    _learners?: Swarm<Learner> | Learner,
    _teamPopSize?: number,
    _generations?: number,
    _mutateParams?: Params,
    _id?: string
  ) {
    this.teamPopSize = _teamPopSize ? _teamPopSize : 10;
    this.teams = new Swarm<Team>();
    this.learners = new Swarm<Learner>();
    this.phrases = new Swarm<Qualia>();
    this.learners.join(_learners);
    this.teams.join(_teams);
    this.phrases.join(_phrases);
    this.id = _id ? _id : uuid();
    this.generations = _generations ? _generations : 1;
    this.mutateParams = _mutateParams
      ? _mutateParams
      : {
          generation: this.generations,
          maxTeamSize: Infinity,
          pLrnAdd: 0.6,
          pLrnDel: 0.7,
          pLrnMut: 0.2,
          pProgMut: 0.1,
          pMemAtom: 0.95,
          pMemMut: 0.1,
          pInstAdd: 0.4,
          pInstDel: 0.5,
          pInstMut: 1.0,
          pInstSwp: 0.2,
          nOperations: 18,
          nDestinations: 40,
          inputSize: 40,
          initMaxProgSize: 10,
          rampantGen: 0,
          rampantMin: 0,
          rampantMax: 0,
          idCountTeam: 0,
          idCountLearner: 0,
          idCountProgram: 0,
        };
    // Qualia.setPhrases(this.phrases);
    if (_teamPopSize) {
      this.initialize(_teamPopSize);
    }
  }

  get rootTeams() {
    return this.teams.filter((t) => t.isRoot);
  }

  set setPhrases(_phrases: Swarm<Qualia> | Qualia) {
    this.phrases.join(_phrases);
    this.initialize();
  }

  private initialize(initLearners: number = 10) {
    for (let i = 0; i < this.teamPopSize; i++) {
      const p1 = this.phrases.choice();
      const p2 = this.phrases.choice();
      const l1 = new Learner(p1);
      const l2 = new Learner(p2);
      this.learners.add(l1);
      this.learners.add(l2);
      const team = new Team();
      team.add(l1);
      team.add(l2);
      const moreLearners = Math.floor(Math.random() * initLearners);
      for (let j = 0; j < moreLearners; j++) {
        const pn = this.phrases.choice();
        const ln = new Learner(pn);
        team.add(ln);
        this.learners.add(ln);
      }
      this.teams.add(team);
    }
  }

  private select() {
    const rankedTeams = [...this.rootTeams].sort(
      (a, b) => a.fitness - b.fitness
    )[Math.floor(this.rootTeams.size * 0.8)];
    this.rootTeams.forEach((t) => {
      if (t.fitness < rankedTeams.fitness) {
        t.clear();
        this.teams.delete(t);
      }
    });
    this.learners.forEach((l) => {
      if (l.inTeam.size <= 0) {
        this.learners.delete(l);
      }
    });
  }

  private generate() {
    while (this.teams.size < this.teamPopSize) {
      const parent = this.rootTeams.choice();
      const child = parent.clone();
      child.mutate(this.mutateParams, this.learners, this.teams);
      this.teams.add(child);
    }
  }

  public getAgents() {
    return [...this.rootTeams].map((t) => new Agent(t));
  }

  public getEliteAgents() {}

  public evolve() {
    this.select();
    this.generate();
    this.generations += 1;
  }

  public save() {}

  static load() {}
}

if (require.main === module) {
  console.debug("unit test tpg");
  let phrases = new Swarm<Qualia>();
  [
    [1, 2, 3],
    [1, 3],
    [3, 5],
  ].map((x) => phrases.add(new Qualia(x)));
  const brain = new Tpg(phrases);
  console.log(brain.phrases);
  console.log(brain.teams);
  console.log(Qualia.phrases);
}
