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
  ],
  siteMetadata: {
    title: 'BiomeBot ver 0.91',
    author: '加藤真一',
    lang: 'ja',
  },
};
