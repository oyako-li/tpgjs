import { v4 as uuid } from "uuid";
import { Params, flip } from "./utils";
import { Swarm, Qualia, Program } from "./tpg";
import assert from "assert";

// 物質(概念の物質的象徴)
// GraphDB
// バブルソート

export class Dendrite {
  public id: string;
  public from: Neuron;
  public to: Neuron;
  public registers: Array<any>;
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

  public bid(state: any, args: any): number {
    this.program.execute(state, this.registers, args);
    return this.registers[0]; // TODO: -> Hippocampus
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

export class Neuron {
  public id: string;
  public qualia: Qualia;
  public dendrites: Swarm<Dendrite> = new Swarm<Dendrite>();
  public static brain: Swarm<Neuron> = new Swarm<Neuron>();

  constructor(
    _qualia: Qualia,
    _dendrites?: Swarm<Dendrite> | Dendrite,
    _id?: string
  ) {
    this.qualia = new Qualia(_qualia);
    this.dendrites = new Swarm<Dendrite>();
    this.id = _id ? _id : uuid();
    Neuron.brain.add(this);
  }

  public spike(state: any, visited: Swarm<string>, args: Params): Neuron {
    visited.add(this.id);
    const next = this.dendrites.filter((den) => !visited.has(den.to.id));
    if (next.size < 1) {
      return this;
    } else {
      const destination: Dendrite = next
        .map((x) => {
          x.bid(state, args);
          return x;
        })
        .reduce(
          (before: Dendrite, after: Dendrite): Dendrite =>
            before.registers[0] < after.registers[0] ? before : after
        );
      return destination.to.spike(state, visited, args); //-> Consciousness Table = hippocampus
    }
  }

  public mutate(mutateParams: Params) {
    // oblivion
  }
}

export class Hippocampus {
  // 想起頻度が上がることによって感情価が大きくなるから、明記されやすくなる
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

export class Cerebrum {
  /**
   * 階層構造の選好関係グラフィカルモデル
   */
  public edges: Swarm<Dendrite>;
  public nodes: Swarm<Neuron>;
  public memory: Hippocampus;
  public args: Params;

  constructor(phrases: Array<any>, initialParams?: Params) {
    phrases.map((q) => new Neuron(new Qualia(q)));
    this.nodes = Neuron.brain;
    this.edges = Dendrite.synapses;
    this.memory = new Hippocampus();
    this.args = {
      probability: 0.5,
    };
  }

  /**
   * recall
   * 想起
   */
  public *recall(state: any): Generator<Neuron> {
    let i = 0;
    while (true) {
      let visited = new Swarm<string>();
      for (let node of this.nodes) yield node.spike(state, visited, this.args);
    }
  }

  /**
   * remember
   * 銘記
   * バッチ処理的に覚える
   */
  public remember(state: any) {}

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
  const critic = new Cerebrum([
    [1, 2, 3],
    [1, 3],
    [3, 5],
  ]);
  try {
    let player = actor.recall(["test"]);
    
    for (let action of player.qualia)
  } catch (e) {
    
  }
}
