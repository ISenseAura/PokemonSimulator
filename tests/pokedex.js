var PokeDex = require('pokemon-showdown').Dex;
var expect = require('chai').expect

describe("PokeDex IDs Test", function () {
   it ("should return a pokemon 'wynaut' with ID 360", function() {

    //console.log(PokeDex.abilities.all()[1]);
    //return;
    for (const pokemon of PokeDex.abilities.all()) {
      if (pokemon.name === "Shadow Tag") {
        let target = pokemon;
        console.log(target);
        break;
      }
    }  expect(PokeDex.species.get("wynaut").exists).to.equal(false);
   })
})
