const cp = require('child_process');
const https = require('https');

const checks = require('./checks');

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

function getCurrentCommitSha() {
  return cp
    .execSync(`git rev-parse HEAD`)
    .toString()
    .trim();
}

// The SHA provied by GITHUB_SHA is the merge (PR) commit.
// We need to get the current commit sha ourself.
const sha = getCurrentCommitSha();

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
          body = Buffer.concat(body).toString();
          body = JSON.parse(body);
        } catch (e) {
          console.log(body);
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

      await setStatus(name, 'pending', { description: 'Running check..' });

      try {
        const response = await callback();
        await setStatus(name, 'success', response);
      } catch (err) {
        const description = err ? err.message : 'Something went wrong';
        await setStatus(name, 'failure', { description });
      }
    }),
  );

  console.log('Finished status checks');
}

run().catch(console.error);
