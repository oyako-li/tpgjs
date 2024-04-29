import { Cerebrum } from "../src/brain";
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

const brain = new Cerebrum([
  [1, 2, 3],
  [1, 3],
  [3, 5],
]);

describe("テストサンプル", () => {
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
    test("テストケース1", () => {
      console.log("正常系テストケース1");
    });
    test("テストケース2", () => {
      console.log("正常系テストケース2");
    });
  });

  describe("異常系", () => {
    test("テストケース1", () => {
      console.log("異常系テストケース1");
      try {
        let result = brain.recall("test");
        // some actions
      } catch (e) {
        brain.remember(e);
      }
    });
  });
});
