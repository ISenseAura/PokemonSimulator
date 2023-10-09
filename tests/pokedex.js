var PokeDex = require('pokemon-showdown').Dex;
var expect = require('chai').expect

describe("PokeDex IDs Test", function () {
   it ("should return a pokemon 'wynaut' with ID 360", function() {

    for (const pokemon of PokeDex.species.all()) {
      if (pokemon.num === targetNum) {
        let target = pokemon.baseSpecies;
        console.log(target);
        break;
      }
    }  expect(PokeDex.species.get("wynaut").exists).to.equal(true);
   })
})
