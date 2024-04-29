import { describe, it } from "node:test";
import { Cerebrum } from "../src/brain";
import {
  expect,
  jest,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "@jest/globals";

const brain = new Cerebrum([
  [1, 2, 3],
  [1, 3],
  [3, 5],
]);

describe("テストサンプル", () => {
  console.debug(`unit test cerebrum`);
  beforeAll(() => {
    console.log("テスト！！の全体で一回の前処理");
  });
  afterAll(() => {
    console.log("テスト！！の全体で一回の後処理");
  });

  beforeEach(() => {
    console.log("テスト！！内の全てのテストの前処理");
  });
  afterEach(() => {
    console.log("テスト！！内の全てのテストの後処理");
  });

  describe("正常系", () => {
    beforeEach(() => {
      console.log("正常系の全てのテストの前処理");
    });
    afterEach(() => {
      console.log("正常系の全てのテストの後処理");
    });
    test("リコール", () => {
      console.log("正常系テストケース1");
      let result;
      try {
        result = brain.recall(["test"]);
      } catch (e) {
        result = e;
      }
      expect(result).toBe("test");
    });
  });

  describe("異常系", () => {
    test("テストケース1", () => {
      console.log("異常系テストケース1");
    });
  });
});
