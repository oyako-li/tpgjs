import { v4 as uuid } from "uuid";
import { Params, flip, sigmoid } from "./utils.ts";
import { Swarm, Program } from "./tpg.ts";
import { Activator } from "./activator.ts";

/**
 * 基底となるインターフェース
 */
interface NeuralUnit {
  id: string;
  resource: number;
  generation: number;
  program: Map<string, Program>;
  registers: Array<number>;
  connect(id: string): NeuralUnit;
  spike(state: any, visited: Swarm<string>, args: Params): NeuralUnit;
  bid(state: any, args: Params, id?: string): NeuralUnit;
  mutate(mutateParams: Params): boolean;
}

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
  public actor: Activator<any>;
  private static phrases: Swarm<Qualia> = new Swarm<Qualia>();

  constructor(_instance: Qualia | any | undefined, actor: Activator<any>) {
    if (_instance instanceof Qualia) {
      this.fragment = _instance.fragment;
      this.actor = _instance.actor;
    } else {
      if (!(Symbol.iterator in Object(_instance))) {
        _instance = [_instance];
      }
      this.fragment = _instance;
      this.actor = actor;
    }
    Qualia.phrases.add(this);
  }

  public async act(): Promise<[any, number]> {
    return await this.actor.run(this.fragment);
  }

  *[Symbol.iterator]() {
    // this.fragment がイテラブルオブジェクトか確認
    if (Symbol.iterator in Object(this.fragment)) {
      for (const f of this.fragment) {
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
export class Neuron implements NeuralUnit {
  public id: string;
  public qualia: Qualia;
  public resource: number;
  public vote: number = 0;
  public generation: number = 0;
  public program: Map<string, Program> = new Map<string, Program>();
  public registers: Array<number> = Array.from({ length: 8 }, () =>
    Math.random()
  );
  public synapse: Swarm<NeuralUnit> = new Swarm<NeuralUnit>();
  public static cerebrum: Swarm<NeuralUnit> = new Swarm<NeuralUnit>();

  constructor(
    _qualia: Qualia,
    _resource: number = 0,
    _synapse: Swarm<NeuralUnit> = new Swarm<NeuralUnit>(),
    _id: string = uuid()
  ) {
    this.id = _id;
    this.qualia = _qualia;
    this.synapse.join(_synapse.map((x) => x.connect(this.id)));
    this.resource = _resource;
    this.connect(this.id);
    Neuron.cerebrum.add(this as NeuralUnit);
  }

  get fragment(): Array<any> {
    return this.qualia.fragment;
  }

  /**
   * @todo 非同期の環境への作用
   * @returns Number
   */
  public async act(): Promise<[any, number]> {
    return await this.qualia.act();
  }

  public reward(payoff: number): void {
    // const threshold = Number.MAX_VALUE / rate;
    // if (this.resource < threshold) this.resource *= rate;
    // else this.resource = Infinity;
    this.resource += payoff;
    // this.synapse.map(async (x) => await x.reward(payoff));
    // this.program.forEach((x, id) => Neuron.cerebrum.get(id)?.reward(payoff));
  }

  /**
   * 重み付き投票
   * @param state vector
   * @param visited visited node ids
   * @param args params
   * @returns Neuron
   */
  public spike(state: any, visited: Swarm<string>, args: Params): NeuralUnit {
    visited.add(this.id);

    const next: Swarm<NeuralUnit> = this.synapse.filter(
      (neu) => neu && !visited.has(neu.id)
    );

    /**
     * @todo
     * 情報幾何的な根拠に基づく投票があった方が良い
     * タスクの分化が発生するようにする
     * あるいは、パス中全てにおいて、act()を発火させるべき？
     * よりSI的に考えるのであれば、ここでは投票というより、自らが活性化すべきか否かのような気がする
     */
    const destination = next
      .add(this)
      .map((x) => x.bid(state, args, this.id))
      .reduce(
        (before: NeuralUnit, after: NeuralUnit): NeuralUnit =>
          before.vote < after.vote ? before : after
      );
    if (destination === this) return this;
    return destination.spike(state, visited, args); //-> Consciousness Table = hippocampus
  }

  public connect(id: string): Neuron {
    if (!this.program.has(id)) {
      this.program.set(id, new Program());
    }
    return this;
  }

  public bid(id: string, state: any, args: any): Neuron {
    this.vote = this.program.get(id)?.execute(state, this.registers, args) ?? 0;
    return this;
  }

  /**
   * @todo mutate synapse
   * ノード自体にそも失敗の経験を覚えさせ、それ以外の選択肢を捨象する
   * 自分の持っているプログラムから最大の報酬を得られる他のリソース（ノード）を取り込むことにする
   * また、搾取されるようなノードからは切り離したいが、、
   * 生存確率が残っていないノードはsynapseを伸ばせない
   * @param mutateParams mutation parameter
   */
  public mutate(mutateParams: Params = {}): boolean {
    const mutate = {
      threshold: 0.4,
      additional: 0.5,
      ...mutateParams,
    };
    const survival_prob = sigmoid(this.resource);
    if (this.resource !== Infinity) {
      mutate.threshold *= 1 - survival_prob;
      mutate.additional *= 1 - survival_prob;
    }

    if (flip(survival_prob)) {
      this.generation++;
      this.synapse = this.synapse.filter((x) => x.mutate(mutate));
      while (flip(mutate.additional)) {
        this.synapse.join(Neuron.cerebrum.choice().connect(this.id));
      }
      return true;
    } else {
      // @todo 生存確率低ければ、memeをmutateする
      this.program.delete(this.id);
      // this.program.forEach((x) => x.mutate(mutate));
      return false;
    }
  }
}

/**
 * 階層構造の選好関係グラフィカルモデル
 * @param node global neuron swarm
 * @param memory global cache memory
 * @param args global parameters
 * @function recall generator of end node
 * @function remember
 * @function oblivion
 */
export class Cortex implements NeuralUnit {
  public node: Neuron;
  public args: Params;
  public actor: Activator<number>;
  public generation: number = 0;
  public id: string;

  /**
   * constructor
   * @param phrases initial recalling signal
   * @param initialParams some params
   * @param actor actor
   */
  constructor(
    phrases: Array<any>,
    actor: Activator<number>,
    initCode?: any,
    initialParams: Params = {},
    _id: string = uuid()
  ) {
    phrases.map((q) => new Neuron(new Qualia(q, actor)));
    this.actor = actor;
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
    this.id = _id;
    this.node = new Neuron(new Qualia(initCode, actor));
  }

  get fragment(): Array<any> {
    return this.node.fragment;
  }

  get synapse(): Swarm<NeuralUnit> {
    return this.node.synapse;
  }

  get resource(): number {
    return this.node.resource;
  }

  get program(): Map<string, Program> {
    return this.node.program;
  }

  get registers(): Array<number> {
    return this.node.registers;
  }

  public reward(rate: number): void {
    this.node.reward(rate);
  }

  public connect(id: string): Neuron {
    return this.node.connect(id);
  }

  /**
   * spike
   * 想起
   * @param state vector input
   * @returns Neuron
   */
  public spike(
    state: any,
    _visited: Swarm<string> = new Swarm<string>(),
    _args: Params = {}
  ): NeuralUnit {
    const visited = _visited;
    const args = {
      ...this.args,
      ..._args,
    };
    if (!(Symbol.iterator in Object(state))) {
      state = [state];
    }
    return this.node.spike(state, visited, args);
  }

  public bid(state: any, args: Params, id?: string): Neuron {
    if (!id) id = this.node.id;
    return this.node.bid(state, args, id);
  }

  /**
   * remember
   * 銘記
   * バッチ処理的に覚える
   * @param qualia create new new neuron?
   */
  public remember(
    qualia: any,
    existance: number = 1,
    actor?: Activator<any>
  ): Neuron {
    const _actor = actor || this.actor;
    if (!_actor) {
      throw new Error("actor is required");
    }
    return new Neuron(new Qualia(qualia, _actor), existance);
  }

  /**
   * mutate
   * 忘却
   * 存在確率の低いやつが消される->忘却確率
   * synapseに所属していないNodeが消される？
   */
  public mutate(_args: Params = {}): boolean {
    const args = {
      ...this.args,
      ..._args,
    };
    // const ebbinghaus = args["ebbinghaus"];
    console.debug(`mutate: ${++this.generation} ${this.node.resource}`);
    return this.node.mutate(args);
  }

  /**
   * ネットワーク構造を可視化用のデータ構造に変換
   * @returns {Object} ノードとエッジの情報
   */
  public visualizeNetwork(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];
    const visited = new Set<string>();

    const traverse = (neuron: Neuron) => {
      if (visited.has(neuron.id)) return;
      visited.add(neuron.id);

      // ノード情報を追加
      nodes.push({
        id: neuron.id,
        resource: neuron.resource,
        fragment: neuron.fragment,
      });

      // シナプス接続を探索
      neuron.synapse.forEach((target: NeuralUnit) => {
        edges.push({
          source: neuron.id,
          target: target.id,
          weight: target.resource,
        });

        if (target instanceof Neuron) {
          traverse(target);
        }
      });
    };

    traverse(this.node);
    return { nodes, edges };
  }

  /**
   * ネットワーク構造を文字列形式で出力
   * @returns {string} ネットワーク構造の文字列表現
   */
  public printNetwork(): string {
    const { nodes, edges } = this.visualizeNetwork();
    let output = "Network Structure:\n\n";

    output += "Nodes:\n";
    nodes.forEach((node) => {
      output += `- ID: ${node.id}\n  Resource: ${
        node.resource
      }\n  Fragment: ${JSON.stringify(node.fragment)}\n`;
    });

    output += "\nConnections:\n";
    edges.forEach((edge) => {
      output += `- ${edge.source} -> ${edge.target} (weight: ${edge.weight})\n`;
    });

    return output;
  }
}
