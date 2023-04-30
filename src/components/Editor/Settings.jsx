import React, { useReducer, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FairyPanel from '../Panel/FairyPanel';
import CoeffInput from './CoeffInput';
import NonNegInput from './NonNegInput';
import BiomeLister from './BiomeLister';
import MemoryEditor from './MemoryEditor';

import { modules } from '../Biomebot-0.10/useCells';
import { getInitialCellState } from './initialState';

const BOT_MODULES = Object.keys(modules);
const ENCODERS = BOT_MODULES.filter(m => m.endsWith('Encoder')); const STATE_MACHINES = BOT_MODULES.filter(m => m.endsWith('StateMachine'));
const DECODERS = BOT_MODULES.filter(m => m.endsWith('Decoder'))

function getBotName(cell) {
  if ('memory' in cell) {
    let botName = "";
    if (cell.memory.has('{BOT_NAME}')) {
      botName = cell.memory.get('{BOT_NAME}')[0];
      if (cell.userDisplayName && cell.userDiplayName !== "") {
        botName += `@${cell.userDisplayName}`
      }
    }
    return botName;
  }
  return false;
}

function reducer(state, action) {
  console.log(`settings - ${action.type}`);
  switch (action.type) {
    case 'load': {
      const cell = action.cell;
      return {
        ...action.cell,
        botDisplayName: getBotName(cell),
        script: [],
        isMemoryHaveNewItem: false
      }
    }

    case 'changeDesc': {
      return {
        ...state,
        description: action.description,
        isMemoryHaveNewItem: false
      }
    }

    case 'changeValue': {
      return {
        ...state,
        [action.key]: action.value,
        isMemoryHaveNewItem: false
      }
    }

    case 'changeBiome': {
      return {
        ...state,
        biome: [...action.biome],
        isMemoryHaveNewItem: false
      }
    }

    case 'addNewCell': {
      return {
        ...state,
        biome: [...state.biome, action.cell],
        isMemoryHaveNewItem: true
      }
    }

    case 'changeMemoryItem': {
      /* actionにoldKey, newKey, newValuesが渡される 
        newValuesがnullの場合はそのアイテムを削除する
        keyが変わっていたらoldKeyは削除する
        
      */
      let m = state.memory;
      const oldKey = action.oldKey;
      const newKey = action.newKey;

      if (oldKey === null) {
        // アイテムの追加
        m.set(newKey, action.newValues.split(','))
        return {
          ...state,
          memory: m,
          isMemoryHaveNewItem: true,
        }
      }
      if (action.newValues === null) {
        // アイテムの削除
        m.delete(oldKey);

      } else {
        // キーの書き換え
        const newValues = action.newValues.split(',')
        if (oldKey !== newKey) {
          m.delete(oldKey);
          m.set(newKey,newValues);
        } else {
          // 値の上書き
          m.set(newKey, newValues);
        }
      }

      if(oldKey === ""){
        m.set("",[]);
        return {
          ...state,
          memory: m,
          isMemoryHaveNewItem: true
        }
      }

      return {
        ...state,
        memory: m,
        isMemoryHaveNewItem: false
      }
    }

    case 'addMemoryItem': {
      const m= state.memory;
      m.set("",[]);
      return {
        ...state,
        memory: m,
        isMemoryHaveNewItem: true,
      }
    }

    case 'touchMemory': {
      return {
        ...state,
        isMemoryHaveNewItem: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export default function Settings({
  settings,
  handleAddNewCell,
  handleChangeCellName,
  handleChangeCurrentCell
}) {
  /*
    state.currentCellが編集しているセル、
    state.cellsは辞書になっており、state.cells[cellName]でスクリプトを参照できる。
    Settingに入った時点でstate.cellsからコピーを行う。

    以下の変数は変更できない
    state.cells[cellName]の
      userDisplayName, updatedAt
    state.collection,
    state.botId

  */
  const [state, dispatch] = useReducer(reducer, {
    ...getInitialCellState(),
    isMemoryHaveNewItem: false
  });

  useEffect(() => {
    if (settings.currentCell !== null) {
      dispatch({ type: 'load', cell: settings.cells[settings.currentCell] })
    }
  }, [settings.botId, settings.currentCell, settings.cells]);

  function handleChangeDescription(event) {
    dispatch({ type: 'changeDesc', description: event.target.value });
  }

  function handleChangeModules(module, event) {
    dispatch({ type: 'changeValue', key: module, value: event.target.value });
  }

  function handleChangeCoeff(coeffName, value) {
    dispatch({ type: 'changeValue', key: coeffName, value: value })
  }

  function handleChangeCellOrder(newCells) {
    dispatch({ type: 'changeBiome', biome: newCells })
  }

  function handleAddCell() {
    const newCell = handleAddNewCell();
    dispatch({ type: 'addNewCell', cell: newCell })
  }

  function handleDeleteCurrentCell() {

  }

  function handleSaveMemory() {
  }

  
  return (
    <Grid container
      spacing={2}
      padding={1}
    >
      {
        settings.currentCell === 'main.json' &&
        <>
          <Grid item xs={12}>
            <FairyPanel bot={{
              isReady: true,
              avatarURL: `${state.avatarDir}peace.svg`,
              backgroundColor: state.backgroundColor,
            }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h5">
              {state.botDisplayName}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Input
              placeholder="チャットボットの説明"
              value={state.description}
              onChange={handleChangeDescription}
              maxRows={3}
              multiline
              fullWidth
              sx={{
                backgroundColor: "#ffffff",
                p: 1
              }}
            />

          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">ユーザはこのチャットボットを所有できない</Typography>
          </Grid>

        </>
      }
      <Grid item xs={7}>
        更新日
      </Grid>
      <Grid item xs={5}>
        <Typography align="right">{state.updatedAt}</Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography>
          Encoder
        </Typography>
        <Typography variant="caption">
          チャットボットへの入力を内部コードに変換する方法を指定します
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <Select
          value={state.encoder}
          onChange={e => handleChangeModules('encoder', e)}
        >
          {ENCODERS.map(m =>
            <MenuItem value={m} key={m}>{m}</MenuItem>
          )}
        </Select>
      </Grid>
      <Grid item xs={7}>
        <Typography>
          State Machine
        </Typography>
        <Typography variant="caption">
          内部コードを用いて次の状態と出力を決める方法を指定します
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <Select
          value={state.stateMachine}
          onChange={e => handleChangeModules('stateMachine', e)}
        >
          {STATE_MACHINES.map(m =>
            <MenuItem value={m} key={m}>{m}</MenuItem>
          )}
        </Select>
      </Grid>
      <Grid item xs={7}>
        <Typography>
          Decoder
        </Typography>
        <Typography variant="caption">
          内部コードで表された出力をテキストに変換する方法を指定します
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <Select
          value={state.decoder}
          onChange={e => handleChangeModules('decoder', e)}
        >
          {DECODERS.map(m =>
            <MenuItem value={m} key={m}>{m}</MenuItem>
          )}
        </Select>
      </Grid>
      <Grid item xs={7}>
        <Typography>正確性(precision, 0＜x＜1)</Typography>
        <Typography variant="caption">
          値が大きいほど辞書のキーに対して正確に一致した場合に返答をします
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <CoeffInput
          value={state.precision}
          handleChangeValue={v => handleChangeCoeff('precision', v)}
        />
      </Grid>
      <Grid item xs={7}>
        <Typography>継続性(retention, 0＜x＜1)</Typography>
        <Typography variant="caption">
          今回返答したcellが次の返答で最優先になる確率です
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <CoeffInput
          value={state.retention}
          handleChangeValue={v => handleChangeCoeff('retention', v)}
        />
      </Grid>
      <Grid item xs={7}>
        <Typography>不応期(reftactory, 0以上の整数)</Typography>
        <Typography variant="caption">
          チャットボット退室後に不在となる回数
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <NonNegInput
          value={state.retention}
          handleChangeValue={v => handleChangeCoeff('refractory', v)}
        />
      </Grid>
      <Grid item xs={12}>
        Biome
      </Grid>
      <Grid item xs={12}>
        {
          settings.currentCell === 'main.json' ?
            <>
              <BiomeLister
                cells={state.biome}
                handleChangeCellOrder={handleChangeCellOrder}
                handleChangeCellName={handleChangeCellName}
                handleChangeCurrentCell={handleChangeCurrentCell}
              />
              <Button
                onClick={handleAddCell}
              >セルの追加</Button>
            </>
            :
            <Typography
              align="center"
              sx={{ color: '#dddddd' }}
            >このcellには設定できません
            </Typography>
        }
      </Grid>
      <Grid item xs={12}>
        <Typography>Memory</Typography>
        <Typography variant="caption">チャットボットの記憶内容。キーが大文字のものは必要です</Typography>

      </Grid>
      <Grid item xs={12}>
        <MemoryEditor
          memory={state.memory}
          handleSaveMemory={handleSaveMemory}
        />
      </Grid>
      {
        settings.currentCell !== 'main.json' &&
        <Grid item xs={12}>
          {"このセルを削除する(戻せません)"}
          <Button
            onClick={handleDeleteCurrentCell}
          >削除</Button>
        </Grid>
      }

    </Grid>
  )
}