// ---------- Manual + Dynamic Prediction ----------
let manualRowsAdded = false;

function addManualMatches() {
    if (manualRowsAdded) return alert("Manual rows already added");
    manualRowsAdded = true;
    const homeContainer = document.getElementById("homeManual");
    const awayContainer = document.getElementById("awayManual");
    for (let i=0;i<5;i++){
        let divHome = document.createElement("div");
        divHome.className="match-row";
        divHome.innerHTML = `<input type="number" placeholder="Home Match ${i+1} Points" class="homePoint">
                             <select class="homeResult">
                                <option value="win">Win</option>
                                <option value="loss">Loss</option>
                             </select>`;
        homeContainer.appendChild(divHome);

        let divAway = document.createElement("div");
        divAway.className="match-row";
        divAway.innerHTML = `<input type="number" placeholder="Away Match ${i+1} Points" class="awayPoint">
                             <select class="awayResult">
                                <option value="win">Win</option>
                                <option value="loss">Loss</option>
                             </select>`;
        awayContainer.appendChild(divAway);
    }
}

function calculateManual(containerId, isHome) {
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll(".match-row");
    let total=0, adjust=0, count=0;
    rows.forEach(row=>{
        let points = parseFloat(row.querySelector(isHome?".homePoint":".awayPoint").value);
        let result = row.querySelector(isHome?".homeResult":".awayResult").value;
        if(!isNaN(points)){ total+=points; count++; }
        if(result==="win") adjust+=0.5;
        else if(result==="loss") adjust-=1.5;
    });
    if(count===0) return null;
    return total/5 + adjust;
}

// Dummy online fetch
async function fetchTeamMatchesOnline(teamName, isHome){
    let matches=[];
    for(let i=0;i<5;i++){
        matches.push({points: Math.floor(Math.random()*100), win: Math.random()>0.5});
    }
    return matches;
}

// Manual/auto prediction
async function predictMatch(){
    let input = document.getElementById("matchInput").value;
    let [homeTeam, awayTeam] = input.split("vs").map(x=>x.trim());
    if(!homeTeam || !awayTeam) return alert("Enter match as 'TeamA vs TeamB'");

    let homeManual = calculateManual("homeManual",true);
    let awayManual = calculateManual("awayManual",false);

    let homeScore = homeManual!==null ? homeManual :
                    (await fetchTeamMatchesOnline(homeTeam,true)).reduce((sum,m)=>sum+m.points,0)/5;
    let awayScore = awayManual!==null ? awayManual :
                    (await fetchTeamMatchesOnline(awayTeam,false)).reduce((sum,m)=>sum+m.points,0)/5;

    let prediction = homeScore>awayScore?"HOME ADVANTAGE":"AWAY ADVANTAGE";
    document.getElementById("result").innerHTML = `<b>${homeTeam}</b> Score: ${homeScore.toFixed(2)}<br>
        <b>${awayTeam}</b> Score: ${awayScore.toFixed(2)}<br><br>
        <b>Prediction: ${prediction}</b>`;
}

// ---------- SofaScore Official Algorithm Prediction ----------
async function getTeamId(teamName) {
    try {
        const response = await fetch(`https://api.sofascore.com/api/v1/search/teams/${encodeURIComponent(teamName)}`);
        const data = await response.json();
        if(data.teams && data.teams.length>0) return data.teams[0].id;
        return null;
    } catch(err){ console.error(err); return null; }
}

async function fetchLast5HomeAwayMatches(teamName, isHome){
    const teamId = await getTeamId(teamName);
    if(!teamId) return [];
    try {
        const response = await fetch(`https://api.sofascore.com/api/v1/team/${teamId}/events`);
        const data = await response.json();
        let events = data.events || [];
        events = events.filter(ev => isHome ? ev.homeTeam.id==teamId : ev.awayTeam.id==teamId).slice(0,5);
        return events.map(ev=>({
            points: isHome ? ev.homeScore.current : ev.awayScore.current,
            win: (isHome && ev.winnerCode==1) || (!isHome && ev.winnerCode==2)
        }));
    } catch(err){ console.error(err); return []; }
}

async function sofaScorePrediction(){
    let input = document.getElementById("sofaMatchInput").value;
    let [homeTeam, awayTeam] = input.split("vs").map(x=>x.trim());
    if(!homeTeam || !awayTeam) return alert("Enter match as 'TeamA vs TeamB'");

    const homeMatches = await fetchLast5HomeAwayMatches(homeTeam,true);
    const awayMatches = await fetchLast5HomeAwayMatches(awayTeam,false);

    function calc(matches){
        let total=0, adjust=0;
        matches.forEach(m=>{
            if(!m.points) return;
            total+=m.points;
            adjust += m.win?0.5:-1.5;
        });
        return total/5 + adjust;
    }

    const homeScore = calc(homeMatches);
    const awayScore = calc(awayMatches);

    let prediction = homeScore>awayScore?"HOME ADVANTAGE":"AWAY ADVANTAGE";

    document.getElementById("sofaResult").innerHTML = `<b>${homeTeam}</b> Score: ${homeScore.toFixed(2)}<br>
        <b>${awayTeam}</b> Score: ${awayScore.toFixed(2)}<br><br>
        <b>Prediction: ${prediction}</b>`;
}