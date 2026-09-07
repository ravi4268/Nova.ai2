const app = require('./server/sever.js');

const tests = ['election kab hoga', 'environment message', 'general knowledge question'];

async function run() {
  const server = app.listen(0, async () => {
    const port = server.address().port;

    for (const message of tests) {
      try {
        const res = await fetch(`http://localhost:${port}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
        const body = await res.text();
        console.log('MESSAGE:', message);
        console.log('STATUS:', res.status);
        console.log(body);
        console.log('---');
      } catch (err) {
        console.error('ERROR', message, err.message);
        process.exitCode = 1;
      }
    }

    server.close();
  });
}

run();
