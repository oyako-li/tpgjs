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
  vote: number;
  meme: Map<string, Program>;
  connect(id: string, program?: Program): NeuralUnit;
  spike(state: any, visited: Swarm<string>, args: Params): NeuralUnit;
  bid(state: any, args: Params, id?: string): NeuralUnit;
  mutate(mutateParams: Params): boolean;
}
// resourceに基づく重み付きランダム選択関数
function weightedRandomChoice<T>(
  items: T[],
  getWeight: (item: T) => number
): T {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= getWeight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1]; // 念のため
}

// 複数選びたい場合
function weightedRandomChoices<T>(
  items: T[],
  getWeight: (item: T) => number,
  n: number
): T[] {
  const selected: T[] = [];
  const pool = [...items];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const choice = weightedRandomChoice(pool, getWeight);
    selected.push(choice);
    // 重複を避ける場合
    const idx = pool.indexOf(choice);
    if (idx >= 0) pool.splice(idx, 1);
  }
  return selected;
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
 * プラグマ
 * 性質：
 *  行為の記述
 *  時間経過とともに抽象化・簡素化されていく
 */
export class Pragma {
  public code: any;
  public actor: Activator<any>;
  private static pragmas: Swarm<Pragma> = new Swarm<Pragma>();

  constructor(_instance: Pragma | any | undefined, actor: Activator<any>) {
    if (_instance instanceof Pragma) {
      this.code = _instance.code;
      this.actor = _instance.actor;
    } else {
      if (!(Symbol.iterator in Object(_instance))) {
        _instance = [_instance];
      }
      this.code = _instance;
      this.actor = actor;
    }
    Pragma.pragmas.add(this);
  }

  public async act(): Promise<[any, number]> {
    return await this.actor.run(this.code);
  }

  *[Symbol.iterator]() {
    if (Symbol.iterator in Object(this.code)) {
      for (const f of this.code) {
        yield f;
      }
    } else {
      yield this.code;
    }
  }
}

/**
 * 物質の象徴
 * pragmaのusefullnessを最大化する
 * reward*frequencyのエントロピーを最小化する
 * entropy = -sum(p(x) * log(p(x)))
 * entropyとusefullnessの平衡状態を保つ機構
 * bitでは,entropyの最小かつusefullnessの最大を目指す
 */
export class Neuron implements NeuralUnit {
  public id: string;
  public pragma: Pragma;
  public resource: number;
  public vote: number = 0;
  public generation: number = 0;
  public meme: Map<string, Program> = new Map<string, Program>();
  public synapse: Swarm<NeuralUnit> = new Swarm<NeuralUnit>();
  public static cerebrum: Swarm<NeuralUnit> = new Swarm<NeuralUnit>();

  constructor(
    _pragma: Pragma,
    _resource: number = 0,
    _synapse: Swarm<NeuralUnit> = new Swarm<NeuralUnit>(),
    _id: string = uuid()
  ) {
    this.id = _id;
    this.pragma = _pragma;
    /** @todo backpropagateしやすいように、synapseをjoinする */
    this.synapse.join(_synapse.map((x) => x.connect(this.id)));
    this.resource = _resource;
    this.connect(this.id);
    Neuron.cerebrum.add(this as NeuralUnit);
  }

  get code(): Array<any> {
    return this.pragma.code;
  }

  get useful(): number {
    let usefull = 0;
    this.synapse.add(this).map((n) => {
      usefull += n.resource;
    });
    return usefull / (this.synapse.size + 1);
  }

  /**
   * @todo 非同期の環境への作用
   * @returns Number
   */
  public async act(): Promise<[any, number]> {
    return await this.pragma.act();
  }

  /**
   * 報酬を与える
   * @todo backpropagate
   * @param payoff 報酬
   */
  public reward(payoff: number): void {
    this.resource += payoff;
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
    destination.resource -= destination.vote;
    this.resource += destination.vote;

    if (destination === this) return this;
    return destination.spike(state, visited, args); //-> Consciousness Table = hippocampus
  }

  public connect(id: string, program?: Program): Neuron {
    if (!this.meme.has(id)) {
      let p = program ?? new Program();
      this.meme.set(id, p);
    }
    return this;
  }

  public bid(state: number[], args: any, id: string): Neuron {
    let program = this.connect(id).meme.get(id).execute(state, args);
    this.vote = program?.vote ?? 0;
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
  public mutate(
    mutateParams: Params = {},
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(this.id)) return false; // すでに訪問済みなら再帰しない
    visited.add(this.id);
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
    /**
     * 都合のいい言ってるだけの取引先、実がない取引先は自滅する
     * meme起点で有益性をimitate/mutateする
     */

    if (flip(survival_prob)) {
      // 生存確率が高いほど、mutateする
      this.generation++;
      this.synapse = this.synapse.filter((x) => x.mutate(mutate, visited));
      while (flip(mutate.additional)) {
        /**
         * @todo 選ばれる時、評判の良い取引先を選定する
         * 例: synapseからresourceの多いものを2つ選んで配合
         */
        const parent = weightedRandomChoice(
          this.synapse.series,
          (x) => x.resource
        );
        const meme = parent ? parent.meme.get(this.id) : new Program();
        let child = Neuron.cerebrum.choice().connect(this.id, meme);
        this.synapse.join(child);
      }
      return true;
    } else {
      // @todo 生存確率低ければ、memeをmutateする
      this.meme.delete(this.id);
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
    initialParams: Params = {}
  ) {
    phrases.map((q) => new Neuron(new Pragma(q, actor)));
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
    this.node = new Neuron(new Pragma(initCode, actor));
    this.connect(this.id);
  }

  get id(): string {
    return this.node.id;
  }

  get useful(): number {
    return this.node.useful;
  }

  get code(): Array<any> {
    return this.node.code;
  }

  get synapse(): Swarm<NeuralUnit> {
    return this.node.synapse;
  }

  get resource(): number {
    return this.node.resource;
  }

  get meme(): Map<string, Program> {
    return this.node.meme;
  }

  get register(): Array<number> {
    return this.node.register;
  }

  get vote(): number {
    return this.node.vote;
  }

  public reward(rate: number): void {
    this.node.reward(rate);
  }

  public connect(id: string, program?: Program): Neuron {
    return this.node.connect(id, program);
  }

  /**
   * spike
   * 想起
   * @param state vector input
   * @returns Neuron
   */
  public spike(
    state: number[],
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

  public bid(state: number[], args: Params, id?: string): Neuron {
    if (!id) id = this.node.id;
    return this.node.bid(state, args, id);
  }

  /**
   * remember
   * 銘記
   * バッチ処理的に覚える
   * @param pragma create new new neuron?
   */
  public remember(
    pragma: any,
    existance: number = 1,
    actor?: Activator<any>
  ): Neuron {
    const _actor = actor || this.actor;
    if (!_actor) {
      throw new Error("actor is required");
    }
    return new Neuron(new Pragma(pragma, _actor), existance);
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
    console.debug(`mutate: ${++this.generation} ${this.useful}`);
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
        code: neuron.code,
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
      }\n  Fragment: ${JSON.stringify(node.code)}\n`;
    });

    output += "\nConnections:\n";
    edges.forEach((edge) => {
      output += `- ${edge.source} -> ${edge.target} (weight: ${edge.weight})\n`;
    });

    return output;
  }
}
