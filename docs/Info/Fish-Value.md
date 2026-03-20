# Fish Value System

## Fish Price Formula

```
baseWeight = round(displayedWeight / sizeMultiplier, 1)
correctedWeight = baseWeight * sizeMultiplier
Value = round(correctedWeight * baseValue * starMultiplier * mutationMultiplier)
BoostedValue = round(Value * bonusMultiplier)
```
> Credits to **@seb._.bas** on Discord for the correctedWeight formula

## Bonus Multiplier Formula

Artifact bonuses are **additive** with each other, then **multiplicative** with the race bonus:

```
artifactTotal = artifact1Bonus + artifact2Bonus + artifact3Bonus
bonusMultiplier = (1 + artifactTotal) * (1 + raceBonus)
bonusPercent = (bonusMultiplier - 1) * 100
```

## Roe $/hr Formula

```
mutationFactor = hasMutation ? 0.5 : 1.0
roePerHour = ceil(fishValue * 0.02 * mutationFactor) * (3600 / cycleTime)
```

Offline production runs at 50% rate.

## Star Quality

| Stars | Multiplier |
| ----- | ---------- |
| Dead  | 0.2x       |
| 1     | 0.5x       |
| 2     | 0.75x      |
| 3     | 1.0x       |


## Fish Data Table

| Fish                | Rarity    | Base Value | Base Min Weight | Base Max Weight | Catchable | Area                             |
| ------------------- | --------- | ---------- | --------------- | --------------- | --------- | -------------------------------- |
| Blue Tang           | Common    | 14         | 0.5kg           | 1kg             | Yes       | Forgotten Deep, Ocean            |
| Clownfish           | Common    | 12         | 1kg             | 2kg             | Yes       | Forgotten Deep, Ocean            |
| Pufferfish          | Uncommon  | 13         | 2kg             | 4kg             | Yes       | Forgotten Deep, Ocean            |
| Inflated Pufferfish | Uncommon  | 26         | 2kg             | 4kg             | Yes       | Forgotten Deep, Ocean            |
| Salmon              | Common    | 9          | 4kg             | 8kg             | Yes       | Forgotten Deep, Ocean            |
| Sea Horse           | Rare      | 250        | 0.5kg           | 1kg             | Yes       | Ocean                            |
| Piranha             | Rare      | 44         | 5kg             | 12kg            | Yes       | Ocean, Angler Cave, Sunken Wilds |
| Blobfish            | Rare      | 75         | 8kg             | 20kg            | Yes       | Ocean, Angler Cave               |
| Bluefin Tuna        | Legendary | 36         | 150kg           | 200kg           | Yes       | Ocean                            |
| Tang                | Common    | 12         | 0.5kg           | 1kg             | Yes       | Forgotten Deep                   |
| Lionfish            | Rare      | 20         | 2kg             | 6kg             | Yes       | Forgotten Deep                   |
| Mahi Mahi           | Rare      | 8          | 8kg             | 20kg            | Yes       | Forgotten Deep                   |
| Barracuda           | Epic      | 20         | 6kg             | 12kg            | Yes       | Forgotten Deep                   |
| Cod                 | Uncommon  | 18         | 4kg             | 12kg            | Yes       | Ancient Sands                    |
| Grouper             | Rare      | 28         | 6kg             | 14kg            | Yes       | Ancient Sands                    |
| Scorpionfish        | Rare      | 60         | 4kg             | 8kg             | Yes       | Ancient Sands                    |
| Blackfin Tuna       | Uncommon  | 60         | 6kg             | 16kg            | Yes       | Ancient Sands                    |
| Cavefish            | Epic      | 22         | 30kg            | 80kg            | Yes       | Ancient Sands                    |
| Shark               | Epic      | 40         | 20kg            | 70kg            | Yes       | Ocean, Ancient Sands             |
| Bigmouthfish        | Legendary | 76         | 20kg            | 50kg            | Yes       | Ancient Sands                    |
| Ancient Shark       | Legendary | 50         | 90kg            | 130kg           | Yes       | Ancient Sands                    |
| Pompano             | Common    | 14         | 2kg             | 8kg             | Yes       | Ancient Sands                    |
| Sunfish             | Rare      | 17         | 20kg            | 40kg            | Yes       | Spirit Roots                     |
| Narwhal             | Rare      | 18         | 30kg            | 50kg            | Yes       | Spirit Roots                     |
| Pacific Fanfish     | Common    | 20         | 5kg             | 12kg            | Yes       | Spirit Roots                     |
| Napoleon            | Uncommon  | 20         | 10kg            | 25kg            | Yes       | Spirit Roots                     |
| Jellyfish           | Uncommon  | 35         | 4kg             | 10kg            | Yes       | Spirit Roots                     |
| Sailfish            | Epic      | 40         | 30kg            | 60kg            | Yes       | Ocean, Spirit Roots              |
| Hammer Shark        | Epic      | 48         | 40kg            | 80kg            | Yes       | Spirit Roots                     |
| Eyefish             | Legendary | 160        | 20kg            | 45kg            | Yes       | Spirit Roots                     |
| Anglerfish          | Rare      | 35         | 30kg            | 60kg            | Yes       | Angler Cave                      |
| Discus              | Common    | 25         | 6kg             | 14kg            | Yes       | Sunken Wilds                     |
| Tambaqui            | Uncommon  | 18         | 30kg            | 45kg            | Yes       | Sunken Wilds                     |
| Trout               | Uncommon  | 24         | 10kg            | 20kg            | Yes       | Sunken Wilds                     |
| Sea Turtle          | Rare      | 20         | 60kg            | 85kg            | Yes       | Sunken Wilds                     |
| Jaguar Shark        | Epic      | 50         | 70kg            | 110kg           | Yes       | Sunken Wilds                     |
| Toucan Fish         | Epic      | 90         | 25kg            | 40kg            | Yes       | Sunken Wilds                     |
| Sacabambaspis       | Legendary | 150        | 22kg            | 42kg            | Yes       | Sunken Wilds                     |
| Boxfish             | Common    | 32         | 8kg             | 18kg            | Yes       | Gloomspore Valley                |
| Stingray            | Common    | 35         | 12kg            | 24kg            | Yes       | Gloomspore Valley                |
| Squid               | Uncommon  | 65         | 10kg            | 16kg            | Yes       | Gloomspore Valley                |
| Atlantic Octopus    | Uncommon  | 60         | 30kg            | 45kg            | Yes       | Gloomspore Valley                |
| Catfish             | Uncommon  | 32         | 30kg            | 45kg            | Yes       | Gloomspore Valley                |
| Largemouth Bass     | Rare      | 65         | 25kg            | 35kg            | Yes       | Gloomspore Valley                |
| Sockeye Salmon      | Rare      | 100        | 20kg            | 30kg            | Yes       | Gloomspore Valley                |
| Surubim             | Rare      | 68         | 40kg            | 55kg            | Yes       | Gloomspore Valley                |
| Manta Ray           | Epic      | 48         | 70kg            | 100kg           | Yes       | Gloomspore Valley                |
| Basking Shark       | Epic      | 85         | 120kg           | 140kg           | Yes       | Gloomspore Valley                |
| Phantom Jelly       | Epic      | 145        | 35kg            | 55kg            | Yes       | Gloomspore Valley                |
| Alien               | Epic      | 140        | 50kg            | 70kg            | Yes       | Gloomspore Valley                |
| Thresher Shark      | Epic      | 82         | 60kg            | 90kg            | Yes       | Gloomspore Valley                |
| Angel               | Mythical  | 300        | 80kg            | 100kg           | Yes       | Gloomspore Valley                |
| Whale               | Legendary | 40         | 120kg           | 220kg           | No        | Spirit Roots                     |
| Dragonfish          | Mythical  | 70         | 150kg           | 250kg           | No        | Spirit Roots                     |
| King Anglerfish     | Mythical  | 45         | 150kg           | 250kg           | No        | Angler Cave                      |
| Mosasaurus          | Legendary | 50         | 150kg           | 240kg           | No        | Sunken Wilds                     |
| Pelican Eel         | Mythical  | 75         | 175kg           | 285kg           | No        | Sunken Wilds                     |
| Orca                | Legendary | 63         | 200kg           | 280kg           | No        | Gloomspore Valley                |
| Sea Angel           | Legendary | 75         | 260kg           | 320kg           | No        | Gloomspore Valley                |

> **Note:** Boss fish weights shown are the full fish weight. Each kill drops 3 equal pieces, so each piece weighs `totalWeight / 3`. The app divides by 3 automatically when logging boss drops.


## Mutations

| Mutation    | Price Mult | Size Mult | Area              |
| ----------- | ---------- | --------- | ----------------- |
| Poop        | 0.333x     | 1.333x    | Any               |
| Rock        | 1x         | 1.2x      | Forgotten Deep    |
| Moss        | 1.1x       | 1x        | Forgotten Deep    |
| Coral       | 1.1x       | 0.8x      | Any               |
| Metal       | 1.2x       | 1.2x      | Any               |
| Sand        | 1.25x      | 1x        | Ancient Sands     |
| Albino      | 1.3x       | 1x        | Any               |
| Transparent | 1.35x      | 1x        | Any               |
| Cactus      | 1.45x      | 1.3x      | Ancient Sands     |
| Banana      | 1.5x       | 1.1x      | Sunken Wilds      |
| Spirit      | 1.7x       | 1.2x      | Spirit Roots      |
| Fossil      | 1.75x      | 0.9x      | Ancient Sands     |
| Golden      | 2x         | 1.2x      | Any               |
| Negative    | 2x         | 1x        | Any               |
| Fairy       | 2.3x       | 1.2x      | Spirit Roots      |
| Invisible   | 2.4x       | 1.4x      | Any               |
| Liquid      | 2.5x       | 1.3x      | Any               |
| Grounded    | 2.8x       | 1.2x      | Sunken Wilds      |
| Neon        | 2.8x       | 1.2x      | Any               |
| Ultraviolet | 3.6x       | 1.3x      | Any               |
| Rooted      | 3.6x       | 1.2x      | Spirit Roots      |
| Toxic       | 3.75x      | 1.2x      | Any               |
| Jade        | 4x         | 1x        | Sunken Wilds      |
| Spore       | 2x         | 1.2x      | Gloomspore Valley |
| Amber       | 2.8x       | 0.8x      | Gloomspore Valley |
| Crystal     | 4.2x       | 1.2x      | Gloomspore Valley |
| Gloomy      | 6.8x       | 1.3x      | Gloomspore Valley |
| Cupid       | 1.4x       | 1x        | Any               |
| Lonely      | 2x         | 1x        | Any               |
| Shadow      | 6.66x      | 1.11x     | Any               |
| Angelic     | 7.77x      | 1.4x      | Any               |
| Abyssal     | 8.5x       | 1.4x      | Any               |


## Lucky Spawn

There is a **3% chance** during any fish spawn to trigger a **Lucky Spawn**, which calculates the fish's weight using an extended range. Instead of picking a weight between the fish's `baseMinWeight` and `baseMaxWeight`, it picks a value between `baseMaxWeight` and `baseMaxWeight * 1.2`. 
This extra weight is added to the fish before any mutation multipliers are applied.

The effective maximum possible weight for a fish is therefore:
```
maxWeight = baseMaxWeight * 1.2 * mutationSizeMultiplier
```

> *Note: Since the game calculates whether a fish is tiny, small, normal, big, or giant by normalizing the mutation weight multiplier to only take the base weight into account, any fish that triggers this 3% Lucky Spawn is automatically categorized by the game as a **Giant**, *meaning you can technically have a **Big** fish that is heavier than a **giant** fish if the mutations are different.*

## Cycle Times

| Rarity    | Cycle |
| --------- | ----- |
| Common    | 60s   |
| Uncommon  | 120s  |
| Rare      | 240s  |
| Epic      | 420s  |
| Legendary | 600s  |
| Mythical  | 900s  |


## Fish Capacity

| Level | Max Fish |
| ----- | -------- |
| 0     | 6        |
| 1     | 8        |
| 2     | 10       |
| 3     | 12       |
| 4     | 14       |
| 5     | 16       |
| 6     | 18       |


## Roe Storage

| Level | Capacity |
| ----- | -------- |
| 0     | 500 kg   |
| 1     | 800 kg   |
| 2     | 1500 kg  |
| 3     | 2000 kg  |
| 4     | 2750 kg  |
| 5     | 3500 kg  |
| 6     | 5500 kg  |


## Decoration (Roe Speed)

| Level | Roe Speed |
| ----- | --------- |
| 0     | +0%       |
| 1     | +5%       |
| 2     | +10%      |
| 3     | +15%      |
| 4     | +20%      |
| 5     | +25%      |
| 6     | +30%      |


## Fish Feed

| Feed         | Roe Speed | Duration |
| ------------ | --------- | -------- |
| Algae Feed   | +5%       | 15 min   |
| Fish Feed    | +10%      | 20 min   |
| Worm Feed    | +15%      | 30 min   |
| Shrimp Feed  | +20%      | 45 min   |
| Octapus Feed | +30%      | 60 min   |
| Star Feed    | +40%      | 2 hr     |


## Races

| Race       | Cash Bonus |
| ---------- | ---------- |
| Spirit     | +8%        |
| Anglerfish | +8%        |
| Shark      | +10%       |
| Kraken     | +15%       |
| Sea Angel  | +15%       |


## Artifacts

Players can equip up to **3 artifacts** at a time.

| Artifact           | Cash Bonus     | Limit |
| ------------------ | -------------- | ----- |
| The King's Fortune | +10%           | 1     |
| Coins              | +1.25% - +1.4% | Any   |


## Artifact Tiers

| Tier           |
| -------------- |
| Tier I         |
| Tier II        |
| Tier III       |
| Tier IV        |
| Tier V         |
| Tier VI        |
| Tier VII       |

---