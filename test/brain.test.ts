import { describe, it } from "node:test";
import { Cerebrum, Neuron } from "../src/brain";
import { Activator } from "../src/activator";
import {
  expect,
  jest,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "@jest/globals";

describe("テスト brain.ts", () => {
  console.debug(`unit test cerebrum`);

  test("初期構築", () => {
    const brain = new Cerebrum([
      [1, 2, 3],
      [1, 3],
      [3, 5],
    ]);
    // expect()
  });

  describe("基礎動作", () => {
    const actor = new Cerebrum([
      [1, 2, 3],
      [1, 3],
      [3, 5],
    ]);

    test("リコール", () => {
      let result = actor.recall(["test"]);
      // expect(result).toBe("test");
    });

    test("activation", () => {
      let player = actor.recall([1, 2, 3, 4]);

      expect(player).toBeInstanceOf(Neuron);

      if (player instanceof Neuron)
        for (let action of player.qualia) {
          try {
            const activate = new Activator(action);
            activate.run((action) => {
              console.log(action);
            }, 100);
          } catch (e) {
            player.resource -= 1000;
          }
        }
    });
  });

  describe("異常系", () => {
    test("テストケース1", () => {
      console.log("異常系テストケース1");
    });
  });
});
