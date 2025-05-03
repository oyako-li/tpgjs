import { v4 as uuid } from "uuid";
import { Swarm } from "./tpg.ts";

// export interface Signal {
//   code: Array<number>;
// }

export interface Collector {
  collect(result: any): void;
}

export class Activator<U> {
  public id: string;
  public signal: any;
  public cost: number;
  public penalty: number;
  public static actions: Swarm<Activator<any>> = new Swarm<Activator<any>>();
  private collector: Collector | null;
  constructor(
    func: (code: Array<number>) => Promise<U>,
    collector?: Collector,
    id?: string,
    cost: number = 1,
    penalty: number = 10000
  ) {
    this.signal = func;
    this.cost = cost;
    this.penalty = penalty;
    this.collector = collector || null;
    this.id = id ? id : uuid();
    Activator.actions.add(this);
  }
  public run(
    code: Array<number>,
    timeout: number = 10
  ): Promise<[any, number]> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      const start = performance.now();
      this.signal(code)
        .then((result: U) => {
          if (this.collector) {
            this.collector.collect(result);
          }
          const end = performance.now();
          const duration = end - start;
          controller.abort();
          resolve([result, duration * this.cost]);
        })
        .catch((error: Error) => {
          if (this.collector) {
            this.collector.collect(error);
          }
          controller.abort();
          resolve([null, this.penalty]);
        });

      const timeoutId = setTimeout(() => {
        if (this.collector) {
          this.collector.collect([14150]);
        }
        resolve([null, timeout * this.cost + this.penalty]);
      }, timeout);

      controller.signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
      });
    });
  }
}
