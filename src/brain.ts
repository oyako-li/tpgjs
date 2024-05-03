import { v4 as uuid } from "uuid";
import { Params, flip } from "./utils";
import { Swarm, Program } from "./tpg";
import { Activator } from "./activator";
import assert from "assert";

/**
 * 概念の象徴
 * 性質：
 *  時間経過とともに抽象化・簡素化されていく
 *  想起回数に応じて固着していく
 * ・宣言的記憶（事象・情報）→ str
 * ・非宣言的記憶（スキル・習慣）→ int, List[int]
 */
export class Qualia {
  public fragment: any;
  private static phrases: Swarm<Qualia> = new Swarm<Qualia>();

  constructor(_instance: Qualia | any | undefined) {
    if (_instance instanceof Qualia) {
      this.fragment = _instance.fragment;
    } else {
      this.fragment = _instance;
    }
    Qualia.phrases.add(this);
  }

  *[Symbol.iterator]() {
    for (let f of this.fragment) {
      yield f;
    }
  }
}

/**
 * 現象の象徴
 */
export class Dendrite {
  public id: string;
  public from: Neuron;
  public to: Neuron;
  public registers: Array<number>;
  public program: Program;
  public static synapses: Swarm<Dendrite> = new Swarm<Dendrite>();

  constructor(_from: Neuron, _to?: Neuron, _id?: string) {
    this.from = _from;
    this.to = _to ? _to : Neuron.brain.choice();
    this.registers = Array.from({ length: 8 }, () => 0.0);
    this.program = new Program();
    this.id = _id ? _id : uuid();
    Dendrite.synapses.add(this);
  }

  public bid(state: any, args: any): Array<number> {
    return this.program.execute(state, this.registers, args);
  }

  public mutate(mutateParams: Params) {
    let changed = false;
    while (!changed) {
      // mutate the program
      if (flip(mutateParams["probability"])) {
        changed = true;
        this.program.mutate(mutateParams);
      }
      // mutate the phrase
      if (flip(mutateParams["probability"])) {
        changed = true;
        this.to.mutate(mutateParams);
      }
    }
  }
}

/**
 * 物質の象徴
 */
export class Neuron {
  public id: string;
  public qualia: Qualia;
  public resource: number;
  public dendrites: Swarm<Dendrite> = new Swarm<Dendrite>();
  public static brain: Swarm<Neuron> = new Swarm<Neuron>();

  constructor(
    _qualia: Qualia,
    _dendrites?: Swarm<Dendrite> | Dendrite,
    _resource?: number,
    _id?: string
  ) {
    this.qualia = new Qualia(_qualia);
    this.dendrites = new Swarm<Dendrite>();
    this.resource = _resource ? _resource : 1000000;
    this.id = _id ? _id : uuid();
    Neuron.brain.add(this);
  }

  /**
   *
   * @param state vector
   * @param visited visited node ids
   * @param args params
   * @returns Neuron
   */
  public spike(state: any, visited: Swarm<string>, args: Params): Neuron {
    visited.add(this.id);
    this.resource += args["spike_resource"];

    const next = this.dendrites.filter((den) => !visited.has(den.to.id));
    if (next.size < 1) {
      return this;
    } else {
      const destination: Dendrite = next
        .map((x) => {
          this.resource -= x
            .bid(state, args)
            .reduce((total, current) => total + current);
          return x;
        })
        .reduce(
          (before: Dendrite, after: Dendrite): Dendrite =>
            before.registers.reduce((total, current) => total + current) <
            after.registers.reduce((total, current) => total + current)
              ? before
              : after
        );
      return destination.to.spike(state, visited, args); //-> Consciousness Table = hippocampus
    }
  }

  /**
   *
   * @param mutateParams mutation parameter
   */
  public mutate(mutateParams: Params) {
    // oblivion
  }
}
/**
 * cache memory
 * 想起頻度が上がることによって感情価が大きくなるから、明記されやすくなる
 */
export class Hippocampus {
  constructor() {}
  /**
   * sort
   */
  public sort() {}

  /**
   * overwrite
   */
  public overwrite() {}
}

/**
 * 階層構造の選好関係グラフィカルモデル
 * @param edges global dendrite swarm
 * @param nodes global neuron swarm
 * @param memory global cache memory
 * @param args global parameters
 * @function *recall generator of end node
 * @function remember
 * @function oblivion
 */
export class Cerebrum {
  public edges: Swarm<Dendrite>;
  public nodes: Swarm<Neuron>;
  public memory: Hippocampus;
  public args: Params;

  /**
   * constructor
   * @param phrases initial recalling signal
   * @param initialParams some params
   */
  constructor(phrases: Array<any>, initialParams?: Params) {
    phrases.map((q) => this.remember(q));
    this.nodes = Neuron.brain;
    this.edges = Dendrite.synapses;
    this.memory = new Hippocampus();
    this.args = initialParams
      ? initialParams
      : {
          probability: 0.5,
          spike_resource: 1000,
        };
  }

  /**
   * recall
   * 想起
   * @param state vector input
   * @returns Neuron
   */
  public *recall(state: any): Generator<Neuron> {
    const to = this.edges.map((e) => e.to);
    const roots = this.nodes.difference(to);
    const visited = new Swarm<string>();
    for (let node of roots) yield node.spike(state, visited, this.args);
    this.recall(state);
  }

  /**
   * remember
   * 銘記
   * バッチ処理的に覚える
   * @param qualia create new new neuron?
   */
  public remember(qualia: any) {
    new Neuron(new Qualia(qualia));
  }

  /**
   * oblivion
   * 忘却
   */
  public oblivion() {}
}

if (require.main === module) {
  console.debug(`unit test cerebrum`);
  const actor = new Cerebrum([
    [1, 2, 3],
    [1, 3],
    [3, 5],
  ]);

  let player = actor.recall([1, 2, 3, 4]);
  if (player instanceof Neuron) {
    for (let action of player.qualia) {
      try {
        const runner = new Activator(action);
        runner.run((action) => {
          console.log(action);
        }, 100);
      } catch (e) {
        player.resource -= 1000;
      }
    }
  }
}
