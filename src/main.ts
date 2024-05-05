"use strict";
import { Cerebrum, Neuron } from "./brain";
import { Activator } from "./activator";

const actor = new Cerebrum([0]);
const emulator = new Cerebrum([0]);
const evaluator = new Cerebrum([1]);

function input(): Array<number> {
  return [1, 2, 3];
}

if (require.main === module) {
  console.debug(`unit test cerebrum`);
  const actor = new Cerebrum([
    [1, 2, 3],
    [1, 3],
    [3, 5],
  ]);
  while (true) {
    let state = input();
    let story = emulator.recall(state);
    let player = actor.recall(story.qualia);
    let consciousness = evaluator.recall([...state, ...story.qualia]);

    if (player instanceof Neuron) {
      for (let action of player.qualia) {
        try {
          const runner = new Activator(action);
          runner.run((action: any) => {
            console.log(action);
          }, 100);
        } catch (e) {
          player.resource -= 1000;
        }
      }
    }
  }
}
