const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const options = {
    origin: ['http://localhost:8080'],
};

app.use(cors(options));

const port = process.env.PORT
const auths_routes = require('./routes/auths')
const users_routes = require('./routes/users')

app.use('/api/auth', auths_routes);
app.use('/api/users', users_routes);

app.use((error, request, response, next) => {
    if(error instanceof SyntaxError)
        response.status(404).send({ message: 'not valid data' })
    else next()
})

app.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
})
