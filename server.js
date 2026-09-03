const express = require("express");
const app = require("./server/sever.js");

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
	console.log(`Nova AI backend running on http://localhost:${port}`);
});

server.on("error", (error) => {
	if (error.code === "EADDRINUSE") {
		console.log(`Nova AI backend is already running on http://localhost:${port}`);
		return;
	}

	console.error("Backend startup failed:", error);
});
