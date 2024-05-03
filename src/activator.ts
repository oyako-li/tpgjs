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
    func: (action: any) => U,
    timeout: number = 1
  ): Promise<U | NodeJS.Timeout | Error> {
    let res;
    res = await setTimeout(() => {
      res = func(this.signal);
      Activator.actions.delete(this);
      return res;
    }, timeout);
    Activator.actions.delete(this);
    return res;
  }
}
