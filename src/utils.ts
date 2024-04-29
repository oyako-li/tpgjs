export interface Params {
  [name: string]: number;
}

export function flip(prob: number) {
  return Math.random() < prob;
}

interface Memory {
  type: "sensory" | "shortTerm" | "longTerm";
  content: any;
  createdAt: Date;
}

// class SensoryMemory {
//   private memories: Memory[] = [];

//   public addStimulus(content: any) {
//     const memory: Memory = {
//       type: "sensory",
//       content,
//       createdAt: new Date(),
//     };
//     this.memories.push(memory);
//     // 感覚記憶の持続時間が終了したら削除する
//     setTimeout(() => {
//       this.memories.shift();
//     }, 3000); // 例: 3秒後に消去
//   }
// }

// class ShortTermMemory {
//   private memories: Memory[] = [];

//   public transferFromSensory(sensoryMemory: SensoryMemory) {
//     // 重要と判断される情報を感覚記憶から短期記憶へ移行
//     const importantMemories =
//       sensoryMemory.filter(/* 何らかの基準によるフィルタリング */);
//     this.memories.push(...importantMemories);
//     // 短期記憶の保持時間管理
//     setTimeout(() => {
//       // 短期記憶から長期記憶への移行や、忘却の処理
//     }, 30000); // 例: 30秒後に処理
//   }
// }

// class LongTermMemory {
//   private memories: Memory[] = [];

//   public encodeFromShortTerm(shortTermMemory: ShortTermMemory) {
//     // 短期記憶から長期記憶への情報のエンコード
//     const encodedMemories = shortTermMemory.map(/* エンコードのロジック */);
//     this.memories.push(...encodedMemories);
//   }
// }
