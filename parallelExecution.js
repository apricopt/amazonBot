const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
  threadId,
} = require("worker_threads");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { launchProcess } = require("./main");
const { searchList } = require("./searchList");

if (isMainThread) {
  const numCPUs = 1;

  const clusterData = [];
  for (let i = 0; i < numCPUs; i++) {
    clusterData[i] = [];
  }

  // Distribute search among Cores
  searchList.forEach((entry, index) => {
    clusterData[index % numCPUs].push(entry);
  });

  for (let i = 0; i < numCPUs; i++) {
    const worker = new Worker(__filename, {
      workerData: clusterData[i],
    });

    worker.on("message", (message) => {
      console.log(`Thread ${threadId} completed processing`);
    });

    worker.on("error", (err) => {
      console.error(`Thread ${threadId} encountered an error:`, err);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Thread ${threadId} exited with code ${code}`);
      }
    });
  }
} else {
  (async () => {
    await launchProcess(workerData);
    parentPort.postMessage({ success: true });
  })();
}
