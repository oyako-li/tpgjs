import { Cerebrum, Neuron } from "../src/brain";
import { Activator } from "../src/activator";
import { describe, it } from "node:test";
import {
  expect,
  jest,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "@jest/globals";

describe("美しい言葉を生み出すかどうかの実験", () => {
  const actor = new Cerebrum([0]);
  const emulator = new Cerebrum([0]);
  const evaluator = new Cerebrum([1]);

  test("テストケース1", () => {
    console.log("正常系テストケース1");
    let player = actor.recall([1, 2, 3, 4]);
    if (player instanceof Neuron) {
      for (let action of player.qualia) {
        try {
          const runner = new Activator(action);
          runner.run((action) => {
            console.log(action);
          }, 100);
        } catch (e) {
          player.resource -= 1000;
        }
      }
    }
  });
  test("テストケース2", () => {
    console.log("正常系テストケース2");
  });
});
