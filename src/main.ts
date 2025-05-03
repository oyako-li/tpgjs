import * as brain from "./brain.ts";
import * as activator from "./activator.ts";
// const decoder = new Activator();
// const actor = new Cerebrum([...Array(151665).keys()], decoder);
// const emulator = new Cerebrum([...Array(100).keys()]);
// const evaluator = new Cerebrum([...Array(100).keys()]);

function input(): Array<number> {
  return [1, 2, 3];
}

// if (require.main === module) {
//   console.debug(`unit test cerebrum`);
//   const actor = new Cerebrum([
//     [1, 2, 3],
//     [1, 3],
//     [3, 5],
//   ]);
//   while (true) {
//     let state = input();
//     let story = emulator.recall(state);
//     let player = actor.recall(story.qualia);
//     let consciousness = evaluator.recall([...state, ...story.qualia()]);

//     if (player instanceof Neuron) {
//       for (let action of player.qualia()) {
//         try {
//           const runner = new Activator(action);
//           runner.run((action: any) => {
//             // console.log(action);
//             return action;
//           }, 100);
//         } catch (e) {
//           player.resource -= 1000;
//         }
//       }
//     }
//   }
// }
