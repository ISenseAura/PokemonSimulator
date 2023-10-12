const { WebSocket } = require("ws");
const http = require("http");
const express = require("express");

const app = express();
const cors = require("cors");
const server = http.createServer(app);

var UAParser = require("ua-parser-js");

(() => {
  try {
    require("./globals");
  } catch (e) {
    throw new Error(e);
  }
})();

const users = require("./users");
const { SingleBattle } = require("./battles");
const { initUser, verifyUser, hasGuest, addGuest } = require("./login");
const { verify } = require("crypto");
const { TeamValidator } = require("@pkmn/sim");

global.battles = {};

global.illinfo = {}; // nawty horhe

app.use(
  cors({
    origin: "*",
  })
);

let sessions = {};

function generateSessionID() {
  let ID = Tools.generateKey(16);
  if(sessions[ID]) return generateSessionID();
  return ID;
}

function generateSecret() {
  let secret = Tools.generateKey(4);
  if (battles[secret]) return generateSecret();
  return Tools.toId(secret);
}

const { Guest } = require("./users");

function generateGuest(ws, agent) {

  let id = Guests.new(ws,agent)
  ws.send("%initguest%" + Guests.guests[id].name)
  return Guests.guests[id].id;



  /*
return hasGuest(id,(val) => {
  if(val) return generateGuest(ws,agent);
  if(Guests[id]) return generateGuest(ws,agent)

  Guests[id] = new Guest(name,ws,agent);
  ws.send("%initguest%" + name);
  return id;
});
*/
}

battles["test"] = new SingleBattle("gen7ou", false, false, false, "test");
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  ws.sessionID = generateSessionID();
  sessions[ws.sessionID] = ws;
  ws.on("message", (message) => {
    message = message.toString();
    // console.log(message);
    var parser = new UAParser();
    var ua = req.headers["user-agent"];
    var agent = parser.setUA(ua).getResult();
    let IP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    agent.ip = IP;

    if (message.charAt(0) == "%") {
      console.log(message);

      let data = message.split("%");
      let secret = data[2];
      let participant = Tools.toId(data[3]);
      let token = data[4];
      if(token) { 
        if(token.startsWith("Guest")) {
          token = "Guest"
          participant = "spect";
        } 
      }
      if (token) {
        if (token.includes("|")) token = data[4].split("|")[0];
      }
      // console.log(token);

      // if(!battles[secret.trim()]) return ws.send('/error Battle does not exists');
      //  if(participant && !token) return ws.send('/error you need to login first');
      //if(!verifyToken(token)) return ws.send('/error unauthorised');

      // % j % secret % participant? % token
      // % login % username % password
      switch (data[1]) {
        case "j":
          {
            if (!battles[secret.trim()])
              return ws.send("/error battle does not exist|" + secret.trim());
            if (participant == "spect") {
              console.log("NOT A PARTICIPANT");
              if (token.startsWith("Guest") || token.startsWith("guest")) {
                let guestID =
                  token.length > 5
                    ? Tools.toId(token)
                    : generateGuest(ws, agent, ws.send);
                console.log(guestID);
                let user = Guests.guests[guestID];
                
              
                battles[secret].users[guestID] = Guests.guests[guestID];
                let c = `${battles[secret].id} \n|j|${user.name}`;
                battles[secret].sendAllExcept(c, false);
              } else {
                console.log("Adding Spect");
                if (token.includes("uest") || token.length < 10) return;
                console.log("Adding Spectator")
                let u = jwt.verify(token, jwtKey);
                let c = `${battles[secret].id} \n|j|${u.name}`;
                battles[secret].sendAllExcept(c, false);
                initUser(u, ws);
                if (!u.socket) u.socket = ws;
         
                battles[secret].users[token] = u;
              }
              ws.send("%j%" + battles[secret].id.replace(">", ""));
            //  console.log(battles[secret].spectatorLogs);
              battles[secret].spectatorLogs.forEach((log) => {
                ws.send(log);
              });
            } else {
              let user = jwt.verify(token, jwtKey);
              if (!user) return ws.send("/error User not authenticated");
             let res = battles[secret].addPlayer({
                name: user.name,
                id: user.id,
                teams: false,
                socket: ws,
              });

              user.agent = agent;
              user.ip = Users[user.id] ? Users[user.id].ip + "|" + IP : IP;
              Users[user.id] = user;
              agent.ip = IP;
              if(DB.useragents[user.id]) {
               if(!DB.useragents[user.id].ips.includes(IP)) DB.useragents[user.id].ips.push(IP);
               DB.useragents[user.id].agent = agent;
              }
              else {
               DB.useragents[user.id] = { agent : agent, ips : [IP]};
              }
              DB.exportDatabase("useragents")
              

              if(res && res == "spect") {
                
                ws.send("%notpart%" + battles[secret].id);
              }
          
              let isPlayer = battles[secret].hasPlayer(user.id);
              if (isPlayer) battles[secret][isPlayer].socket = ws;
              ws.send("%j%" + battles[secret].id.replace(">", ""));

              if (
                battles[secret].p1 &&
                battles[secret].p2 &&
                battles[secret].isStarted
              ) {
                if (battles[secret].p1.id == user.id) {
                  battles[secret].p1log.forEach((log) => {
                    ws.send(log);
                    return;
                  });
                }
                if (battles[secret].p2.id == user.id) {
                  battles[secret].p2log.forEach((log) => {
                    battles[secret].p1.socket.send("");
                    ws.send(log);
                    return;
                  });
                }
              }
              let c = `${battles[secret].id} \n|j|${user.name}`;
              battles[secret].sendAllExcept(c, false);

              if (!battles[secret].isStarted) return battles[secret].init();

              //  ws.send(battles[secret].id + "\n" + battles[secret].outputLogs);
            }
          }

          break;

        case "l":
          {

            battles[secret].users[token] = ws;
            let c = `${battles[secret].id} \n|j|${u.name}`;
             //   battles[secret].sendAllExcept(c, false);
          }

          break;

        case "initguest":
          {
            let guestID = generateGuest(ws, agent, ws.send);
            console.log("--------------- Initing Guest ------------")
          }
          break;

        case "requireTeam":
          {
            if (!battles[secret]) return ws.send("%nobattle%" + secret);
            if (battles[secret].allowTeams)
              return ws.send("%requiresteam%" + secret + "%true");
            return ws.send("%requiresteam%" + secret + "%false");
          }
          break;

        case "validateTeam":
          {
            if (!battles[secret]) return ws.send("%nobattle%" + secret);
            if (!battles[secret].allowTeams)
              return ws.send("%requiresteam%" + secret + "%false");
            let validator = new TeamValidator(battles[secret].format);
            if (typeof team == typeof {})
              outputs[i] = validator.validateTeam(team);
            if (typeof team == typeof "") {
              outputs[i] = validator.validateTeam(Teams.import(team));
              teams[i] = Teams.import(team);
            }
          }
          break;

        case "isBattle":
          {
            if (battles[secret])
              return ws.send("%j%" + battles[secret].id.replace(">", ""));
            ws.send("%nobattle%" + secret);
          }
          break;

        case "hasBattle":
          {
            if (battles[secret]) return;
            ws.send("%nobattle%" + secret);
          }
          break;

        case "hasReplay":
          {
            console.log(DB.data);
            console.log(secret);
            if (secret.includes("|")) secret = secret.split("|")[0].trim();
            if (DB.data[secret]) return ws.send("%j%" + secret);
            ws.send("%noreplay%" + secret);
          }
          break;

        case "login":
          {
            let username = data[2];
            let password = data[3];
            login(username, password, ws).then((response) => {
              if (response) {
                if (response === true) {
                  initUser(username, ws).then((token) => {
                    ws.send("%login%" + token);
                    if(Users[token]) Users[token].send("%sessionexpired%");
                    Users[token] = ws;
                  });
                } else {
                  ws.send("%loginfail%" + response);
                }
              } else {
                ws.send("%loginfail%User Doesnt exist");
              }
            });
          }

          break;

        case "signup":
          {
            let username = data[2];
            let password = data[3];
            if (Tools.toId(username).includes("guest"))
              return ws.send("%loginfail%" + "Username cannot include 'Guest'");
            signup(username, password, false);
            setTimeout(() => {
              initUser(Tools.toId(username, ws)).then((token) => {
                if (token) return ws.send("%login%" + token);
                if(Users[Tools.toId(username)]) return ws.send("%login%" + Users[Tools.toId(username)].token);
              });
            }, 1000);
          }

          break;

        case "validateToken":
          {
            // console.log(user);
            if (data[3] == "Guest") return;

            data[2] = Tools.toId(data[2]);
            let v = verifyUser(data[2], data[3].split("|")[0]);
            console.log(v);
            console.log(data[2]);
            if (v) {
              let user = Users[data[2].trim()];
              console.log(user);
              if(!user || typeof user != typeof {}) {

              ///  ws.send("%sessionexpired%");
              ////  ws.send("%tokenexpired%");
                return;
              }  
             if(user.password) delete user.password;
              //   console.log(user);
              JSON.stringify(Users[data[2].trim()]);
             if(Users[token]  && Users[token].sessionID != ws.sessionID)  Users[token].send("%sessionexpired%");
              Users[token] = ws;
              ws.send("%tokenverified%" + JSON.stringify(user));
            } else {
              ws.send("%tokenexpired%");
            }
          }
          break;

        case "getuser":
          {
            // console.log(user);
            if (data[2] == "Guest") return;

            let v = getUser(data[2]);
            if (v) {
              console.log(v);

              delete v.password;
              ws.send("%userdata%" + JSON.stringify(v));
            } else {
              ws.send("%tokenexpired%");
            }
          }
          break;

        case "logout":
          {
            // console.log(user);
            if (data[2] == "Guest") return;

            let v = getUser(data[2]);
            if (v) {
              console.log(Users[v.id]);

              delete Users[v.id];
              ws.send("%logout%" + JSON.stringify(v));
            } else {
              ws.send("%tokenexpired%");
            }
          }
          break;
      }
    } else if (message.charAt(0) == "/") {
      console.log(message);
      if (message.startsWith("/illinfo")) {
        console.log(message);

        let opts = message.split("|");
        console.log(opts);
        let move = opts[0].replace("/illinfo ", "");
        let secret = opts[1].split("-")[2];
        let token = opts[2];
        let user = jwt.verify(token, jwtKey);
        if (!illinfo[secret]) illinfo[secret] = {};
        illinfo[secret][user.id] = move;
      }


      if (message.startsWith("/eval")) {
        console.log(message);

        let opts = message.split("|");
        console.log(opts);
        let msg = opts[0].replace("/eval ", "");
        let secret = opts[1].split("-")[2];
        let token = opts[2];
        let user = jwt.verify(token, jwtKey);
       
       if(user.id !== "zarel") return   ws.send(
        battles[secret].id +
          " \n|error|" +
          "Access denied"
      );


      let result = null;
      try {
        result = JSON.stringify(eval(msg));
      }
      catch(e) {
        result = e.message;
        ws.send(
          battles[secret].id +
            " \n|raw|" +
            `<div style='padding:2px;color:red;border:1px solid grey;'> <b> Evaluation Error : <br>  </b>  ${result}    </div>`
        );
        return;
      }

      ws.send(
        battles[secret].id +
          " \n|raw|" +
          `<div style='padding:2px;color:green;border:1px solid grey;'> <b> Evaluation Success </b> <br>    ${result}    </b></div>`
      );


      }

      if (message.startsWith("/getillinfo")) {
        console.log(message);

        let opts = message.split("|");
        console.log(opts);
        let pass = opts[0].replace("/getillinfo ", "").trim();
        let secret = opts[1].trim();

        if (pass !== "SoundWaveSuperior") return console.log("Wrong password");
        if (!illinfo[secret])
          return console.log("no illegal nfo for this battle");
        ws.send(
          battles[secret].id +
            " \n|getillinfo|" +
            JSON.stringify(illinfo[secret])
        );
      }

      if (message.slice(1, 5) == "join") {
        let opts = message.split("|");
        let roomName = opts[0].split(" ")[1];
        let secret = roomName.split("-")[2];
        let token = opts[3];

        if (!roomName || !secret) return;
        // let user = jwt.verify(token, jwtKey);
        console.log(roomName);
        console.log(secret);
        //  console.log(user);
        let battle = secret.endsWith("replay")
          ? DB.data[roomName]
          : battles[secret];
        if (!battle)
          return ws.send("/error battle or it's replay does not exist");
      }

      if (message.slice(1, 5) == "team") {
        let opts = message.split("|");
        let secret = opts[2].split("-")[2];
        let token = opts[3];
        let user = jwt.verify(token, jwtKey);
        console.log(opts);
        console.log(secret);
        //  console.log(user);
        let battle = battles[secret];
        if (!battle) return ws.send("/error battle does not exist");
        if (user && user.name) {
          battle.makeMove(user, opts[0]);
        }
      } else if (message.slice(1, 7) == "choose") {
        let opts = message.split("|");
        console.log(opts);
        let secret = opts[2].split("-")[2];
        let token = opts[3];
        let user = jwt.verify(token, jwtKey);

        let battle = battles[secret];
        if (!battle) return ws.send("/error Battle does not exists");
        if (user && user.name) {
          battle.makeMove(user, opts[0].replace("choose", ""));
        }
      } else if (message.slice(1, 6) == "timer") {
        let opts = message.split("|");
        console.log(opts);
        let secret = opts[1].split("-")[2];
        let token = opts[2];
        let user = jwt.verify(token, jwtKey);
        console.log(opts);
        console.log(secret);
        console.log(user);
        let battle = battles[secret];
        if (!battle) return ws.send("/error Battle does not exists");
        if (user && user.name) {
          battle.makeMove(user, opts[0].trim());
        }
      } else if (message.slice(1, 8) == "forfeit") {
        let opts = message.split("|");
        console.log(opts);
        let secret = opts[1].split("-")[2];
        let token = opts[2];
        let user = jwt.verify(token, jwtKey);
        console.log(opts);
        console.log(secret);
        console.log(user);
        let battle = battles[secret];
        if (!battle) return ws.send("/error Battle does not exists");
        if (user && user.name) {
          console.log("calling battle.forfeit");
          battle.forfeit(user);
        }
      } else if (message.slice(1, 11) == "savereplay") {
        let opts = message.split("|");
        console.log(opts);
        let secret = opts[1].split("-")[2];
        let token = opts[2];
        let user = jwt.verify(token, jwtKey);
        console.log(opts);
        let battle = battles[secret];
        if (!battle) return ws.send("/error Battle does not exists");
        if (user && user.name) {
          let unique = battle.createdOn.split(" ")[0].split("-").join("");
// time/tick|winner name|replay name|user1 name|user2 name|user 1 IP|user 2 IP|user1 browser agent|user 2 browser agent
          let details = "|DETAILS|";
          let tick = new Date().getTime();
          let winner = battle.winner ? battle.winner : "Tie";
          let u1n = battle.p1.name;
          let u2n = battle.p2.name;
          let ip1 = Users[battle.p1.id].ip;
          let ip2 = Users[battle.p2.id].ip;
          let ba1 = JSON.stringify(Users[battle.p1.id].agent);
          let ba2 = JSON.stringify(Users[battle.p2.id].agent);

          details += `${tick}|${winner}|${u1n}|${u2n}|${ip1}|${ip2}|${ba1}|${ba2}|DETAILS|`;

         let final = battle.spectatorLogs;
         final.push(details);
          //  let r = { id : battle.id, rid : battle.id + unique + "replay", logs : (battle.spectatorLogs)}
          DB.data[battle.id.replace(">", "") + unique + "replay"] =
            final;
          DB.exportDatabase(battle.id.replace(">", "") + unique + "replay");

          ws.send(
            "|popup| Your replay was successfully uploaded. This is your replay secret through which you can access this replay \n SECRET : " +
              battle.id +
              unique +
              "replay" +
              " \n  you will be redirected to the replay tab"
          );
          //  ws.send("%viewreplay%" + battle.id.replace(">","") + unique + "replay")
        }
      } else if (message.slice(1, 11) == "viewreplay") {
        let opts = message.split("|");
        console.log(opts);
        let secret = opts[0].split(" ")[1];
        console.log(secret);

        let code = secret.split("-")[2].slice(0, 4);
        let arr = secret.split("-");
        arr[2] = code;
        let battleID = arr.join("-");

        console.log(battleID);
        let battle = DB.data[secret.replace(">", "")];
        if (!battle) return ws.send("/error Replay does not exists");
        battle.forEach((log) => {
          
         if(!log.includes("|DETAILS|")) ws.send(log.replace(battleID, secret));
          return;
        });
      }
    } else if (message.slice(1, 8) == "chatmsg" || message.slice(1, 8) == "cm") {
      console.log(message);
      let opts = message.split("|");
      let msg = opts[0].replace("/chatmsg","");;
      let secret = opts[1].split("-")[2];
      let token = opts[2];
      let battle = battles[secret];
      if (!battle) return ws.send("/error battle does nott exist");
      // if(token.startsWith("Guest") || token.startsWith("guest")) return ws.send(`${battle.id}\n|error|You need to be logged in to chat in battles`);
      let user = token.startsWith("Guest")
        ? Guests.guests[Tools.toId(token)]
        : jwt.verify(token, jwtKey);

       user.agent = agent;
       user.ip = Users[user.id] ? Users[user.id].ip + "|" + IP : IP;
       Users[user.id] = user;
       agent.ip = IP;
       if(DB.useragents[user.id]) {
        if(!DB.useragents[user.id].ips.includes(IP)) DB.useragents[user.id].ips.push(IP);
        DB.useragents[user.id].agent = agent;
       }
       else {
        DB.useragents[user.id] = { agent : agent, ips : [IP]};
       }
       DB.exportDatabase("useragents")

      console.log(opts);
      console.log(secret);
      //  console.log(user);
      console.log(user);
      if (!battle) return ws.send("/error battle does nott exist");
      if (user && user.name) {
       /* if (!battle.isStarted &&)
          return ws.send(
            `${battle.id}\n|error|Due to spam reasons you can only chat after the battle starts`
          );*/

        battle.broadcastAll(
          `${battle.id}\n|c|${
            battle.isPlayer(user.id) ? "#" + user.name : user.name
          }|${msg}`
        );
       if(battle.p1.socket) battle.p1.socket.send(
          `${battle.id}\n|c|${
            battle.isPlayer(user.id) ? "#" + user.name : user.name
          }|${msg}`
        );
        if(battle.p2.socket) battle.p2.socket.send(
          `${battle.id}\n|c|${
            battle.isPlayer(user.id) ? "#" + user.name : user.name
          }|${msg}`
        );
        battle.spectatorLogs.push(
          `${battle.id}\n|c|${
            battle.isPlayer(user.id) ? "#" + user.name : user.name
          }|${msg}`
        );
        battle.p1log.push(
          `${battle.id}\n|c|${
            battle.isPlayer(user.id) ? "#" + user.name : user.name
          }|${msg}`
        );
        battle.p2log.push(
          `${battle.id}\n|c|${
            battle.isPlayer(user.id) ? "#" + user.name : user.name
          }|${msg}`
        );
      }
    }
  });
  ws.send("Hi there, I am a WebSocket server");
});

app.use(express.json());

app.post("/create", (req, res) => {
  if (!req.body) return res.status(400);
  if (!req.body.format) res.status(400);

  let secret = generateSecret();
  if (req.body.secret) secret = req.body.secret;

  let teams = req.body.teams;
  let format = Tools.toId(req.body.format);

  if (req.body.secret && battles[secret])
    return res.send("That battle already exists");

  console.log(req.body);
  if (teams && !format.includes("random") && !req.body.randteam) {
    let outputs = [];
    teams.forEach((team, i) => {
      console.log(team);
      let validator = new TeamValidator(format);
      if (typeof team == typeof {}) outputs[i] = validator.validateTeam(team);
      if (typeof team == typeof "") {
        outputs[i] = validator.validateTeam(Teams.import(team));
        teams[i] = Teams.import(team);
      }
    });
    console.log(outputs);
    if (outputs[0]) {
      let payload = "ERR Team Validation Failed : ";
      outputs.forEach((output, i) => {
        payload += `[TEAM ${i + 1}] - ${output.join(", ")} `;
      });
      res.send({ success: false, data: payload });
      return;
    }
  }

  try {
    battles[secret] = new SingleBattle(format, false, false, teams, secret);
    battles[secret].allowTeams = req.body.allowTeams;
  } catch (e) {
    console.error(e);
    res.status(401);
  }

  battles[secret].logAll("|notstarted| \n |slotsupdate|2");

  res.status(200).send({ success: true, data: secret });
});

app.get("/test",(req,res) => {
  res.send("server running")
})

app.post("/join", (req, res) => {
  if (!req.body) return res.status(400);
  if (!req.body.secret) res.status(400);
  if (req.body.secret && !battles[secret])
    return res.send("That battle doesnt exist");

  try {
    battles[secret] = new SingleBattle(
      format,
      false,
      false,
      req.body.randteam ? false : teams
    );
  } catch (e) {
    console.error(e);
    res.status(401);
  }

  res.status(200).send(secret);
});


console.log(DB.data);

if (!DB.data["replays"]) DB.data["replays"] = {};
if (!DB.data["guests"]) DB.data["guests"] = {};
if (!DB["useragents"]) DB["useragents"] = {};

DB.importDatabases();


server.listen(process.env.PORT || 8000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
