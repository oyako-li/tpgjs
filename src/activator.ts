import { v4 as uuid } from "uuid";
import { Swarm } from "./tpg";

export class Activator<U> {
  public id: string;
  public signal: any;
  public static actions: Swarm<Activator<any>> = new Swarm<Activator<any>>();
  constructor(_signal: any, _id?: string) {
    this.signal = _signal;
    this.id = _id ? _id : uuid();
    Activator.actions.add(this);
  }
  public async run(
    func: (action: any) => Promise<U>,
    timeout: number = 1
  ): Promise<U | Error | any> {
    return Promise.race([
      new Promise((resolve, reject) => {
        func(this.signal).then((result: U) => {
          Activator.actions.delete(this);
          resolve(result);
        });
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          Activator.actions.delete(this);
          reject(new Error("Timeout occurred"));
        }, timeout)
      ),
    ]);
  }
}
