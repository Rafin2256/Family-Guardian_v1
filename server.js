const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

// Testing the  route - make 
app.get('/', (req, res) => {
    res.send('Family Guardian is working!');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:3000`);
});