import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

export const getInitialCellState = (memory) => {
  // 受け取るmemoryはfirestoreから取得した key: [val,val,...]というオブジェクト。
  // 格納するのはそれを変換した[{id, memKey,memValues}] というdatagrid互換の配列。
  // idはrandomId()

  let newMemory = [];
  if(memory){
    memory.forEach((val,key)=>{
      newMemory.push({
        id: randomId(),
        memKey: key,
        memValues: val.join(',')
      });
    })
  }
  return ({
    description: "",
    hasChanged: false,
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
    memory: newMemory,
    script: [],    
  });  
}

export const getInitialMainCellState = () => {
  return getInitialCellState({
    "{BOT_NAME}":["未設定"],
    "{BOT_NAME_SPOKEN}":["未設定"],
    "{I}":["私"],
    "{YOU}":["君","あなた","お前さん","貴方","あんた"],
    "{ENTER}":["absent","appear"],
  });

}