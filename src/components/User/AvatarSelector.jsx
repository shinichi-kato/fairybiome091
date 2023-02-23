import React, { useState } from 'react';
import { useStaticQuery, graphql } from "gatsby"

import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function AvatarSelector({ avatarDir, handleChangeAvatarDir }) {
  const data = useStaticQuery(graphql`
  query {
    allFile(filter: {sourceInstanceName: {eq: "user"}, name: {eq: "peace"}}) {
      nodes {
        relativeDirectory
      }
    }
  }
  `);

  const dirs = data.allFile.nodes.map(node=>(node.relativeDirectory));

  return (
    <ImageList sx={{ width: 500, height: 170 }} cols={3} rowHeight={164}>
      {dirs.map((dir) => (
        <ImageListItem key={dir}
          onClick={()=>{handleChangeAvatarDir(dir)}}
          sx={{
            border: dir === avatarDir ? "4px solid" : "none",
            borderColor: 'primary.main' 
          }}
        >
          <img
            src={`../../user/${dir}/peace.svg`}
            alt={dir}
            style={{
              width: 120,
              height: 180
            }}
            loading="lazy"
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}