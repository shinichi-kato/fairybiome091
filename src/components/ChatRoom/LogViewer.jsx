import React, { useLayoutEffect, useRef } from 'react';
import { withPrefix } from 'gatsby';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';


function LeftBalloon(props) {
  const message = props.message;
  const avatarSrc = message.person === 'bot' && message.avatarURL ?
    message.avatarURL.replace(/([^/]+\..+)$/,"avatar.svg")
    :
    `${message.avatarURL}`;
  const texts = message.text?.split('<br/>') || ["undefined"];
  const backgroundColor = message.backgroundColor || "#FFFFFFBB";



  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf="flex-start"
    >
      <Box
        alignSelf="flex-end"
      >
        <Avatar alt={message.name} src={withPrefix(avatarSrc)} />
      </Box>
      <Box
        sx={{
          borderRadius: "15px 15px 15px 0px",
          padding: "0.5em",
          marginLeft: 2,
          backgroundColor: backgroundColor,
        }}
      >
        {texts.map((text, index) => <Typography variant="body1" key={index}>{text}</Typography>)}
        <Typography variant="caption">{message.name}</Typography>
      </Box>
    </Box>
  )
}

function RightBalloon(props) {
  const message = props.message;
  const avatarSrc = message.person === 'bot' && message.avatarURL ?
    message.avatarURL.replace(/([^/]+\..+)$/,"avatar.svg")
    :
    `${message.avatarURL}`;
  const backgroundColor = message.backgroundColor || "#FFFFFFBB";

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf="flex-end"
    >

      <Box
        sx={{
          borderRadius: " 15px 15px 0px 15px",
          padding: "0.5em",
          marginRight: 2,
          backgroundColor: backgroundColor,
        }}
      >
        <Typography variant="body1">{message.text}</Typography>
        <Typography variant="caption">{message.name}</Typography>

      </Box>
      <Box
        alignSelf="flex-end"
      >
        <Avatar alt={message.name} src={withPrefix(avatarSrc)} />
      </Box>
    </Box>
  )
}

function SystemMessage(props) {
  const message = props.message;

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
    >
      <Box>
        <Typography>{message.text}</Typography>
      </Box>
    </Box>
  )
}

export default function LogViewer(props) {
  /*
    props.log??????????????????????????????
    ???????????????????????????????????????
    ??????????????????????????????????????????????????????????????????
    ?????????????????????bot,others????????????????????????????????????????????????????????????????????????
    ??????????????????????????????.
  */

  const scrollBottomRef = useRef();

  useLayoutEffect(() => {
    // ?????????????????????????????????????????????????????????
    scrollBottomRef?.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [props.log]);


  const messages = props.log.map(message => {

    switch (message.person) {
      case 'user': return <RightBalloon key={message.id} message={message} />
      case 'bot': return <LeftBalloon key={message.id} message={message} />
      case 'other': return <LeftBalloon key={message.id} message={message} />
      default: return <SystemMessage key={message.id} message={message} />
    }
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
    >
      {messages}
    </Box>
  )
}