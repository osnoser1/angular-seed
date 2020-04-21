const netlifyDeploy = {
  name: 'deploy/netlify',
  callback: async () => ({ description: 'Deploy preview ready!', target_url: process.env.NETLIFY_URL }),
};

module.exports = [netlifyDeploy];
