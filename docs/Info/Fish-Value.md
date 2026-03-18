# Fish Value System

## Fish Price Formula

```
baseWeight = round(displayedWeight / sizeMultiplier, 1)
correctedWeight = baseWeight * sizeMultiplier
Value = math.round(correctedWeight * basevalue * starMultiplier * mutationMultiplier)
BoostedValue = round(Value * bonusMultiplier)
```


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

| Fish            | Rarity    | Base Value | Min Weight | Max Weight | Area                             |
| --------------- | --------- | ---------- | ---------- | ---------- | -------------------------------- |
| Blue Tang       | Common    | 14         | 0.32kg     | 1.68kg     | Forgotten Deep, Ocean            |
| Clownfish       | Common    | 12         | 0.8kg      | 3.36kg     | Forgotten Deep, Ocean            |
| Pufferfish      | Uncommon  | 13         | 1.6kg      | 6.72kg     | Forgotten Deep, Ocean            |
| Salmon          | Common    | 9          | 3.2kg      | 13.44kg    | Forgotten Deep, Ocean            |
| Sea Horse       | Rare      | 250        | 0.4kg      | 1.68kg     | Ocean                            |
| Piranha         | Rare      | 44         | 4kg        | 20.16kg    | Ocean, Angler Cave, Sunken Wilds |
| Blobfish        | Rare      | 75         | 6.4kg      | 33.6kg     | Ocean, Angler Cave               |
| Bluefin Tuna    | Legendary | 36         | 120kg      | 336kg      | Ocean                            |
| Tang            | Common    | 12         | 0.32kg     | 1.68kg     | Forgotten Deep                   |
| Lionfish        | Rare      | 20         | 1.6kg      | 11.75kg    | Forgotten Deep                   |
| Mahi Mahi       | Rare      | 8          | 6.4kg      | 33.6kg     | Forgotten Deep                   |
| Barracuda       | Epic      | 20         | 4.8kg      | 20.16kg    | Forgotten Deep                   |
| Cod             | Uncommon  | 18         | 3.2kg      | 20.16kg    | Ancient Sands                    |
| Grouper         | Rare      | 28         | 4.8kg      | 23.52kg    | Ancient Sands                    |
| Scorpionfish    | Rare      | 60         | 3.2kg      | 13.44kg    | Ancient Sands                    |
| Blackfin Tuna   | Uncommon  | 60         | 4.8kg      | 26.88kg    | Ancient Sands                    |
| Cavefish        | Epic      | 22         | 24kg       | 134.4kg    | Ancient Sands                    |
| Shark           | Epic      | 40         | 16kg       | 117.6kg    | Ocean, Ancient Sands             |
| Bigmouthfish    | Legendary | 76         | 16kg       | 84kg       | Ancient Sands                    |
| Ancient Shark   | Legendary | 50         | 72kg       | 218.4kg    | Ancient Sands                    |
| Pompano         | Common    | 14         | 1.6kg      | 13.44kg    | Ancient Sands                    |
| Sunfish         | Rare      | 17         | 16kg       | 67.2kg     | Spirit Roots                     |
| Narwhal         | Rare      | 18         | 24kg       | 84kg       | Spirit Roots                     |
| Pacific Fanfish | Common    | 20         | 4kg        | 20.16kg    | Spirit Roots                     |
| Napoleon        | Uncommon  | 20         | 8kg        | 42kg       | Spirit Roots                     |
| Jellyfish       | Uncommon  | 35         | 3.2kg      | 16.8kg     | Spirit Roots                     |
| Sailfish        | Epic      | 40         | 24kg       | 100.8kg    | Ocean, Spirit Roots              |
| Hammer Shark    | Epic      | 48         | 32kg       | 134.4kg    | Spirit Roots                     |
| Eyefish         | Legendary | 160        | 16kg       | 75.6kg     | Spirit Roots                     |
| Anglerfish      | Rare      | 35         | 24kg       | 100.8kg    | Angler Cave                      |
| Discus          | Common    | 25         | 4.8kg      | 23.52kg    | Sunken Wilds                     |
| Tambaqui        | Uncommon  | 18         | 24kg       | 75.6kg     | Sunken Wilds                     |
| Trout           | Uncommon  | 24         | 8kg        | 33.6kg     | Sunken Wilds                     |
| Sea Turtle      | Rare      | 20         | 48kg       | 142.8kg    | Sunken Wilds                     |
| Jaguar Shark    | Epic      | 50         | 56kg       | 184.8kg    | Sunken Wilds                     |
| Toucan Fish     | Epic      | 90         | 20kg       | 67.2kg     | Sunken Wilds                     |
| Sacabambaspis   | Legendary | 150        | 17.6kg     | 70.56kg    | Sunken Wilds                     |
| Boxfish         | Common    | 32         | 6.4kg      | 30.24kg    | Gloomspore Valley                |
| Stingray        | Common    | 35         | 9.6kg      | 40.32kg    | Gloomspore Valley                |
| Squid           | Uncommon  | 65         | 8kg        | 26.88kg    | Gloomspore Valley                |
| Atlantic Octopus| Uncommon  | 60         | 24kg       | 75.6kg     | Gloomspore Valley                |
| Catfish         | Uncommon  | 32         | 24kg       | 75.6kg     | Gloomspore Valley                |
| Largemouth Bass | Rare      | 65         | 20kg       | 58.8kg     | Gloomspore Valley                |
| Sockeye Salmon  | Rare      | 100        | 16kg       | 50.4kg     | Gloomspore Valley                |
| Surubim         | Rare      | 68         | 32kg       | 92.4kg     | Gloomspore Valley                |
| Manta Ray       | Epic      | 48         | 56kg       | 168kg      | Gloomspore Valley                |
| Basking Shark   | Epic      | 85         | 96kg       | 235.2kg    | Gloomspore Valley                |
| Phantom Jelly   | Epic      | 145        | 28kg       | 92.4kg     | Gloomspore Valley                |
| Alien           | Epic      | 140        | 40kg       | 117.6kg    | Gloomspore Valley                |
| Thresher Shark  | Epic      | 82         | 48kg       | 151.2kg    | Gloomspore Valley                |
| Angel           | Mythical  | 300        | 64kg       | 168kg      | Gloomspore Valley                |


## Mutations

| Mutation    | Price Mult | Size Mult | Area              |
| ----------- | ---------- | --------- | ----------------- |
| Poop        | 0.33x      | 1.333x    | Any               |
| Rock        | 1x         | 1.2x      | Forgotten Deep    |
| Moss        | 1.1x       | 1x        | Forgotten Deep    |
| Coral       | 1.1x       | 0.8x      | Any               |
| Metal       | 1.2x       | 1.2x      | Any               |
| Sand        | 1.25x      | 1x        | Ancient Sands     |
| Albino      | 1.3x       | 1x        | Any               |
| Transparent | 1.35x      | 1x        | Any               |
| Cactus      | 1.45x      | 1.3x      | Ancient Sands     |
| Banana      | 1.5x       | 1x        | Sunken Wilds      |
| Spirit      | 1.7x       | 1.2x      | Spirit Roots      |
| Fossil      | 1.75x      | 0.9x      | Ancient Sands     |
| Golden      | 2x         | 1.2x      | Any               |
| Negative    | 2x         | 1x        | Any               |
| Fairy       | 2.3x       | 1.2x      | Spirit Roots      |
| Invisible   | 2.4x       | 1.4x      | Any               |
| Liquid      | 2.5x       | 1.3x      | Any               |
| Grounded    | 2.8x       | 1.2x      | Sunken Wilds      |
| Neon        | 2.8x       | 1.2x      | Any               |
| Ultraviolet | 3.6x       | 1.8x      | Any               |
| Rooted      | 3.6x       | 1.5x      | Spirit Roots      |
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
| Abyssal     | 8.5x       | 1.5x      | Any               |


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