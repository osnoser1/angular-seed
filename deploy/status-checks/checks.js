const netlifyDeploy = {
  name: 'deploy/netlify',
  callback: async () => ({ description: 'Deploy preview ready!', details_url: process.env.NETLIFY_URL }),
};

module.exports = [netlifyDeploy];
