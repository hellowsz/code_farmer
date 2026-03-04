/**
 * 完整键盘布局定义
 * 每一行是键盘物理上的一行
 * 每个键对象包含：
 *   id: 与 Rust 后端 map_key_to_id 返回值一致
 *   label: 键帽上显示的文字
 *   width: 相对于标准键（1u = 1）的宽度倍数
 */
export interface KeyDef {
  id: string;
  label: string;
  width?: number; // 默认 1
}

export const KEYBOARD_LAYOUT: KeyDef[][] = [
  // ─── Row 0: Function Row ───
  [
    { id: "esc", label: "Esc", width: 1.5 },
    { id: "f1", label: "F1" },
    { id: "f2", label: "F2" },
    { id: "f3", label: "F3" },
    { id: "f4", label: "F4" },
    { id: "f5", label: "F5" },
    { id: "f6", label: "F6" },
    { id: "f7", label: "F7" },
    { id: "f8", label: "F8" },
    { id: "f9", label: "F9" },
    { id: "f10", label: "F10" },
    { id: "f11", label: "F11" },
    { id: "f12", label: "F12" },
    { id: "delete", label: "Del", width: 1.5 },
  ],
  // ─── Row 1: Number Row ───
  [
    { id: "backquote", label: "`" },
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
    { id: "4", label: "4" },
    { id: "5", label: "5" },
    { id: "6", label: "6" },
    { id: "7", label: "7" },
    { id: "8", label: "8" },
    { id: "9", label: "9" },
    { id: "0", label: "0" },
    { id: "minus", label: "-" },
    { id: "equal", label: "=" },
    { id: "backspace", label: "\u232B", width: 2 },
  ],
  // ─── Row 2: QWERTY Row ───
  [
    { id: "tab", label: "Tab", width: 1.5 },
    { id: "q", label: "Q" },
    { id: "w", label: "W" },
    { id: "e", label: "E" },
    { id: "r", label: "R" },
    { id: "t", label: "T" },
    { id: "y", label: "Y" },
    { id: "u", label: "U" },
    { id: "i", label: "I" },
    { id: "o", label: "O" },
    { id: "p", label: "P" },
    { id: "bracket_l", label: "[" },
    { id: "bracket_r", label: "]" },
    { id: "backslash", label: "\\", width: 1.5 },
  ],
  // ─── Row 3: Home Row ───
  [
    { id: "capslock", label: "Caps", width: 1.75 },
    { id: "a", label: "A" },
    { id: "s", label: "S" },
    { id: "d", label: "D" },
    { id: "f", label: "F" },
    { id: "g", label: "G" },
    { id: "h", label: "H" },
    { id: "j", label: "J" },
    { id: "k", label: "K" },
    { id: "l", label: "L" },
    { id: "semicolon", label: ";" },
    { id: "quote", label: "'" },
    { id: "enter", label: "Enter", width: 2.25 },
  ],
  // ─── Row 4: Shift Row ───
  [
    { id: "shift_l", label: "Shift", width: 2.25 },
    { id: "z", label: "Z" },
    { id: "x", label: "X" },
    { id: "c", label: "C" },
    { id: "v", label: "V" },
    { id: "b", label: "B" },
    { id: "n", label: "N" },
    { id: "m", label: "M" },
    { id: "comma", label: "," },
    { id: "dot", label: "." },
    { id: "slash", label: "/" },
    { id: "shift_r", label: "Shift", width: 2.75 },
  ],
  // ─── Row 5: Bottom Row (macOS layout) ───
  [
    { id: "ctrl_l", label: "Ctrl", width: 1.25 },
    { id: "alt_l", label: "Opt", width: 1.25 },
    { id: "cmd_l", label: "\u2318", width: 1.5 },
    { id: "space", label: "Space", width: 6 },
    { id: "cmd_r", label: "\u2318", width: 1.5 },
    { id: "alt_r", label: "Opt", width: 1.25 },
    { id: "left", label: "\u2190" },
    { id: "up", label: "\u2191" },
    { id: "down", label: "\u2193" },
    { id: "right", label: "\u2192" },
  ],
];

// 所有可种植的键 id 列表（排除功能键和修饰键，它们作为特殊功能田）
export const PLANTABLE_KEYS: string[] = KEYBOARD_LAYOUT.flat()
  .map((k) => k.id)
  .filter(
    (id) =>
      ![
        "esc",
        "tab",
        "capslock",
        "shift_l",
        "shift_r",
        "ctrl_l",
        "alt_l",
        "alt_r",
        "cmd_l",
        "cmd_r",
        "backspace",
        "enter",
        "delete",
      ].includes(id),
  );

// 修饰键 — 这些键具有特殊农场功能而非种田
export const MODIFIER_KEYS: Record<string, string> = {
  shift_l: "施肥",
  shift_r: "施肥",
  enter: "收获全部",
  backspace: "铲除",
  tab: "切换种子",
  capslock: "浇水",
  space: "加速生长",
  esc: "打开菜单",
  delete: "清理枯萎",
  ctrl_l: "道具1",
  alt_l: "道具2",
  cmd_l: "道具3",
  cmd_r: "道具3",
  alt_r: "道具2",
};
