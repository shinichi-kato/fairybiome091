export const getInitialCellState = (memory) => ({
  description: "",
  updatedAt: null,
  userDisplayName: false,
  botDisplayName: "",
  avatarDir: "",
  backgroundColor: "",
  npc: false,
  encoder: "",
  stateMachine: "",
  decoder: "",
  precision: 0.5,
  retention: 0.8,
  refractory: 4,
  biome: [],
  memory: !memory ? new Map() : new Map(memory),
  script: [],
});

export const getInitialMainCellState = () => {
  return getInitialCellState({
    "{BOT_NAME}":["未設定"],
    "{BOT_NAME_SPOKEN}":["未設定"],
    "{I}":["私"],
    "{YOU}":["君","あなた","お前さん","貴方","あんた"],
    "{ENTER}":["absent","appear"],
  });

}