const cp = require('child_process');
const https = require('https');

const checks = require('./checks');

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

const sha = process.env.LAST_COMMIT_SHA;

async function setStatus(context, state, result) {
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${owner}/${repo}/statuses/${sha}`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': repo,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = [];
      res.on('data', d => body.push(d));
      res.on('end', () => {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (e) {
          reject(e);
        }
        resolve(body);
      });
    });

    req.on('error', reject);
    req.write(
      JSON.stringify({
        state,
        context,
        ...result,
      }),
    );
    req.end();
  });
}

async function run() {
  console.log(`Starting status checks for commit ${sha}`);

  // Run in parallel
  await Promise.all(
    checks.map(async check => {
      const { name, callback } = check;

      await setStatus(name, 'pending', 'Running check..');

      try {
        const response = await callback();
        await setStatus(name, 'success', response);
      } catch (err) {
        const message = err ? err.message : 'Something went wrong';
        await setStatus(name, 'failure', message);
      }
    }),
  );

  console.log('Finished status checks');
};

run().catch(console.error);
