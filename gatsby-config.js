require("dotenv").config({
  path: '.env.local',
});

module.exports = {
  plugins: [
    'gatsby-plugin-top-layout',
    'gatsby-plugin-react-helmet',
    // If you want to use styled components you should add the plugin here.
    // 'gatsby-plugin-styled-components',
    'gatsby-plugin-mui-emotion',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `user`,
        path: `${__dirname}/static/user`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `chatbots`,
        path: `${__dirname}/static/chatbot/biomebot`
      }
    }
  ],
  siteMetadata: {
    title: 'BiomeBot ver 0.91',
    author: '加藤真一',
    lang: 'ja',
    backgroundColorPalette: [ // https://www.ppgpaints.com/color/color-families/neutrals
      '#535353', // black
      '#c7b7a1', // neutral
      '#789bc5', // blue
      '#b0bf74', // green
      '#ddb763', // yellow
      '#d58b5f', // orange
      '#c4736e', // red
      '#9e88aa', // purple
    ]
  },
};
