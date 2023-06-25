import React, { useContext } from 'react';
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
import { ChatbotFileContext } from './ChatbotFileProvider';

const BOT_MODULES = Object.keys(modules);
const ENCODERS = BOT_MODULES.filter(m => m.endsWith('Encoder')); const STATE_MACHINES = BOT_MODULES.filter(m => m.endsWith('StateMachine'));
const DECODERS = BOT_MODULES.filter(m => m.endsWith('Decoder'))

export default function Settings() {
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

  const chatbotFile = useContext(ChatbotFileContext);
  const settings =chatbotFile.settings;
  const memory = chatbotFile.memory;
  
  function handleDeleteCurrentCell() {
    
  }

  function handleSaveMemory(rows) {
    memory.update(rows)
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
              avatarURL: `${settings.avatarDir}peace.svg`,
              backgroundColor: settings.backgroundColor,
            }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h5">
              {settings.botDisplayName}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Input
              placeholder="チャットボットの説明"
              value={settings.description}
              onChange={settings.changeDescription}
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
        <Typography align="right">{settings.updatedAt}</Typography>
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
          value={settings.encoder}
          onChange={e => settings.changeModule('encoder', e)}
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
          value={settings.stateMachine}
          onChange={e => settings.changeModule('stateMachine', e)}
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
          value={settings.decoder}
          onChange={e => settings.changeModule('decoder', e)}
        >
          {DECODERS.map(m =>
            <MenuItem value={m} key={m}>{m}</MenuItem>
          )}
        </Select>
      </Grid>
      <Grid item xs={7}>
        <Typography>答えの正確さ(precision, 0＜x＜1)</Typography>
        <Typography variant="caption">
          値が大きいほど辞書のキーに対して正確に一致した場合に返答をします
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <CoeffInput
          value={settings.precision}
          handleChangeValue={v => settings.changeCoeff('precision', v)}
        />
      </Grid>
      <Grid item xs={7}>
        <Typography>話の長さ(retention, 0＜x＜1)</Typography>
        <Typography variant="caption">
          今回返答したcellが次の返答で最優先になる確率です
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <CoeffInput
          value={settings.retention}
          handleChangeValue={v => settings.changeCoeff('retention', v)}
        />
      </Grid>
      <Grid item xs={7}>
        <Typography>不在時間の長さ(reftactory, 0以上の整数)</Typography>
        <Typography variant="caption">
          チャットボット退室後に不在となる回数
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <NonNegInput
          value={settings.retention}
          handleChangeValue={v => settings.changeCoeff('refractory', v)}
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
                cells={settings.biome}
                handleChangeCellOrder={settings.changeCellOrder}
                handleChangeCellName={chatbotFile.changeCellName}
                handleChangeCurrentCell={chatbotFile.requestChangeCurrentCellName}
              />
              <Button
                onClick={chatbotFile.addNewCell}
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
          memory={memory}
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