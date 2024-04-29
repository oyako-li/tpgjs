import { describe } from "node:test";
import {
  expect,
  test,
  //   jest,
  //   beforeAll,
  //   beforeEach,
  //   afterAll,
  //   afterEach,
} from "@jest/globals";
import { Tpg, Swarm, Qualia } from "../src/tpg";

describe("Initial", () => {
  test("Qualia install", () => {
    let phrases = new Swarm<Qualia>();
    [
      [1, 2, 3],
      [1, 3],
      [3, 5],
    ].map((x) => phrases.add(new Qualia(x)));
    const brain = new Tpg(phrases);
    expect(brain.phrases).toEqual(Qualia.phrases);
  });
});

describe("Activate", () => {
  test("TEST", () => {
    console.log("正常系テストケース1");
  });
});
