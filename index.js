const express = require('express')
const app = express()
const port = 3000

const Sim = require('pokemon-showdown');
stream = new Sim.BattleStream();



(async () => {
    for await (const output of stream) {
        console.log(output);
    }
})();

stream.write(`>start {"formatid":"gen7ou"}
>player p1 {"name":"Alice","team":"insert packed team here"}
>player p2 {"name":"Bob","team":"insert packed team here"}
>p1 team 123456
>p2 team 123456
>p1 move 1
>p2 switch 3
>p1 move 3
>p2 move 2`);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log(Sim.Teams.generate('gen7randombattle'))
