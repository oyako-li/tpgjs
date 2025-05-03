import { Swarm } from "./src/tpg.ts";

export class Evaluator<U> {
  public id: string;
  public score: number;
  public eval: (signal: any) => Promise<Number>;
  public static evaluations: Swarm<Evaluator<any>> = new Swarm<
    Evaluator<any>
  >();

  constructor(_eval: (signal: any) => Promise<Number>, score: number = 1) {
    this.eval = _eval;
    this.score = score;
    this.id = uuid();
    Evaluator.evaluations.add(this);
  }

  public async run(
    signal: any,
    budget: number = 0,
    timeout: number = 1
  ): Promise<Number> {
    const result = await this.eval(signal);
    return result;
  }
}
