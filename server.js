const express = require("express");
const app = require("./server/sever.js");

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
	console.log(`Nova AI backend running on http://localhost:${port}`);
});
