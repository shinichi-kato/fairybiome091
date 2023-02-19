import React, { useState } from 'react';
import { useStaticQuery, graphql } from "gatsby"

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function AvatarSelector({}){
  const data = useStaticQuery(graphql`
  query {
    allFile(filter: {sourceInstanceName: {eq: "user"}, name: {eq: "peace"}}) {
      nodes {
        absolutePath
      }
    }
  }
`)
  return (
    <Box></Box>
  )
}