import { v4 as uuid } from "uuid";
import { Params, flip, sigmoid } from "./utils";
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
    // this.fragment がイテラブルオブジェクトか確認
    if (this.fragment && typeof this.fragment[Symbol.iterator] === "function") {
      for (let f of this.fragment) {
        yield f;
      }
    } else {
      // this.fragment がイテラブルでない場合、単一のオブジェクトとして処理
      yield this.fragment;
    }
  }
}

/**
 * 物質の象徴
 */
export class Neuron {
  public id: string;
  public _qualia: Qualia;
  public resource: number;
  public program: Program = new Program();
  public registers: Array<number> = Array.from({ length: 8 }, () => Math.random());
  public synapse: Swarm<Neuron> = new Swarm<Neuron>();
  public static brain: Swarm<Neuron> = new Swarm<Neuron>();

  constructor(
    _qualia: Qualia,
    _resource: number = 1,
    _synapse: Swarm<Neuron> = new Swarm<Neuron>(),
    _id: string = uuid()
  ) {
    this._qualia = new Qualia(_qualia);
    this.synapse.join(_synapse);
    this.resource = _resource;
    this.id = _id;
    Neuron.brain.add(this);
  }

  get accent(): Array<Neuron> {
    return [...this.synapse].sort((a, b) => b.resource - a.resource);
  }

  set reward(rate:number) {
    const threshold = Number.MAX_VALUE / rate;
    if (this.resource < threshold) this.resource*=rate;
    else this.resource = Infinity;
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
    this.reward = args["spike_resource"];
    const revenue_rate = args["revenue_rate"];

    const next: Swarm<Neuron> = this.synapse.filter(
      (neu) => neu && !visited.has(neu.id)
    );
    const destination = next.add(this)
      .map((x) => {
        // let revenue = x.resource * revenue_rate;
        // x.resource -= revenue;
        // this.resource *=
        //   revenue - sigmoid(x.bid(state, args).reduce((b, a) => b + a));
        return x.bid(state, args);
      })
      .reduce(
        (before: Neuron, after: Neuron): Neuron =>
          before.registers[0] < after.registers[0] ? before : after
      );
    // console.debug("spike:",destination);
    if (destination===this){
      // console.debug("result:", this);
      return this;
    }
    return destination.spike(state, visited, args); //-> Consciousness Table = hippocampus
  }

  public bid(state: any, args: any): Neuron {
    this.program.execute(state, this.registers, args);
    return this;
  }

  /**
   * mutate synapse
   * ノード自体にそも失敗の経験を覚えさせ、それ以外の選択肢を捨象する
   * 自分の持っているプログラムから最大の報酬を得られる他のリソース（ノード）を取り込むことにする
   * また、搾取されるようなノードからは切り離したいが、、
   * 生存確率が残っていないノードはsynapseを伸ばせない
   * @param mutateParams mutation parameter
   */
  public mutate(mutateParams: Params = {}) {
    const mutate = {
      threshold: 0.4,
      additional: 0.5,
      ...mutateParams,
    };
    if (this.resource !== Infinity) {
      mutate["threshold"] *= 1 - this.resource;
      mutate["additional"] *= 1 - this.resource;
    }

    if (flip(this.resource)) {
      const t = Math.floor(this.synapse.size * mutate["threshold"]);
      this.synapse = new Swarm<Neuron>(this.accent.slice(0, -t));
      if (flip(mutate["additional"])) {
        this.synapse.join(Neuron.brain.choice());
      }
      this.synapse.map((x) => x.mutate(mutate));
      return this;
    } else {
      console.debug("delete:", this.id, this._qualia);
      Neuron.brain.delete(this);
    }
  }

  public *qualia(): Generator<any> {
    if (
      this._qualia.fragment &&
      typeof this._qualia.fragment[Symbol.iterator] === "function"
    ) {
      for (let f of this._qualia.fragment) {
        yield f;
      }
    } else {
      // this._qualia.fragment がイテラブルでない場合、単一のオブジェクトとして処理
      yield this._qualia.fragment;
    }
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
 * @param node global neuron swarm
 * @param memory global cache memory
 * @param args global parameters
 * @function *recall generator of end node
 * @function remember
 * @function oblivion
 */
export class Cerebrum {
  public node: Neuron;
  public memory: Hippocampus;
  public args: Params;
  public generation: number = 0;

  /**
   * constructor
   * @param phrases initial recalling signal
   * @param initialParams some params
   */
  constructor(phrases: Array<any>, initialParams: Params = {}) {
    phrases.map((q) => this.remember(q));
    this.args = {
      synapse: 11,
      probability: 0.8,
      spike_resource: 1.2,
      revenue_rate: 0.01,
      ebbinghaus: 0.97,
      threshold: 0.3,
      additional: 0.9,
      ...initialParams,
    };
    this.node = new Neuron(new Qualia(NaN), Infinity);
    this.memory = new Hippocampus();
  }

  /**
   * recall
   * 想起
   * @param state vector input
   * @returns Neuron
   */
  public recall(state: any, _args: Params = {}): Neuron {
    const visited = new Swarm<string>();
    const args = {
      ...this.args,
      ..._args,
    };
    if (!(Symbol.iterator in Object(state))) {
      state = [state];
    }
    return this.node.spike(state, visited, args);
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
   * 存在確率の低いやつが消される->忘却確率
   * synapseに所属していないNodeが消される？
   */
  public oblivion(_args: Params = {}) {
    const args = {
      ...this.args,
      ..._args,
    };
    const ebbinghaus = args["ebbinghaus"];
    Neuron.brain.map((neu) => (neu.reward = ebbinghaus));
    this.node.mutate(args);
    console.debug(`oblivion: ${++this.generation}`);
    // console.debug(this.node.accent);
  }
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
    for (let action of player.qualia()) {
      try {
        const runner = new Activator(action);
        runner.run(async (action) => {
          console.log(action);
        }, 100);
      } catch (e) {
        player.reward = 1000;
      }
    }
  }
}
