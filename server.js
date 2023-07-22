const { WebSocket } = require("ws");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

(() => {
  try {
    require("./globals");
  } catch (e) {
    throw new Error(e);
  }
})();

global.battles = {};



function generateSecret() {
  let secret = Tools.generateKey(4);
  if (battles[secret]) return generateSecret();
  return Tools.toId(secret);
}

const users = require("./users");
const { SingleBattle } = require("./battles");
const { initUser, verifyUser } = require("./login");
const { verify } = require("crypto");
const { TeamValidator } = require("@pkmn/sim");

battles["test"] =  new SingleBattle("gen7ou",false,false,false,"test");
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    message = message.toString();
   console.log(message);

    if (message.charAt(0) == "%") {
      let data = message.split("%");
      let secret = data[2];
      let participant = Tools.toId((data[3]));
      let token = data[4];
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
              console.log("NOT A PARTICIPANT")
              if(token.startsWith("Guest") || token.startsWith("guest"))  {

                battles[secret].guests.push(ws);
              }
              else {
              battles[secret].users[token] = ws;
              }
              ws.send("%j%" + battles[secret].id.replace(">", ""));
              console.log(battles[secret].spectatorLogs)
              ws.send(
               battles[secret].spectatorLogs.join("")
              );
            } else {
              let user = jwt.verify(token, jwtKey);
              if (!user) return ws.send("/error User not authenticated");
              battles[secret].addPlayer({
                name: user.name,
                id: user.id,
                teams: false,
                socket: ws,
              });
              let isPlayer = battles[secret].hasPlayer(user.id);
              if(isPlayer) battles[secret][isPlayer].socket = ws;
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
                    ws.send(log);
                    return;
                  });
                }
              }
              
              if(!battles[secret].isStarted) return battles[secret].init();

              //  ws.send(battles[secret].id + "\n" + battles[secret].outputLogs);
            }
          }

          break;

        case "l":
          {
            battles[secret].users[token] = ws;
            battles[secret].users[token].send("/l " + secret);
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
              if (battles[secret])
                return ;
              ws.send("%nobattle%" + secret);
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
            signup(username, password, false);
            setTimeout(() => {
              initUser(Tools.toId(username,ws)).then((token) => {
                if(token) ws.send("%login%" + token)
              })
            },1000)
          }

          break;

        case "validateToken":
          {
           // console.log(user);
           if(data[3] == "Guest") return;

            let v = verifyUser(data[2], data[3]);
            console.log(v);
            console.log(data[2]);
            if (v) {
              let user = Users[data[2].trim()];
              delete user.password;
           //   console.log(user);
              JSON.stringify(Users[data[2].trim()]);
              ws.send("%tokenverified%" + JSON.stringify(user));
            } else {
              ws.send("%tokenexpired%");
            }
          }
          break;

          
        case "getuser":
          {
           // console.log(user);
           if(data[2] == "Guest") return;

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
             if(data[2] == "Guest") return;
  
              let v = getUser(data[2]);
              if (v) {
                console.log(Users[v.id]);
               
               delete Users[v.id]
                ws.send("%logout%" + JSON.stringify(v));
              } else {
                ws.send("%tokenexpired%");
              }
            }
            break;
      }
    } else if (message.charAt(0) == "/") {
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
        console.log(opts);
        console.log(secret);
        console.log(user);
        let battle = battles[secret];
        if (!battle) return ws.send("/error Battle does not exists");
        if (user && user.name) {
          battle.makeMove(user, opts[0].replace("choose", ""));
        }
      }
    }
    else if(message.includes("|")) {
      let opts = message.split("|");
      let msg = opts[0];
      let secret = opts[1].split("-")[2];
      let token = opts[2];
      let battle = battles[secret];
      if (!battle) return ws.send("/error battle does nott exist");
      if(token.startsWith("Guest") || token.startsWith("guest")) return ws.send(`${battle.id}\n|error|You need to be logged in to chat in battles`);
      let user = jwt.verify(token, jwtKey);

      console.log(opts);
      console.log(secret);
    //  console.log(user);

      if (!battle) return ws.send("/error battle does nott exist");
      if (user && user.name) {
        
        battle.broadcastAll(`${battle.id}\n|c|${battle.isPlayer(user.id) ? "#" + user.name : user.name}|${msg}`);
        battle.p1.socket.send(`${battle.id}\n|c|${battle.isPlayer(user.id) ? "#" + user.name : user.name}|${msg}`);
        battle.p2.socket.send(`${battle.id}\n|c|${battle.isPlayer(user.id) ? "#" + user.name : user.name}|${msg}`);
        battle.spectatorLogs.push(`${battle.id}\n|c|${battle.isPlayer(user.id) ? "#" + user.name : user.name}|${msg}`);
        battle.p1log.push(`${battle.id}\n|c|${battle.isPlayer(user.id) ? "#" + user.name : user.name}|${msg}`);
        battle.p2log.push(`${battle.id}\n|c|${battle.isPlayer(user.id) ? "#" + user.name : user.name}|${msg}`);
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

    if(teams) {
      let outputs = [];
      teams.forEach((team,i) => {
        let validator = new TeamValidator(format);
        if(typeof team == typeof {}) outputs[i] = validator.validateTeam(team);
        if(typeof team == typeof "") outputs[i] = validator.validateTeam(JSON.parse(team));
      })
      console.log(outputs);
      if(outputs.length) {
        let payload = "ERR Team Validation Failed : ";
        outputs.forEach((output,i) => {
          payload += `[TEAM ${i + 1}] - ${output.join(", ")} `;
        })
        res.send(payload);
        return;
      }
      

     
    }

  try {
    battles[secret] = new SingleBattle(format, false, false, teams, secret);
  } catch (e) {
    console.error(e);
    res.status(401);
  }

  battles[secret].logAll("|notstarted| \n |slotsupdate|2");

  res.status(200).send(secret);
});

app.post("/join", (req, res) => {
  if (!req.body) return res.status(400);
  if (!req.body.secret) res.status(400);
  if (req.body.secret && !battles[secret])
    return res.send("That battle doesnt exist");

  try {
    battles[secret] = new SingleBattle(format, false, false, teams);
  } catch (e) {
    console.error(e);
    res.status(401);
  }

  res.status(200).send(secret);
});

server.listen(process.env.PORT || 8000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});