// ── 键盘布局数据 ──
// 基于竞品截图的 5 行键盘，每个键有 id、显示标签、宽度倍率

export interface KeyDef {
  readonly id: string;       // 与 input_listener 的 key_id 一致
  readonly label: string;    // 显示文字
  readonly width: number;    // 宽度倍率（1 = 标准键宽）
  readonly isModifier: boolean; // 功能键不种地
}

export type KeyboardRow = readonly KeyDef[];

function key(id: string, label: string, width = 1, isModifier = false): KeyDef {
  return { id, label, width, isModifier };
}

function mod(id: string, label: string, width = 1): KeyDef {
  return { id, label, width, isModifier: true };
}

export const KEYBOARD_LAYOUT: readonly KeyboardRow[] = [
  // 数字行
  [
    key("backquote", "`"), key("1", "1"), key("2", "2"), key("3", "3"),
    key("4", "4"), key("5", "5"), key("6", "6"), key("7", "7"),
    key("8", "8"), key("9", "9"), key("0", "0"),
    key("minus", "-"), key("equal", "="),
    mod("backspace", "⌫", 1.5),
  ],
  // QWERTY 行
  [
    mod("tab", "Tab", 1.5),
    key("q", "Q"), key("w", "W"), key("e", "E"), key("r", "R"),
    key("t", "T"), key("y", "Y"), key("u", "U"), key("i", "I"),
    key("o", "O"), key("p", "P"),
    key("bracket_l", "["), key("bracket_r", "]"), key("backslash", "\\"),
  ],
  // Home 行
  [
    mod("capslock", "Caps", 1.75),
    key("a", "A"), key("s", "S"), key("d", "D"), key("f", "F"),
    key("g", "G"), key("h", "H"), key("j", "J"), key("k", "K"),
    key("l", "L"), key("semicolon", ";"), key("quote", "'"),
    mod("enter", "Enter", 1.75),
  ],
  // Shift 行
  [
    mod("shift_l", "Shift", 2.25),
    key("z", "Z"), key("x", "X"), key("c", "C"), key("v", "V"),
    key("b", "B"), key("n", "N"), key("m", "M"),
    key("comma", ","), key("dot", "."), key("slash", "/"),
    mod("shift_r", "Shift", 2.25),
  ],
  // 底部行
  [
    mod("ctrl_l", "Ctrl", 1.25),
    mod("alt_l", "Alt", 1.25),
    mod("cmd_l", "Cmd", 1.25),
    mod("space", "Space", 5),
    mod("cmd_r", "Cmd", 1.25),
    mod("alt_r", "Alt", 1.25),
    mod("ctrl_r", "Ctrl", 1.25),
  ],
];

/** 所有可种植的键（非功能键） */
export function getPlantableKeys(): KeyDef[] {
  return KEYBOARD_LAYOUT.flatMap((row) => row.filter((k) => !k.isModifier));
}

/** 通过 id 查找 KeyDef */
export function findKeyDef(id: string): KeyDef | undefined {
  for (const row of KEYBOARD_LAYOUT) {
    const found = row.find((k) => k.id === id);
    if (found) return found;
  }
  return undefined;
}
