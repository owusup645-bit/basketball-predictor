const express = require("express")
const axios = require("axios")
const cors = require("cors")

const app = express()
app.use(cors())

// GET today's basketball matches
app.get("/today", async (req,res)=>{

try{

let today = new Date().toISOString().split("T")[0]

let url=`https://api.sofascore.com/api/v1/sport/basketball/scheduled-events/${today}`

let response = await axios.get(url)

res.json(response.data.events)

}catch(err){

res.status(500).send("Error fetching games")

}

})


// GET last matches of team
app.get("/team/:id", async (req,res)=>{

try{

let teamId=req.params.id

let url=`https://api.sofascore.com/api/v1/team/${teamId}/events/last/0`

let response=await axios.get(url)

res.json(response.data.events)

}catch(err){

res.status(500).send("Error fetching team matches")

}

})

app.listen(3000,()=>{

console.log("Prediction server running on port 3000")

})